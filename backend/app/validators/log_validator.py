import re
import ipaddress
from datetime import datetime
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, Field

class ValidationIssue(BaseModel):
    log_index: int
    field: str
    issue_type: str
    severity: str  # critical, warning, info
    description: str

class ValidationReport(BaseModel):
    dataset_id: str
    total_logs: int
    valid_logs: int
    invalid_logs: int
    score: float
    status: str  # passed, warning, failed
    issues_summary: Dict[str, int]
    issues: List[ValidationIssue]
    validation_checks: Dict[str, bool]

class LogValidator:
    @staticmethod
    def is_valid_ip(ip_str: str) -> bool:
        if not ip_str or ip_str == "-" or ip_str.lower() == "localhost":
            return True
        try:
            ipaddress.ip_address(ip_str)
            return True
        except ValueError:
            return False

    @staticmethod
    def parse_timestamp(ts: str) -> Tuple[bool, datetime]:
        formats = [
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%b %d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S"
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(ts, fmt)
                return True, dt
            except Exception:
                continue
        # ISO fallback
        try:
            return True, datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            return False, datetime.min

    @classmethod
    def validate_dataset(cls, dataset_id: str, logs: List[Dict[str, Any]]) -> ValidationReport:
        issues: List[ValidationIssue] = []
        checks = {
            "schema_structure": True,
            "timestamp_format": True,
            "temporal_ordering": True,
            "ip_address_validity": True,
            "status_coherence": True,
        }

        prev_dt = None
        invalid_count = 0

        for idx, log in enumerate(logs):
            log_has_error = False

            # 1. Required core fields check
            if not isinstance(log, dict):
                issues.append(ValidationIssue(
                    log_index=idx,
                    field="root",
                    issue_type="invalid_format",
                    severity="critical",
                    description="Log entry is not a valid JSON/dict object"
                ))
                invalid_count += 1
                checks["schema_structure"] = False
                continue

            # 2. Timestamp check
            raw_ts = log.get("timestamp") or log.get("eventTime") or log.get("time")
            if not raw_ts:
                issues.append(ValidationIssue(
                    log_index=idx,
                    field="timestamp",
                    issue_type="missing_timestamp",
                    severity="critical",
                    description="Log does not contain a timestamp field"
                ))
                log_has_error = True
                checks["timestamp_format"] = False
            else:
                valid_ts, dt = cls.parse_timestamp(str(raw_ts))
                if not valid_ts:
                    issues.append(ValidationIssue(
                        log_index=idx,
                        field="timestamp",
                        issue_type="invalid_timestamp_syntax",
                        severity="warning",
                        description=f"Timestamp value '{raw_ts}' cannot be parsed as standard ISO or Syslog time"
                    ))
                    log_has_error = True
                    checks["timestamp_format"] = False
                else:
                    if prev_dt and dt < prev_dt:
                        issues.append(ValidationIssue(
                            log_index=idx,
                            field="timestamp",
                            issue_type="temporal_inversion",
                            severity="warning",
                            description=f"Log timestamp {dt} occurs earlier than previous log ({prev_dt})"
                        ))
                        checks["temporal_ordering"] = False
                    prev_dt = dt

            # 3. IP Address check
            src_ip = log.get("source_ip") or log.get("sourceIPAddress") or log.get("client_ip") or log.get("callerIpAddress")
            if src_ip and not cls.is_valid_ip(str(src_ip)):
                issues.append(ValidationIssue(
                    log_index=idx,
                    field="source_ip",
                    issue_type="malformed_ip",
                    severity="warning",
                    description=f"Source IP '{src_ip}' is not a syntactically valid IPv4 or IPv6 address"
                ))
                checks["ip_address_validity"] = False
                log_has_error = True

            # 4. Status code / coherence check
            if "status_code" in log:
                sc = log["status_code"]
                try:
                    code = int(sc)
                    if code < 100 or code > 599:
                        issues.append(ValidationIssue(
                            log_index=idx,
                            field="status_code",
                            issue_type="out_of_range_http_code",
                            severity="warning",
                            description=f"HTTP status code '{code}' is outside valid 100-599 range"
                        ))
                        checks["status_coherence"] = False
                except (ValueError, TypeError):
                    issues.append(ValidationIssue(
                        log_index=idx,
                        field="status_code",
                        issue_type="invalid_type",
                        severity="warning",
                        description=f"Status code '{sc}' is not numeric"
                    ))
                    checks["status_coherence"] = False

            if log_has_error:
                invalid_count += 1

        total = len(logs)
        valid_count = max(0, total - invalid_count)
        score = round((valid_count / total * 100.0), 2) if total > 0 else 0.0

        if score >= 95.0:
            status = "passed"
        elif score >= 70.0:
            status = "warning"
        else:
            status = "failed"

        summary = {
            "critical": sum(1 for i in issues if i.severity == "critical"),
            "warning": sum(1 for i in issues if i.severity == "warning"),
            "info": sum(1 for i in issues if i.severity == "info")
        }

        return ValidationReport(
            dataset_id=dataset_id,
            total_logs=total,
            valid_logs=valid_count,
            invalid_logs=invalid_count,
            score=score,
            status=status,
            issues_summary=summary,
            issues=issues[:100],  # Return up to first 100 issues for preview
            validation_checks=checks
        )
