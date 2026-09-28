import io
import csv
import json
from datetime import datetime
from typing import List, Dict, Any

class LogExporter:
    @staticmethod
    def to_json(logs: List[Dict[str, Any]], indent: int = 2) -> str:
        return json.dumps(logs, indent=indent, default=str)

    @staticmethod
    def to_ndjson(logs: List[Dict[str, Any]]) -> str:
        lines = [json.dumps(log, default=str) for log in logs]
        return "\n".join(lines)

    @staticmethod
    def to_csv(logs: List[Dict[str, Any]]) -> str:
        if not logs:
            return ""
        
        # Collect union of all fields
        all_keys = set()
        for log in logs:
            for k, v in log.items():
                if not isinstance(v, (dict, list)):
                    all_keys.add(k)
                else:
                    all_keys.add(k)

        # Standard priority order
        priority = ["id", "timestamp", "source", "event_type", "severity", "status", "source_ip", "username", "action", "message"]
        header = [p for p in priority if p in all_keys] + sorted([k for k in all_keys if k not in priority])

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=header, extrasaction="ignore")
        writer.writeheader()

        for log in logs:
            row = {}
            for k in header:
                val = log.get(k)
                if isinstance(val, (dict, list)):
                    row[k] = json.dumps(val)
                else:
                    row[k] = val
            writer.writerow(row)

        return output.getvalue()

    @staticmethod
    def to_syslog_rfc3164(logs: List[Dict[str, Any]]) -> str:
        """BSD Syslog format: <PRI>Mmm dd hh:mm:ss hostname tag: message"""
        lines = []
        for log in logs:
            pri = 86  # Facility security/auth (10) * 8 + Severity info/alert (6)
            sev = str(log.get("severity", "")).lower()
            if sev == "critical":
                pri = 82  # Critical
            elif sev in ["high", "error"]:
                pri = 83  # Error
            elif sev == "medium":
                pri = 84  # Warning

            ts_raw = log.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            try:
                dt = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
                ts_str = dt.strftime("%b %d %H:%M:%S")
            except Exception:
                ts_str = datetime.utcnow().strftime("%b %d %H:%M:%S")

            hostname = log.get("hostname") or log.get("computer_name") or "security-host"
            process = log.get("process") or log.get("source") or "sec_agent"
            pid = log.get("pid") or 1001
            msg = log.get("message") or f"{log.get('event_type', 'event')} user={log.get('username', 'none')}"

            lines.append(f"<{pri}>{ts_str} {hostname} {process}[{pid}]: {msg}")

        return "\n".join(lines)

    @staticmethod
    def to_syslog_rfc5424(logs: List[Dict[str, Any]]) -> str:
        """IETF Syslog RFC 5424 format: <PRI>1 YYYY-MM-DDTHH:MM:SSZ hostname app-name procid msgid [structured-data] msg"""
        lines = []
        for log in logs:
            pri = 86
            sev = str(log.get("severity", "")).lower()
            if sev == "critical":
                pri = 82
            elif sev == "high":
                pri = 83
            elif sev == "medium":
                pri = 84

            ts_raw = log.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            hostname = log.get("hostname") or log.get("computer_name") or "soc-node01"
            app = log.get("process") or log.get("source") or "sec-gen"
            pid = str(log.get("pid") or "1024")
            msg_id = log.get("event_type") or "AUDIT"
            msg = log.get("message") or "Synthetic security audit log"

            src_ip = log.get("source_ip") or "-"
            user = log.get("username") or "-"
            sd = f'[origin ip="{src_ip}" user="{user}"]'

            lines.append(f"<{pri}>1 {ts_raw} {hostname} {app} {pid} {msg_id} {sd} {msg}")

        return "\n".join(lines)
