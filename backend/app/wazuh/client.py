import json
import socket
import logging
from typing import List, Dict, Any
from app.config import settings
from app.exporters.formatters import LogExporter

logger = logging.getLogger(__name__)


class WazuhLiveForwarder:
    """
    Sends synthetic log streams directly to a remote or local Wazuh Manager.

    CloudTrail events are transported as their original structured JSON so that
    nested fields such as userIdentity and requestParameters are preserved.
    Other log types continue to use the existing RFC3164 syslog format.
    """

    @staticmethod
    def _is_cloudtrail_event(log: Dict[str, Any]) -> bool:
        """Return True when a log is a structured AWS CloudTrail event."""
        return (
            log.get("source") == "aws_cloudtrail"
            and all(
                field in log
                for field in ("eventVersion", "userIdentity", "eventTime", "eventSource", "eventName")
            )
        )

    @staticmethod
    def _serialize_for_transport(log: Dict[str, Any]) -> str:
        """
        Serialize one event for Wazuh transport.

        CloudTrail events must remain JSON rather than being converted into a
        human-readable syslog message. Other events retain the existing
        RFC3164 representation.
        """
        if WazuhLiveForwarder._is_cloudtrail_event(log):
            return json.dumps(log, ensure_ascii=False, default=str, separators=(",", ":"))

        return LogExporter.to_syslog_rfc3164([log])

    @staticmethod
    def forward_to_wazuh(
        logs: List[Dict[str, Any]],
        host: str = None,
        port: int = None,
        protocol: str = "udp"
    ) -> Dict[str, Any]:
        target_host = host or settings.WAZUH_HOST
        target_port = port or settings.WAZUH_SYSLOG_PORT

        # Preserve structured CloudTrail JSON. Non-CloudTrail events continue
        # through the existing RFC3164 formatter.
        payloads = [WazuhLiveForwarder._serialize_for_transport(log) for log in logs]

        sent_count = 0
        failed_count = 0
        cloudtrail_count = sum(
            1 for log in logs if WazuhLiveForwarder._is_cloudtrail_event(log)
        )

        try:
            if protocol.lower() == "udp":
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                try:
                    for payload in payloads:
                        try:
                            sock.sendto(payload.encode("utf-8"), (target_host, target_port))
                            sent_count += 1
                        except Exception:
                            failed_count += 1
                finally:
                    sock.close()
            else:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    sock.settimeout(3.0)
                    sock.connect((target_host, target_port))
                    for payload in payloads:
                        try:
                            sock.sendall((payload + "\n").encode("utf-8"))
                            sent_count += 1
                        except Exception:
                            failed_count += 1
                finally:
                    sock.close()

            return {
                "success": True,
                "target_host": target_host,
                "target_port": target_port,
                "protocol": protocol,
                "logs_forwarded": sent_count,
                "cloudtrail_json_forwarded": cloudtrail_count,
                "failed_count": failed_count,
                "message": (
                    f"Successfully forwarded {sent_count} synthetic logs to Wazuh "
                    f"at {target_host}:{target_port}"
                )
            }
        except Exception as e:
            logger.warning(f"Live forwarding to Wazuh failed: {e}")
            return {
                "success": False,
                "target_host": target_host,
                "target_port": target_port,
                "error": str(e),
                "message": (
                    f"Could not establish connection to Wazuh at "
                    f"{target_host}:{target_port}. Ensure Wazuh manager is "
                    f"running and allows syslog inputs."
                )
            }
