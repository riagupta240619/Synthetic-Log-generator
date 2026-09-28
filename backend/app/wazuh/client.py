import socket
import logging
from typing import List, Dict, Any
from app.config import settings
from app.exporters.formatters import LogExporter

logger = logging.getLogger(__name__)

class WazuhLiveForwarder:
    """
    Sends synthetic log streams directly to a remote or local Wazuh Manager via Syslog (UDP/TCP port 514).
    """

    @staticmethod
    def forward_to_wazuh(logs: List[Dict[str, Any]], host: str = None, port: int = None, protocol: str = "udp") -> Dict[str, Any]:
        target_host = host or settings.WAZUH_HOST
        target_port = port or settings.WAZUH_SYSLOG_PORT

        syslog_payload = LogExporter.to_syslog_rfc3164(logs)
        lines = syslog_payload.splitlines()

        sent_count = 0
        failed_count = 0

        try:
            if protocol.lower() == "udp":
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                for line in lines:
                    try:
                        sock.sendto(line.encode("utf-8"), (target_host, target_port))
                        sent_count += 1
                    except Exception:
                        failed_count += 1
                sock.close()
            else:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(3.0)
                sock.connect((target_host, target_port))
                for line in lines:
                    try:
                        sock.sendall((line + "\n").encode("utf-8"))
                        sent_count += 1
                    except Exception:
                        failed_count += 1
                sock.close()

            return {
                "success": True,
                "target_host": target_host,
                "target_port": target_port,
                "protocol": protocol,
                "logs_forwarded": sent_count,
                "failed_count": failed_count,
                "message": f"Successfully forwarded {sent_count} synthetic logs to Wazuh at {target_host}:{target_port}"
            }
        except Exception as e:
            logger.warning(f"Live forwarding to Wazuh failed: {e}")
            return {
                "success": False,
                "target_host": target_host,
                "target_port": target_port,
                "error": str(e),
                "message": f"Could not establish connection to Wazuh at {target_host}:{target_port}. Ensure Wazuh manager is running and allows syslog inputs."
            }
