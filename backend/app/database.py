import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.mongo_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db = None
        self.is_mongo_connected = False
        self.local_db_path = os.path.join(settings.DATA_DIR, "db_storage.json")
        self._init_local_db()

    def _init_local_db(self):
        if not os.path.exists(self.local_db_path):
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump({"datasets": {}, "wazuh_results": {}, "validation_results": {}}, f)

    def _read_local_db(self) -> Dict[str, Any]:
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"datasets": {}, "wazuh_results": {}, "validation_results": {}}

    def _write_local_db(self, data: Dict[str, Any]):
        try:
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to write local database: {e}")

    async def connect(self):
        try:
            self.mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=2000
            )
            # Ping database
            await self.mongo_client.admin.command('ping')
            self.db = self.mongo_client[settings.DATABASE_NAME]
            self.is_mongo_connected = True
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            self.is_mongo_connected = False
            logger.warning(f"MongoDB not available at {settings.MONGODB_URL} ({e}). Using file-backed fallback storage.")

    async def close(self):
        if self.mongo_client:
            self.mongo_client.close()

    # Datasets
    @staticmethod
    def _normalize_dataset(dataset: Dict[str, Any]) -> Dict[str, Any]:
        normalized = dict(dataset)
        normalized.setdefault("description", "")
        normalized.setdefault("file_formats_available", ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"])
        normalized.setdefault("schema_fields", [])
        normalized.setdefault("validation_status", "unvalidated")
        normalized.setdefault("validation_score", None)
        normalized.setdefault("wazuh_tested", False)
        normalized.setdefault("wazuh_alerts_count", 0)
        return normalized

    async def save_dataset(self, dataset_dict: Dict[str, Any]) -> str:
        dataset_id = dataset_dict["id"]
        if self.is_mongo_connected and self.db is not None:
            try:
                await self.db.datasets.replace_one({"id": dataset_id}, dataset_dict, upsert=True)
                return dataset_id
            except Exception as e:
                logger.error(f"MongoDB save failed, saving locally: {e}")

        # Fallback local
        data = self._read_local_db()
        data["datasets"][dataset_id] = dataset_dict
        self._write_local_db(data)
        return dataset_id

    async def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            try:
                res = await self.db.datasets.find_one({"id": dataset_id}, {"_id": 0})
                if res:
                    return self._normalize_dataset(res)
            except Exception as e:
                logger.error(f"MongoDB fetch failed: {e}")

        data = self._read_local_db()
        found = data.get("datasets", {}).get(dataset_id)
        return self._normalize_dataset(found) if found else None

    async def list_datasets(self) -> List[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            try:
                cursor = self.db.datasets.find({}, {"_id": 0, "logs": 0}).sort("created_at", -1)
                results = await cursor.to_list(length=100)
                return [self._normalize_dataset(d) for d in results]
            except Exception as e:
                logger.error(f"MongoDB list failed: {e}")

        data = self._read_local_db()
        datasets = list(data.get("datasets", {}).values())
        # Strip heavy logs array for summary list
        summaries = []
        for d in datasets:
            summary = {k: v for k, v in self._normalize_dataset(d).items() if k != "logs"}
            summaries.append(summary)
        summaries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return summaries

    async def delete_dataset(self, dataset_id: str) -> bool:
        deleted = False
        if self.is_mongo_connected and self.db is not None:
            try:
                res = await self.db.datasets.delete_one({"id": dataset_id})
                if res.deleted_count > 0:
                    deleted = True
                await self.db.wazuh_results.delete_many({"dataset_id": dataset_id})
                await self.db.validation_results.delete_many({"dataset_id": dataset_id})
            except Exception as e:
                logger.error(f"MongoDB delete failed: {e}")

        data = self._read_local_db()
        if dataset_id in data.get("datasets", {}):
            del data["datasets"][dataset_id]
            data.get("wazuh_results", {}).pop(dataset_id, None)
            data.get("validation_results", {}).pop(dataset_id, None)
            self._write_local_db(data)
            deleted = True

        return deleted

    # Wazuh Evaluation Results
    async def save_wazuh_result(self, result: Dict[str, Any]):
        result_id = result.get("dataset_id")
        if self.is_mongo_connected and self.db is not None:
            try:
                await self.db.wazuh_results.replace_one({"dataset_id": result_id}, result, upsert=True)
                return
            except Exception as e:
                logger.error(f"Mongo save wazuh failed: {e}")

        data = self._read_local_db()
        data["wazuh_results"][result_id] = result
        self._write_local_db(data)

    async def get_wazuh_result(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            try:
                return await self.db.wazuh_results.find_one({"dataset_id": dataset_id}, {"_id": 0})
            except Exception:
                pass
        data = self._read_local_db()
        return data.get("wazuh_results", {}).get(dataset_id)

    # Validation Results
    async def save_validation_result(self, result: Dict[str, Any]):
        result_id = result.get("dataset_id")
        if self.is_mongo_connected and self.db is not None:
            try:
                await self.db.validation_results.replace_one({"dataset_id": result_id}, result, upsert=True)
                return
            except Exception:
                pass
        data = self._read_local_db()
        data["validation_results"][result_id] = result
        self._write_local_db(data)

    async def get_validation_result(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            try:
                return await self.db.validation_results.find_one({"dataset_id": dataset_id}, {"_id": 0})
            except Exception:
                pass
        data = self._read_local_db()
        return data.get("validation_results", {}).get(dataset_id)

db_manager = DatabaseManager()
