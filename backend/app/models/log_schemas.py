from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class BaseLogEvent(BaseModel):
    id: Optional[str] = None
    timestamp: str = Field(description="ISO-8601 or RFC-3339 formatted timestamp")
    source: str = Field(description="Log source: linux, windows, aws, azure, gcp, nginx, etc.")
    event_type: str = Field(description="Normalized event category e.g. authentication, process_creation, privilege_escalation")
    severity: str = Field(default="informational", description="informational, low, medium, high, critical")
    status: str = Field(default="success", description="success, failure, attempt, error")
    source_ip: Optional[str] = Field(default=None, description="Originating IPv4 or IPv6 address")
    destination_ip: Optional[str] = Field(default=None, description="Target IPv4 or IPv6 address")
    username: Optional[str] = Field(default=None, description="Associated account or user")
    action: Optional[str] = Field(default=None, description="Operation or command performed")
    message: str = Field(description="Raw or formatted log string message")
    details: Dict[str, Any] = Field(default_factory=dict, description="Metadata key-values")

class LinuxAuthEvent(BaseModel):
    timestamp: str
    hostname: str = "ubuntu-srv-01"
    process: str = "sshd"
    pid: int = 1204
    event_type: str = "authentication"
    status: str = "failure"
    auth_method: str = "password"
    username: str
    source_ip: str
    port: int = 49152
    message: str

class WebServerEvent(BaseModel):
    timestamp: str
    client_ip: str
    method: str
    path: str
    protocol: str = "HTTP/1.1"
    status_code: int
    bytes_sent: int
    user_agent: str
    referer: str = "-"
    attack_type: Optional[str] = None
    message: str

class WindowsSecurityEvent(BaseModel):
    timestamp: str
    computer_name: str = "WIN-SRV-AD01"
    event_id: int
    task_category: str
    severity: str
    subject_user_name: str
    target_user_name: Optional[str] = None
    source_network_address: Optional[str] = None
    logon_type: Optional[int] = None
    process_name: Optional[str] = None
    status_code: str = "0x0"
    message: str

class AwsCloudTrailEvent(BaseModel):
    eventVersion: str = "1.08"
    userIdentity: Dict[str, Any]
    eventTime: str
    eventSource: str
    eventName: str
    awsRegion: str = "us-east-1"
    sourceIPAddress: str
    userAgent: str
    requestParameters: Optional[Dict[str, Any]] = None
    responseElements: Optional[Dict[str, Any]] = None
    errorCode: Optional[str] = None
    errorMessage: Optional[str] = None
    recipientAccountId: str = "123456789012"

class AzureActivityEvent(BaseModel):
    time: str
    resourceId: str
    operationName: str
    category: str
    resultType: str
    resultSignature: str
    durationMs: int
    caller: str
    callerIpAddress: str
    correlationId: str
    properties: Dict[str, Any]

class GcpAuditEvent(BaseModel):
    protoPayload: Dict[str, Any]
    insertId: str
    resource: Dict[str, Any]
    timestamp: str
    severity: str
    logName: str
    receiveTimestamp: str
