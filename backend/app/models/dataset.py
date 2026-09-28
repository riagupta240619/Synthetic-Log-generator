from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class DatasetMetadata(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    generator_type: str = Field(description="scenario, file_learner, llm, ml, cloud")
    log_source: str = Field(description="linux, windows, aws, azure, gcp, web, network")
    scenario_name: Optional[str] = None
    count: int
    created_at: str
    file_formats_available: List[str] = ["json", "csv", "syslog"]
    schema_fields: List[str] = []
    validation_status: Optional[str] = "unvalidated"
    validation_score: Optional[float] = None
    wazuh_tested: bool = False
    wazuh_alerts_count: int = 0

class DatasetCreateRequest(BaseModel):
    name: str
    generator_type: str
    log_source: str
    scenario_name: Optional[str] = None
    count: int = 100
    parameters: Dict[str, Any] = {}

class DatasetExportResponse(BaseModel):
    dataset_id: str
    format: str
    download_url: str
    content_type: str
    filename: str
