import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.database import db_manager
from app.engines.file_learner_engine import FileLearnerEngine

router = APIRouter(prefix="/upload", tags=["Upload & File Learner"])

@router.post("/learn")
async def upload_and_learn(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    synthetic_count: int = Form(100)
):
    if synthetic_count < 1 or synthetic_count > 5000:
        raise HTTPException(status_code=400, detail="synthetic_count must be between 1 and 5000")
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")

    try:
        content = await file.read()
        reference_logs = FileLearnerEngine.parse_file(content, file.filename)
        if not reference_logs:
            raise HTTPException(status_code=400, detail="Could not parse any log records from uploaded file. Please check file format.")

        profile, synthetic_logs = FileLearnerEngine.analyze_and_synthesize(reference_logs, count=synthetic_count)

        dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
        name = dataset_name or f"Learned_{file.filename[:20]}_{len(synthetic_logs)}events"

        dataset_dict = {
            "id": dataset_id,
            "name": name,
            "generator_type": "file_learner",
            "log_source": synthetic_logs[0].get("source", "file_upload") if synthetic_logs else "file_upload",
            "scenario_name": f"Trained on {file.filename}",
            "count": len(synthetic_logs),
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "schema_fields": list(synthetic_logs[0].keys()) if synthetic_logs else [],
            "validation_status": "unvalidated",
            "validation_score": None,
            "file_formats_available": ["json", "ndjson", "csv", "syslog_rfc3164", "syslog_rfc5424"],
            "wazuh_tested": False,
            "wazuh_alerts_count": 0,
            "logs": synthetic_logs,
            "learned_profile": profile
        }

        await db_manager.save_dataset(dataset_dict)

        return {
            "dataset_id": dataset_id,
            "name": name,
            "count": len(synthetic_logs),
            "reference_count": len(reference_logs),
            "learned_profile": profile,
            "sample_logs": synthetic_logs[:5]
        }
    except HTTPException:
        raise
    except (UnicodeDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Could not process uploaded log file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File learning error: {str(e)}")
