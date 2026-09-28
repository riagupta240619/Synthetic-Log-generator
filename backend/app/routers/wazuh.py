from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.database import db_manager
from app.wazuh.emulator import WazuhRulesetMatcher
from app.wazuh.client import WazuhLiveForwarder

router = APIRouter(prefix="/wazuh", tags=["Wazuh Detection"])

class WazuhForwardRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    protocol: str = Field(default="udp", description="udp or tcp")

@router.post("/test/{dataset_id}")
async def test_against_wazuh(dataset_id: str):
    ds = await db_manager.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    logs = ds.get("logs", [])
    summary = WazuhRulesetMatcher.evaluate_logs(dataset_id, logs)
    summary_dict = summary.model_dump()

    # Save wazuh results
    await db_manager.save_wazuh_result(summary_dict)

    # Update dataset
    ds["wazuh_tested"] = True
    ds["wazuh_alerts_count"] = summary.total_alerts_generated
    await db_manager.save_dataset(ds)

    return summary_dict

@router.get("/results/{dataset_id}")
async def get_wazuh_results(dataset_id: str):
    res = await db_manager.get_wazuh_result(dataset_id)
    if not res:
        # Run test if not yet tested
        return await test_against_wazuh(dataset_id)
    return res

@router.post("/forward/{dataset_id}")
async def forward_to_wazuh_server(dataset_id: str, req: WazuhForwardRequest):
    ds = await db_manager.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    logs = ds.get("logs", [])
    result = WazuhLiveForwarder.forward_to_wazuh(
        logs,
        host=req.host,
        port=req.port,
        protocol=req.protocol
    )
    return result
