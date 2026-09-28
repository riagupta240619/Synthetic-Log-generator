import json
import re
import uuid
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class LlmEngine:
    SYSTEM_PROMPT = """You are a cybersecurity log generator engine.
Generate realistic synthetic security event logs strictly as a valid JSON array of objects.
Do not output markdown code blocks or conversational text, only valid raw JSON.
Each object must have:
- timestamp (ISO-8601 string)
- source (e.g. linux, windows, aws, web)
- event_type (e.g. authentication, process_creation, privilege_escalation)
- status (success, failure)
- severity (informational, low, medium, high, critical)
- source_ip (valid IPv4)
- username (string)
- message (realistic raw log message string)
"""

    @classmethod
    async def generate_with_prompt(cls, prompt: str, count: int = 10, model: str = None) -> List[Dict[str, Any]]:
        model_name = model or settings.OLLAMA_MODEL
        ollama_url = f"{settings.OLLAMA_BASE_URL}/api/generate"

        user_content = f"{prompt}\nGenerate exactly {count} realistic events in chronological order."

        # 1. Attempt local Ollama
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    ollama_url,
                    json={
                        "model": model_name,
                        "prompt": f"{cls.SYSTEM_PROMPT}\n\nUser Request: {user_content}",
                        "stream": False,
                        "format": "json"
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "")
                    # Extract JSON array
                    parsed = cls._extract_json_array(response_text)
                    if parsed:
                        return parsed[:count]
        except Exception as e:
            logger.info(f"Ollama endpoint unreachable ({e}). Activating Semantic Intelligent LLM Fallback Engine.")

        # 2. Resilient Intelligent Semantic Fallback Engine
        return cls._generate_semantic_fallback(prompt, count)

    @staticmethod
    def _extract_json_array(text: str) -> Optional[List[Dict[str, Any]]]:
        try:
            # First try direct parse
            data = json.loads(text.strip())
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                for val in data.values():
                    if isinstance(val, list):
                        return val
                return [data]
        except Exception:
            pass

        # Regex search for [...]
        match = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return None

    @classmethod
    def _generate_semantic_fallback(cls, prompt: str, count: int) -> List[Dict[str, Any]]:
        lower = prompt.lower()
        now = datetime.utcnow() - timedelta(minutes=count * 2)

        # Detect domain
        is_windows = any(w in lower for w in ["win", "windows", "powershell", "eventid", "rdp", "domain"])
        is_cloud = any(w in lower for w in ["aws", "azure", "gcp", "cloud", "s3", "iam", "cloudtrail"])
        is_web = any(w in lower for w in ["web", "http", "sql", "injection", "nginx", "apache", "url"])
        is_failure = any(w in lower for w in ["fail", "brute", "attack", "denied", "error", "unauthorized"])

        logs = []
        user = "admin" if "admin" in lower else ("root" if "root" in lower else "sec_user")
        ip = "185.220.101.44" if is_failure else "192.168.1.105"

        for i in range(count):
            now += timedelta(seconds=random.randint(2, 12))
            iso_time = now.strftime("%Y-%m-%dT%H:%M:%SZ")

            if is_windows:
                eid = 4625 if (is_failure and i < count - 1) else 4624
                msg = f"EventID={eid} Account Name: {user} Workstation: WIN-CLIENT-09 Status: {'0xC000006D' if eid == 4625 else '0x0'}"
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "windows",
                    "event_type": "authentication",
                    "status": "failure" if eid == 4625 else "success",
                    "severity": "high" if eid == 4625 else "informational",
                    "source_ip": ip,
                    "username": user,
                    "action": "logon_attempt",
                    "message": msg,
                    "details": {"llm_engine": "semantic_fallback", "prompt": prompt, "event_id": eid}
                })
            elif is_cloud:
                act = "ConsoleLogin" if "login" in lower else "CreateAccessKey"
                status = "failure" if (is_failure and i < count - 1) else "success"
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "aws",
                    "event_type": "cloud_audit",
                    "status": status,
                    "severity": "high" if status == "failure" else "medium",
                    "source_ip": ip,
                    "username": user,
                    "action": act,
                    "message": f"AWS CloudTrail {act} initiated from {ip} for {user} status={status}",
                    "details": {"llm_engine": "semantic_fallback", "prompt": prompt}
                })
            elif is_web:
                code = 403 if (is_failure and i < count - 1) else 200
                path = "/login" if "login" in lower else "/api/data"
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "web_server",
                    "event_type": "web_request",
                    "status": "failure" if code >= 400 else "success",
                    "severity": "high" if code >= 400 else "informational",
                    "source_ip": ip,
                    "username": user,
                    "action": "http_get",
                    "status_code": code,
                    "message": f'{ip} - - [{iso_time}] "POST {path} HTTP/1.1" {code} 1420',
                    "details": {"llm_engine": "semantic_fallback", "prompt": prompt}
                })
            else:
                # Default Linux SSH
                status = "failure" if (is_failure and i < count - 1) else "success"
                act_msg = f"Failed password for {user} from {ip} port {random.randint(40000, 60000)} ssh2" if status == "failure" else f"Accepted password for {user} from {ip} port {random.randint(40000, 60000)} ssh2"
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "linux",
                    "event_type": "authentication",
                    "status": status,
                    "severity": "medium" if status == "failure" else "informational",
                    "source_ip": ip,
                    "username": user,
                    "action": "ssh_login",
                    "message": act_msg,
                    "details": {"llm_engine": "semantic_fallback", "prompt": prompt}
                })

        return logs
