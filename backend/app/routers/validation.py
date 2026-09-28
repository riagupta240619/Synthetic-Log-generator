from fastapi import APIRouter, HTTPException
from app.database import db_manager
from app.validators.log_validator import LogValidator

router = APIRouter(prefix="/validate", tags=["Validation"])

@router.post("/{dataset_id}")
async def validate_dataset(dataset_id: str):
    ds = await db_manager.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    logs = ds.get("logs", [])
    report = LogValidator.validate_dataset(dataset_id, logs)
    report_dict = report.model_dump()

    # Save to db
    await db_manager.save_validation_result(report_dict)

    # Update dataset metadata
    ds["validation_status"] = report.status
    ds["validation_score"] = report.score
    await db_manager.save_dataset(ds)

    return report_dict

@router.get("/{dataset_id}")
async def get_validation_report(dataset_id: str):
    result = await db_manager.get_validation_result(dataset_id)
    if not result:
        # Trigger validation automatically if not yet run
        return await validate_dataset(dataset_id)
    return result
