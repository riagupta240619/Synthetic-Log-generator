from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class WazuhRule(BaseModel):
    id: str
    level: int
    description: str
    groups: List[str]
    mitre_id: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None

class WazuhAlert(BaseModel):
    id: str
    timestamp: str
    rule_id: str
    level: int
    description: str
    groups: List[str]
    mitre: Optional[Dict[str, str]] = None
    source_ip: Optional[str] = None
    user: Optional[str] = None
    raw_log: str
    full_log_matched: str

class WazuhEvaluationSummary(BaseModel):
    dataset_id: str
    total_logs_analyzed: int
    total_alerts_generated: int
    detection_rate: float
    high_severity_alerts: int
    medium_severity_alerts: int
    low_severity_alerts: int
    top_rules_triggered: List[Dict[str, Any]]
    mitre_tactics_detected: List[str]
    alerts: List[WazuhAlert]
    evaluated_at: str
