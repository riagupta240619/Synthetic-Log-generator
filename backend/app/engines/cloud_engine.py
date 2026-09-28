import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

class CloudEngine:
    REGIONS_AWS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
    REGIONS_AZURE = ["eastus", "westeurope", "southeastasia", "centralus"]
    REGIONS_GCP = ["us-central1", "europe-west1", "asia-east1"]

    SUSPICIOUS_IPS = ["185.220.101.5", "45.154.255.88", "194.26.29.112", "91.240.118.232"]
    CORP_IPS = ["12.158.45.22", "54.240.196.18", "64.233.160.1"]

    @classmethod
    def generate(cls, provider: str, scenario_type: str = "suspicious_admin", count: int = 50, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        parameters = parameters or {}
        start_time = datetime.utcnow() - timedelta(minutes=count * 2)

        if provider == "aws":
            return cls._generate_aws_cloudtrail(count, start_time, scenario_type, parameters)
        elif provider == "azure":
            return cls._generate_azure_activity(count, start_time, scenario_type, parameters)
        elif provider == "gcp":
            return cls._generate_gcp_audit(count, start_time, scenario_type, parameters)
        else:
            return cls._generate_aws_cloudtrail(count, start_time, scenario_type, parameters)

    @classmethod
    def _generate_aws_cloudtrail(cls, count: int, current_time: datetime, scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)
        account_id = "987654321098"

        aws_events = [
            {
                "eventSource": "signin.amazonaws.com",
                "eventName": "ConsoleLogin",
                "errorCode": "Failed authentication",
                "errorMessage": "Incorrect username or password provided",
                "severity": "medium",
                "status": "failure",
                "user": "aws_admin"
            },
            {
                "eventSource": "signin.amazonaws.com",
                "eventName": "ConsoleLogin",
                "errorCode": None,
                "errorMessage": None,
                "severity": "high",
                "status": "success",
                "user": "aws_admin"
            },
            {
                "eventSource": "iam.amazonaws.com",
                "eventName": "CreateUser",
                "requestParameters": {"userName": "backup_backdoor_svc"},
                "severity": "high",
                "status": "success",
                "user": "aws_admin"
            },
            {
                "eventSource": "iam.amazonaws.com",
                "eventName": "AttachUserPolicy",
                "requestParameters": {
                    "userName": "backup_backdoor_svc",
                    "policyArn": "arn:aws:iam::aws:policy/AdministratorAccess"
                },
                "severity": "critical",
                "status": "success",
                "user": "aws_admin"
            },
            {
                "eventSource": "s3.amazonaws.com",
                "eventName": "PutBucketPolicy",
                "requestParameters": {
                    "bucketName": "corp-customer-financial-records",
                    "bucketPolicy": {"Statement": [{"Effect": "Allow", "Principal": "*", "Action": "s3:GetObject"}]}
                },
                "severity": "critical",
                "status": "success",
                "user": "aws_admin"
            },
            {
                "eventSource": "cloudtrail.amazonaws.com",
                "eventName": "StopLogging",
                "requestParameters": {"name": "prod-global-cloudtrail"},
                "severity": "critical",
                "status": "success",
                "user": "aws_admin"
            }
        ]

        for i in range(count):
            current_time += timedelta(seconds=random.randint(15, 60))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            ev = aws_events[i % len(aws_events)]

            log = {
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "aws_cloudtrail",
                "eventVersion": "1.08",
                "userIdentity": {
                    "type": "IAMUser",
                    "principalId": "AIDAJQAB7N5XExample",
                    "arn": f"arn:aws:iam::{account_id}:user/{ev['user']}",
                    "accountId": account_id,
                    "userName": ev["user"]
                },
                "eventTime": iso_time,
                "eventSource": ev["eventSource"],
                "eventName": ev["eventName"],
                "awsRegion": random.choice(cls.REGIONS_AWS),
                "sourceIPAddress": attacker_ip,
                "source_ip": attacker_ip,
                "username": ev["user"],
                "userAgent": "AWS-Console-Client/1.0",
                "errorCode": ev.get("errorCode"),
                "errorMessage": ev.get("errorMessage"),
                "requestParameters": ev.get("requestParameters", {}),
                "recipientAccountId": account_id,
                "event_type": "cloud_security_audit",
                "status": ev["status"],
                "severity": ev["severity"],
                "action": ev["eventName"],
                "message": f"AWS CloudTrail {ev['eventName']} from {attacker_ip} by {ev['user']} status={ev['status']}",
                "details": {"cloud_provider": "aws", "service": ev["eventSource"].split(".")[0]}
            }
            logs.append(log)
        return logs

    @classmethod
    def _generate_azure_activity(cls, count: int, current_time: datetime, scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)

        operations = [
            ("Microsoft.Authorization/roleAssignments/write", "Critical privilege assignment: Owner granted", "critical"),
            ("Microsoft.KeyVault/vaults/secrets/read", "Secret vault retrieval: ProductionDBKey", "high"),
            ("Microsoft.Network/networkSecurityGroups/securityRules/write", "Allow-All-Inbound rule configured on port 22/3389", "critical"),
            ("Microsoft.Compute/virtualMachines/delete", "Virtual Machine deletion: vm-prod-database-01", "critical")
        ]

        for i in range(count):
            current_time += timedelta(seconds=random.randint(20, 90))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            op = operations[i % len(operations)]

            log = {
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "azure_activity",
                "time": iso_time,
                "resourceId": f"/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/Prod-RG/providers/{op[0]}",
                "operationName": op[0],
                "category": "Administrative",
                "resultType": "Success",
                "resultSignature": "Accepted",
                "durationMs": random.randint(150, 800),
                "caller": "attacker_compromised@corp.onmicrosoft.com",
                "callerIpAddress": attacker_ip,
                "source_ip": attacker_ip,
                "username": "attacker_compromised@corp.onmicrosoft.com",
                "correlationId": str(uuid.uuid4()),
                "event_type": "cloud_security_audit",
                "status": "success",
                "severity": op[2],
                "action": op[0],
                "message": f"Azure Activity {op[0]} initiated by attacker_compromised from {attacker_ip}: {op[1]}",
                "properties": {"eventCategory": "Administrative", "level": "Warning", "description": op[1]},
                "details": {"cloud_provider": "azure", "operation": op[0]}
            }
            logs.append(log)
        return logs

    @classmethod
    def _generate_gcp_audit(cls, count: int, current_time: datetime, scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)

        gcp_methods = [
            ("google.iam.admin.v1.CreateServiceAccountKey", "iam.googleapis.com", "critical"),
            ("compute.firewalls.insert", "compute.googleapis.com", "critical"),
            ("storage.buckets.setIamPolicy", "storage.googleapis.com", "critical"),
            ("compute.instances.setMetadata", "compute.googleapis.com", "high")
        ]

        for i in range(count):
            current_time += timedelta(seconds=random.randint(15, 60))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            method = gcp_methods[i % len(gcp_methods)]

            log = {
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "gcp_audit",
                "insertId": str(uuid.uuid4())[:16],
                "logName": f"projects/cybersec-prod-corp/logs/cloudaudit.googleapis.com%2Factivity",
                "resource": {
                    "type": "gce_instance",
                    "labels": {"project_id": "cybersec-prod-corp", "zone": "us-central1-a"}
                },
                "protoPayload": {
                    "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
                    "serviceName": method[1],
                    "methodName": method[0],
                    "authenticationInfo": {"principalEmail": "sec-admin-compromised@cybersec-prod-corp.iam.gserviceaccount.com"},
                    "requestMetadata": {"callerIp": attacker_ip, "callerSuppliedUserAgent": "google-cloud-sdk/460.0.0"}
                },
                "severity": method[2].upper(),
                "receiveTimestamp": iso_time,
                "source_ip": attacker_ip,
                "username": "sec-admin-compromised@cybersec-prod-corp.iam.gserviceaccount.com",
                "event_type": "cloud_security_audit",
                "status": "success",
                "action": method[0],
                "message": f"GCP Cloud Audit methodName={method[0]} service={method[1]} callerIp={attacker_ip}",
                "details": {"cloud_provider": "gcp", "method": method[0]}
            }
            logs.append(log)
        return logs
