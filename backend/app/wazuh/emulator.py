import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.wazuh import WazuhAlert, WazuhEvaluationSummary

class WazuhRulesetMatcher:
    """
    High-fidelity Wazuh Rule Matching Engine grounded in official Wazuh Rulesets.
    Evaluates synthetic logs against Wazuh detection signatures, alert levels (1-15),
    and MITRE ATT&CK tactics & techniques.
    """

    RULES = [
        {
            "id": "5710",
            "level": 5,
            "pattern": re.compile(r"Failed password for invalid user|illegal user", re.IGNORECASE),
            "description": "sshd: Attempt to login using a non-existent user",
            "groups": ["syslog", "sshd", "authentication_failed"],
            "mitre_id": "T1110.001",
            "mitre_tactic": "Credential Access",
            "mitre_technique": "Password Guessing"
        },
        {
            "id": "5716",
            "level": 5,
            "pattern": re.compile(r"Failed password for|authentication failure", re.IGNORECASE),
            "description": "sshd: authentication failed.",
            "groups": ["syslog", "sshd", "authentication_failed"],
            "mitre_id": "T1110",
            "mitre_tactic": "Credential Access",
            "mitre_technique": "Brute Force"
        },
        {
            "id": "5715",
            "level": 3,
            "pattern": re.compile(r"Accepted password for|Accepted publickey for", re.IGNORECASE),
            "description": "sshd: authentication succeeded.",
            "groups": ["syslog", "sshd", "authentication_success"],
            "mitre_id": "T1078",
            "mitre_tactic": "Defense Evasion",
            "mitre_technique": "Valid Accounts"
        },
        {
            "id": "5401",
            "level": 5,
            "pattern": re.compile(r"user NOT in sudoers|incorrect password attempt", re.IGNORECASE),
            "description": "sudo: authentication or permission failure.",
            "groups": ["syslog", "sudo"],
            "mitre_id": "T1548.003",
            "mitre_tactic": "Privilege Escalation",
            "mitre_technique": "Sudo and Sudo Caching"
        },
        {
            "id": "5402",
            "level": 9,
            "pattern": re.compile(r"COMMAND=.*(?:/bin/bash|/bin/sh|cat /etc/shadow|find \. -exec)", re.IGNORECASE),
            "description": "sudo: Highly privileged command or root shell execution",
            "groups": ["syslog", "sudo", "privilege_escalation"],
            "mitre_id": "T1548.003",
            "mitre_tactic": "Privilege Escalation",
            "mitre_technique": "Sudo Abuse"
        },
        {
            "id": "31103",
            "level": 10,
            "pattern": re.compile(r"UNION\s+SELECT|OR\s+1=1|WAITFOR\s+DELAY|SLEEP\(", re.IGNORECASE),
            "description": "Web: SQL Injection attempt detected in HTTP request",
            "groups": ["web", "accesslog", "attack", "sqli"],
            "mitre_id": "T1190",
            "mitre_tactic": "Initial Access",
            "mitre_technique": "Exploit Public-Facing Application"
        },
        {
            "id": "31106",
            "level": 8,
            "pattern": re.compile(r"\.\./\.\./|\.env|etc/passwd|win\.ini|wp-config", re.IGNORECASE),
            "description": "Web: Path Traversal / LFI attempt detected",
            "groups": ["web", "accesslog", "attack"],
            "mitre_id": "T1083",
            "mitre_tactic": "Discovery",
            "mitre_technique": "File and Directory Discovery"
        },
        {
            "id": "60106",
            "level": 5,
            "pattern": re.compile(r"EventID=4625|0xC000006D", re.IGNORECASE),
            "description": "Windows: Logon Failure (Event ID 4625)",
            "groups": ["windows", "authentication_failed"],
            "mitre_id": "T1110",
            "mitre_tactic": "Credential Access",
            "mitre_technique": "Brute Force"
        },
        {
            "id": "60112",
            "level": 13,
            "pattern": re.compile(r"vssadmin.*Delete Shadows|bcdedit.*recoveryenabled No|cipher\.exe /w", re.IGNORECASE),
            "description": "Windows: Ransomware activity - shadow copies deleted or recovery disabled",
            "groups": ["windows", "ransomware", "defense_evasion"],
            "mitre_id": "T1490",
            "mitre_tactic": "Impact",
            "mitre_technique": "Inhibit System Recovery"
        },
        {
            "id": "80100",
            "level": 11,
            "pattern": re.compile(r"AttachUserPolicy.*AdministratorAccess|PutBucketPolicy", re.IGNORECASE),
            "description": "AWS: Critical IAM policy escalation or public bucket exposure",
            "groups": ["aws", "cloudtrail", "privilege_escalation"],
            "mitre_id": "T1098",
            "mitre_tactic": "Persistence",
            "mitre_technique": "Account Manipulation"
        },
        {
            "id": "80102",
            "level": 12,
            "pattern": re.compile(r"StopLogging|DeleteTrail", re.IGNORECASE),
            "description": "AWS: CloudTrail logging service terminated by user",
            "groups": ["aws", "cloudtrail", "defense_evasion"],
            "mitre_id": "T1562.001",
            "mitre_tactic": "Defense Evasion",
            "mitre_technique": "Disable or Modify Tools"
        },
        {
            "id": "80200",
            "level": 11,
            "pattern": re.compile(r"Microsoft\.Authorization/roleAssignments/write|Microsoft\.KeyVault/vaults/secrets/read", re.IGNORECASE),
            "description": "Azure: High privilege role assignment or sensitive keyvault read",
            "groups": ["azure", "azure_activity"],
            "mitre_id": "T1098",
            "mitre_tactic": "Persistence",
            "mitre_technique": "Account Manipulation"
        },
        {
            "id": "80300",
            "level": 11,
            "pattern": re.compile(r"CreateServiceAccountKey|compute\.firewalls\.insert", re.IGNORECASE),
            "description": "GCP: Service account key creation or firewall perimeter change",
            "groups": ["gcp", "gcp_audit"],
            "mitre_id": "T1098.001",
            "mitre_tactic": "Persistence",
            "mitre_technique": "Additional Cloud Credentials"
        }
    ]

    @classmethod
    def evaluate_logs(cls, dataset_id: str, logs: List[Dict[str, Any]]) -> WazuhEvaluationSummary:
        alerts: List[WazuhAlert] = []
        rule_counts: Dict[str, int] = {}
        tactics_set = set()

        failed_login_window = []  # For correlation rule 5712 (brute force burst)
        matched_log_indices = set()

        for log_index, log in enumerate(logs):
            msg = log.get("message", "")
            raw_str = f"{msg} {log.get('action', '')} {log.get('event_type', '')} {log.get('path', '')}"
            ts = log.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            src_ip = log.get("source_ip") or log.get("sourceIPAddress") or log.get("client_ip")
            user = log.get("username")

            matched_any = False
            for rule in cls.RULES:
                if rule["pattern"].search(raw_str):
                    matched_any = True
                    matched_log_indices.add(log_index)
                    rule_id = rule["id"]
                    rule_counts[rule_id] = rule_counts.get(rule_id, 0) + 1

                    mitre_dict = {
                        "id": rule["mitre_id"],
                        "tactic": rule["mitre_tactic"],
                        "technique": rule["mitre_technique"]
                    }
                    tactics_set.add(rule["mitre_tactic"])

                    alert = WazuhAlert(
                        id=str(uuid.uuid4()),
                        timestamp=ts,
                        rule_id=rule_id,
                        level=rule["level"],
                        description=rule["description"],
                        groups=rule["groups"],
                        mitre=mitre_dict,
                        source_ip=src_ip,
                        user=user,
                        raw_log=msg,
                        full_log_matched=f"Rule {rule_id} [Level {rule['level']}]: {rule['description']}"
                    )
                    alerts.append(alert)

                    # Correlation tracking
                    if rule_id in ["5710", "5716"]:
                        failed_login_window.append(ts)
                        if len(failed_login_window) >= 4:
                            # Trigger Wazuh Rule 5712: Multiple failed logins / Brute force
                            bf_alert = WazuhAlert(
                                id=str(uuid.uuid4()),
                                timestamp=ts,
                                rule_id="5712",
                                level=10,
                                description="sshd: Brute force trying to get access to the system (multiple authentication failures)",
                                groups=["syslog", "sshd", "authentication_failures"],
                                mitre={"id": "T1110", "tactic": "Credential Access", "technique": "Brute Force"},
                                source_ip=src_ip,
                                user=user,
                                raw_log=f"Correlated threshold alert: 4+ failed attempts detected from {src_ip}",
                                full_log_matched="Rule 5712 [Level 10]: sshd brute force attack detected"
                            )
                            alerts.append(bf_alert)
                            rule_counts["5712"] = rule_counts.get("5712", 0) + 1
                            tactics_set.add("Credential Access")
                            failed_login_window.clear()
                    break

        total_logs = len(logs)
        total_alerts = len(alerts)
        detection_rate = round((len(matched_log_indices) / total_logs * 100.0), 2) if total_logs > 0 else 0.0

        high_sev = sum(1 for a in alerts if a.level >= 10)
        med_sev = sum(1 for a in alerts if 6 <= a.level < 10)
        low_sev = sum(1 for a in alerts if a.level < 6)

        top_rules = [
            {"rule_id": r_id, "count": cnt, "description": next((r["description"] for r in cls.RULES if r["id"] == r_id), "Correlated rule")}
            for r_id, cnt in sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return WazuhEvaluationSummary(
            dataset_id=dataset_id,
            total_logs_analyzed=total_logs,
            total_alerts_generated=total_alerts,
            detection_rate=detection_rate,
            high_severity_alerts=high_sev,
            medium_severity_alerts=med_sev,
            low_severity_alerts=low_sev,
            top_rules_triggered=top_rules,
            mitre_tactics_detected=sorted(list(tactics_set)),
            alerts=alerts,
            evaluated_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        )
