from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.database import db_manager
from app.exporters.formatters import LogExporter

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("")
async def list_datasets():
    datasets = await db_manager.list_datasets()
    return {"total": len(datasets), "datasets": datasets}

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, limit: Optional[int] = Query(None, ge=1, le=5000)):
    ds = await db_manager.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    logs = ds.get("logs", [])
    if limit and len(logs) > limit:
        ds_copy = dict(ds)
        ds_copy["logs"] = logs[:limit]
        ds_copy["truncated"] = True
        return ds_copy
    return ds

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    success = await db_manager.delete_dataset(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"success": True, "dataset_id": dataset_id}

@router.get("/{dataset_id}/export")
async def export_dataset(dataset_id: str, format: str = Query("json", pattern="^(json|ndjson|csv|syslog_rfc3164|syslog_rfc5424)$")):
    ds = await db_manager.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    logs = ds.get("logs", [])
    name = ds.get("name", dataset_id).replace(" ", "_")

    if format == "json":
        content = LogExporter.to_json(logs)
        media_type = "application/json"
        filename = f"{name}.json"
    elif format == "ndjson":
        content = LogExporter.to_ndjson(logs)
        media_type = "application/x-ndjson"
        filename = f"{name}.ndjson"
    elif format == "csv":
        content = LogExporter.to_csv(logs)
        media_type = "text/csv"
        filename = f"{name}.csv"
    elif format == "syslog_rfc3164":
        content = LogExporter.to_syslog_rfc3164(logs)
        media_type = "text/plain"
        filename = f"{name}_bsd.log"
    elif format == "syslog_rfc5424":
        content = LogExporter.to_syslog_rfc5424(logs)
        media_type = "text/plain"
        filename = f"{name}_ietf.log"
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
