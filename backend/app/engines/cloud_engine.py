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
    def generate(cls, provider: str, scenario_type: str = "suspicious_admin",
                 count: int = 50, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        parameters = parameters or {}
        provider = provider.lower().strip()
        if count < 1:
            return []

        start_time = datetime.utcnow() - timedelta(minutes=max(count, 1) * 2)
        if provider == "aws":
            return cls._generate_aws_cloudtrail(count, start_time, scenario_type, parameters)
        if provider == "azure":
            return cls._generate_azure_activity(count, start_time, scenario_type, parameters)
        if provider == "gcp":
            return cls._generate_gcp_audit(count, start_time, scenario_type, parameters)
        raise ValueError(f"Unsupported cloud provider: {provider}")

    @staticmethod
    def _pick_sequence(pool: List[Dict[str, Any]], count: int) -> List[Dict[str, Any]]:
        # Repeat a scenario's event chain, but randomize repeated records so large
        # datasets retain the intended event distribution without being identical.
        result = []
        for i in range(count):
            item = dict(pool[i % len(pool)])
            if i >= len(pool):
                item = dict(random.choice(pool))
            result.append(item)
        return result

    @classmethod
    def _generate_aws_cloudtrail(cls, count: int, current_time: datetime,
                                 scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)
        account_id = str(params.get("account_id") or "987654321098")
        user = str(params.get("username") or "aws_admin")

        scenarios = {
            "privilege_escalation": [
                {"eventSource": "iam.amazonaws.com", "eventName": "CreateUser",
                 "requestParameters": {"userName": "backup_backdoor_svc"}, "severity": "high"},
                {"eventSource": "iam.amazonaws.com", "eventName": "AttachUserPolicy",
                 "requestParameters": {"userName": "backup_backdoor_svc",
                                        "policyArn": "arn:aws:iam::aws:policy/AdministratorAccess"},
                 "severity": "critical"},
                {"eventSource": "signin.amazonaws.com", "eventName": "ConsoleLogin",
                 "requestParameters": {}, "severity": "high"},
            ],
            "data_exposure": [
                {"eventSource": "s3.amazonaws.com", "eventName": "PutBucketPolicy",
                 "requestParameters": {"bucketName": "corp-customer-financial-records",
                                        "bucketPolicy": {"Statement": [{"Effect": "Allow",
                                                                        "Principal": "*",
                                                                        "Action": "s3:GetObject"}]}},
                 "severity": "critical"},
                {"eventSource": "s3.amazonaws.com", "eventName": "GetBucketPolicy",
                 "requestParameters": {"bucketName": "corp-customer-financial-records"},
                 "severity": "medium"},
            ],
            "defense_evasion": [
                {"eventSource": "cloudtrail.amazonaws.com", "eventName": "StopLogging",
                 "requestParameters": {"name": "prod-global-cloudtrail"}, "severity": "critical"},
                {"eventSource": "cloudtrail.amazonaws.com", "eventName": "DeleteTrail",
                 "requestParameters": {"name": "prod-global-cloudtrail"}, "severity": "critical"},
            ],
        }
        pool = scenarios.get(scenario_type, scenarios["privilege_escalation"])
        logs = []
        for ev in cls._pick_sequence(pool, count):
            current_time += timedelta(seconds=random.randint(15, 60))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            failed = ev["eventName"] == "ConsoleLogin" and random.random() < 0.25
            log = {
                "id": str(uuid.uuid4()), "timestamp": iso_time, "source": "aws_cloudtrail",
                "eventVersion": "1.08",
                "userIdentity": {"type": "IAMUser", "principalId": "AIDAEXAMPLE",
                                 "arn": f"arn:aws:iam::{account_id}:user/{user}",
                                 "accountId": account_id, "userName": user},
                "eventTime": iso_time, "eventSource": ev["eventSource"], "eventName": ev["eventName"],
                "awsRegion": random.choice(cls.REGIONS_AWS), "sourceIPAddress": attacker_ip,
                "source_ip": attacker_ip, "username": user, "userAgent": "AWS-Console-Client/1.0",
                "errorCode": "AccessDenied" if failed else None,
                "errorMessage": "Authentication failed" if failed else None,
                "requestParameters": ev.get("requestParameters", {}),
                "recipientAccountId": account_id, "event_type": "cloud_security_audit",
                "status": "failure" if failed else "success", "severity": ev["severity"],
                "action": ev["eventName"],
                "message": f"AWS CloudTrail {ev['eventName']} from {attacker_ip} by {user}",
                "details": {"cloud_provider": "aws", "service": ev["eventSource"].split(".")[0],
                            "scenario": scenario_type}
            }
            logs.append(log)
        return logs

    @classmethod
    def _generate_azure_activity(cls, count: int, current_time: datetime,
                                 scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)
        caller = str(params.get("username") or "attacker_compromised@corp.onmicrosoft.com")
        scenarios = {
            "privilege_escalation": [
                ("Microsoft.Authorization/roleAssignments/write", "Critical privilege assignment: Owner granted", "critical"),
            ],
            "secret_harvesting": [
                ("Microsoft.KeyVault/vaults/secrets/read", "Production secret retrieval", "high"),
            ],
            "resource_destruction": [
                ("Microsoft.Compute/virtualMachines/delete", "Production VM deletion", "critical"),
                ("Microsoft.Storage/storageAccounts/delete", "Production storage deletion", "critical"),
            ],
        }
        pool = scenarios.get(scenario_type, scenarios["privilege_escalation"])
        logs = []
        for op, description, severity in cls._pick_sequence(
            [{"op": a, "description": b, "severity": c} for a, b, c in pool], count
        ):
            current_time += timedelta(seconds=random.randint(20, 90))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            logs.append({
                "id": str(uuid.uuid4()), "timestamp": iso_time, "source": "azure_activity", "time": iso_time,
                "resourceId": f"/subscriptions/11111111-2222-3333-4444-555555555555/resourceGroups/Prod-RG/providers/{op}",
                "operationName": op, "category": "Administrative", "resultType": "Success",
                "resultSignature": "Accepted", "durationMs": random.randint(150, 800),
                "caller": caller, "callerIpAddress": attacker_ip, "source_ip": attacker_ip,
                "username": caller, "correlationId": str(uuid.uuid4()), "event_type": "cloud_security_audit",
                "status": "success", "severity": severity, "action": op,
                "message": f"Azure Activity {op} initiated by {caller} from {attacker_ip}: {description}",
                "properties": {"eventCategory": "Administrative", "level": "Warning", "description": description},
                "details": {"cloud_provider": "azure", "operation": op, "scenario": scenario_type}
            })
        return logs

    @classmethod
    def _generate_gcp_audit(cls, count: int, current_time: datetime,
                            scenario_type: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        attacker_ip = params.get("attacker_ip") or random.choice(cls.SUSPICIOUS_IPS)
        caller = str(params.get("username") or "sec-admin-compromised@cybersec-prod-corp.iam.gserviceaccount.com")
        scenarios = {
            "persistence_key": [
                ("google.iam.admin.v1.CreateServiceAccountKey", "iam.googleapis.com", "critical"),
            ],
            "firewall_breach": [
                ("compute.firewalls.insert", "compute.googleapis.com", "critical"),
                ("compute.firewalls.patch", "compute.googleapis.com", "high"),
            ],
        }
        pool = scenarios.get(scenario_type, scenarios["persistence_key"])
        logs = []
        for method_name, service_name, severity in cls._pick_sequence(
            [{"method": a, "service": b, "severity": c} for a, b, c in pool], count
        ):
            current_time += timedelta(seconds=random.randint(15, 60))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            logs.append({
                "id": str(uuid.uuid4()), "timestamp": iso_time, "source": "gcp_audit",
                "insertId": str(uuid.uuid4())[:16],
                "logName": "projects/cybersec-prod-corp/logs/cloudaudit.googleapis.com%2Factivity",
                "resource": {"type": "gce_instance",
                             "labels": {"project_id": "cybersec-prod-corp", "zone": "us-central1-a"}},
                "protoPayload": {
                    "@type": "type.googleapis.com/google.cloud.audit.AuditLog",
                    "serviceName": service_name, "methodName": method_name,
                    "authenticationInfo": {"principalEmail": caller},
                    "requestMetadata": {"callerIp": attacker_ip,
                                        "callerSuppliedUserAgent": "google-cloud-sdk/460.0.0"}
                },
                "severity": severity.upper(), "receiveTimestamp": iso_time, "source_ip": attacker_ip,
                "username": caller, "event_type": "cloud_security_audit", "status": "success",
                "action": method_name,
                "message": f"GCP Cloud Audit methodName={method_name} service={service_name} callerIp={attacker_ip}",
                "details": {"cloud_provider": "gcp", "method": method_name, "scenario": scenario_type}
            })
        return logs
