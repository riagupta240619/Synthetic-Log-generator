import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import db_manager
from app.engines.scenario_engine import ScenarioEngine
from app.engines.cloud_engine import CloudEngine
from app.engines.llm_engine import LlmEngine
from app.engines.ml_engine import MLMarkovSequenceEngine

router = APIRouter(prefix="/generate", tags=["Generation"])

class ScenarioGenRequest(BaseModel):
    name: Optional[str] = None
    scenario_name: str = "ssh_brute_force"
    count: int = Field(default=100, ge=5, le=5000)
    parameters: Dict[str, Any] = {}

class CloudGenRequest(BaseModel):
    name: Optional[str] = None
    provider: str = Field(default="aws", description="aws, azure, gcp")
    scenario_type: str = "suspicious_admin"
    count: int = Field(default=50, ge=5, le=2000)
    parameters: Dict[str, Any] = {}

class LlmGenRequest(BaseModel):
    name: Optional[str] = None
    prompt: str = Field(description="Natural language description of log scenario")
    count: int = Field(default=20, ge=1, le=500)
    model: Optional[str] = None

class MLGenRequest(BaseModel):
    name: Optional[str] = None
    count: int = Field(default=100, ge=10, le=5000)
    parameters: Dict[str, Any] = {}

@router.post("/scenario")
async def generate_scenario(req: ScenarioGenRequest):
    logs = ScenarioEngine.generate(req.scenario_name, req.count, req.parameters)
    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    name = req.name or f"Scenario_{req.scenario_name}_{req.count}events"

    dataset_dict = {
        "id": dataset_id,
        "name": name,
        "generator_type": "scenario",
        "log_source": "linux" if "ssh" in req.scenario_name or "privilege" in req.scenario_name or "benign" in req.scenario_name else ("windows" if "ransomware" in req.scenario_name or "lateral" in req.scenario_name else "web"),
        "scenario_name": req.scenario_name,
        "count": len(logs),
        "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_fields": list(logs[0].keys()) if logs else [],
        "validation_status": "unvalidated",
        "validation_score": None,
        "file_formats_available": ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"],
        "wazuh_tested": False,
        "wazuh_alerts_count": 0,
        "logs": logs
    }
    await db_manager.save_dataset(dataset_dict)
    return {"dataset_id": dataset_id, "name": name, "scenario": req.scenario_name, "count": len(logs), "logs": logs}

@router.post("/cloud")
async def generate_cloud(req: CloudGenRequest):
    logs = CloudEngine.generate(req.provider, req.scenario_type, req.count, req.parameters)
    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    name = req.name or f"Cloud_{req.provider.upper()}_{req.count}events"

    dataset_dict = {
        "id": dataset_id,
        "name": name,
        "generator_type": "cloud",
        "log_source": req.provider.lower(),
        "scenario_name": req.scenario_type,
        "count": len(logs),
        "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_fields": list(logs[0].keys()) if logs else [],
        "validation_status": "unvalidated",
        "validation_score": None,
        "file_formats_available": ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"],
        "wazuh_tested": False,
        "wazuh_alerts_count": 0,
        "logs": logs
    }
    await db_manager.save_dataset(dataset_dict)
    return {"dataset_id": dataset_id, "name": name, "provider": req.provider, "scenario": req.scenario_type, "count": len(logs), "logs": logs}

@router.post("/llm")
async def generate_llm(req: LlmGenRequest):
    logs = await LlmEngine.generate_with_prompt(req.prompt, req.count, req.model)
    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    name = req.name or f"LLM_Prompt_{len(logs)}events"

    dataset_dict = {
        "id": dataset_id,
        "name": name,
        "generator_type": "llm",
        "log_source": logs[0].get("source", "generic") if logs else "generic",
        "scenario_name": req.prompt[:40],
        "count": len(logs),
        "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_fields": list(logs[0].keys()) if logs else [],
        "validation_status": "unvalidated",
        "validation_score": None,
        "file_formats_available": ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"],
        "wazuh_tested": False,
        "wazuh_alerts_count": 0,
        "logs": logs
    }
    await db_manager.save_dataset(dataset_dict)
    return {"dataset_id": dataset_id, "name": name, "scenario": req.prompt, "count": len(logs), "logs": logs}

@router.post("/ml")
async def generate_ml(req: MLGenRequest):
    logs = MLMarkovSequenceEngine.generate_sequence(req.count)
    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    name = req.name or f"ML_MarkovSequence_{req.count}events"

    dataset_dict = {
        "id": dataset_id,
        "name": name,
        "generator_type": "ml",
        "log_source": "multi_sensor",
        "scenario_name": "Markov_Attacker_Lifecycle",
        "count": len(logs),
        "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "schema_fields": list(logs[0].keys()) if logs else [],
        "validation_status": "unvalidated",
        "validation_score": None,
        "file_formats_available": ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"],
        "wazuh_tested": False,
        "wazuh_alerts_count": 0,
        "logs": logs
    }
    await db_manager.save_dataset(dataset_dict)
    return {"dataset_id": dataset_id, "name": name, "scenario": "Markov_Attacker_Lifecycle", "count": len(logs), "logs": logs}
