import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ScenarioEngine:
    BENIGN_USERS = ["jdoe", "asmith", "developer", "alice", "bob", "analyst", "svc_backup", "monitor"]
    ATTACK_USERS = ["root", "admin", "administrator", "guest", "test", "oracle", "postgres", "ftpuser"]
    INTERNAL_IPS = ["192.168.1.10", "192.168.1.15", "192.168.1.42", "10.0.0.5", "10.0.0.12", "172.16.5.20"]
    ATTACK_IPS = ["185.220.101.5", "45.154.255.88", "194.26.29.112", "91.240.118.232", "193.32.162.77", "103.251.167.20"]
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
        "sqlmap/1.7.2#stable (https://sqlmap.org)",
        "Nikto/2.1.6",
        "Mozilla/5.0 (compatible; Nmap Scripting Engine; https://nmap.org/book/nse.html)",
        "curl/8.4.0",
        "python-requests/2.31.0"
    ]

    @classmethod
    def generate(cls, scenario_name: str, count: int = 100, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        parameters = parameters or {}
        anomaly_ratio = float(parameters.get("anomaly_ratio", 0.8))  # 80% attack events, 20% benign noise
        start_time = datetime.utcnow() - timedelta(minutes=count * 0.5)

        if scenario_name == "ssh_brute_force":
            return cls._generate_ssh_brute_force(count, start_time, anomaly_ratio, parameters)
        elif scenario_name == "privilege_escalation":
            return cls._generate_privilege_escalation(count, start_time, parameters)
        elif scenario_name == "web_attack_sqli":
            return cls._generate_web_attacks(count, start_time, anomaly_ratio, parameters)
        elif scenario_name == "ransomware_staging":
            return cls._generate_ransomware_staging(count, start_time, parameters)
        elif scenario_name == "lateral_movement":
            return cls._generate_lateral_movement(count, start_time, parameters)
        elif scenario_name == "benign_baseline":
            return cls._generate_benign_baseline(count, start_time)
        else:
            # Default fallback
            return cls._generate_ssh_brute_force(count, start_time, anomaly_ratio, parameters)

    @classmethod
    def _generate_ssh_brute_force(cls, count: int, current_time: datetime, anomaly_ratio: float, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        attacker_ip = params.get("attacker_ip") or random.choice(cls.ATTACK_IPS)
        compromise_at_end = params.get("compromise_at_end", True)
        
        target_host = "srv-app-prod01"
        attack_count = int(count * anomaly_ratio)
        compromise_index = max(1, attack_count - 3) if compromise_at_end else -1

        for i in range(count):
            current_time += timedelta(seconds=random.randint(1, 4))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")

            is_attack = i < attack_count
            if is_attack:
                src_ip = attacker_ip
                if i == compromise_index:
                    # Successful login
                    user = "root" if random.random() < 0.5 else "admin"
                    port = random.randint(40000, 65000)
                    msg = f"Accepted password for {user} from {src_ip} port {port} ssh2"
                    logs.append({
                        "id": str(uuid.uuid4()),
                        "timestamp": iso_time,
                        "source": "linux",
                        "hostname": target_host,
                        "process": "sshd",
                        "pid": random.randint(1000, 9999),
                        "event_type": "authentication",
                        "status": "success",
                        "severity": "high",
                        "source_ip": src_ip,
                        "username": user,
                        "action": "login_success",
                        "message": msg,
                        "details": {"scenario": "ssh_brute_force", "stage": "compromise", "port": port}
                    })
                elif i > compromise_index and compromise_index != -1:
                    # Post-exploitation commands
                    actions = [
                        ("session_opened", f"pam_unix(sshd:session): session opened for user root by (uid=0)"),
                        ("process_exec", "COMMAND=/usr/bin/id UID=0 EUID=0"),
                        ("process_exec", "COMMAND=/bin/cat /etc/shadow UID=0 EUID=0")
                    ]
                    act, msg = actions[min(i - compromise_index - 1, len(actions) - 1)]
                    logs.append({
                        "id": str(uuid.uuid4()),
                        "timestamp": iso_time,
                        "source": "linux",
                        "hostname": target_host,
                        "process": "sudo" if "COMMAND" in msg else "sshd",
                        "pid": random.randint(1000, 9999),
                        "event_type": "post_exploitation",
                        "status": "success",
                        "severity": "critical",
                        "source_ip": src_ip,
                        "username": "root",
                        "action": act,
                        "message": msg,
                        "details": {"scenario": "ssh_brute_force", "stage": "post_exploitation"}
                    })
                else:
                    # Failed login attempts
                    user = random.choice(cls.ATTACK_USERS)
                    port = random.randint(40000, 65000)
                    msg = f"Failed password for invalid user {user} from {src_ip} port {port} ssh2"
                    logs.append({
                        "id": str(uuid.uuid4()),
                        "timestamp": iso_time,
                        "source": "linux",
                        "hostname": target_host,
                        "process": "sshd",
                        "pid": random.randint(1000, 9999),
                        "event_type": "authentication",
                        "status": "failure",
                        "severity": "medium",
                        "source_ip": src_ip,
                        "username": user,
                        "action": "login_failed",
                        "message": msg,
                        "details": {"scenario": "ssh_brute_force", "stage": "password_guessing", "port": port}
                    })
            else:
                # Benign background noise
                user = random.choice(cls.BENIGN_USERS)
                src_ip = random.choice(cls.INTERNAL_IPS)
                port = random.randint(40000, 65000)
                msg = f"Accepted publickey for {user} from {src_ip} port {port} ssh2: RSA SHA256:abc123xyz"
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "linux",
                    "hostname": target_host,
                    "process": "sshd",
                    "pid": random.randint(1000, 9999),
                    "event_type": "authentication",
                    "status": "success",
                    "severity": "informational",
                    "source_ip": src_ip,
                    "username": user,
                    "action": "login_success",
                    "message": msg,
                    "details": {"scenario": "ssh_brute_force", "stage": "benign_noise"}
                })
        return logs

    @classmethod
    def _generate_web_attacks(cls, count: int, current_time: datetime, anomaly_ratio: float, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        attacker_ip = params.get("attacker_ip") or random.choice(cls.ATTACK_IPS)
        target_host = "web-nginx-edge01"

        sqli_payloads = [
            "/api/v1/users?id=1%20OR%201=1",
            "/login.php?user=admin%27%20--",
            "/search?q=%27%20UNION%20SELECT%20null,username,password%20FROM%20users--",
            "/products?category=1;WAITFOR%20DELAY%20%270:0:5%27--",
            "/catalog.php?id=-1%20OR%20SLEEP(5)",
            "/api/order?ref=%27%20OR%20%27x%27=%27x"
        ]
        lfi_payloads = [
            "/../../../../etc/passwd",
            "/index.php?page=../../../../etc/shadow",
            "/view?file=../../../../windows/win.ini",
            "/.env",
            "/actuator/health",
            "/wp-config.php.bak"
        ]
        benign_paths = [
            "/", "/about", "/contact", "/dashboard", "/api/v1/metrics",
            "/static/css/main.css", "/static/js/bundle.js", "/assets/logo.png",
            "/api/v1/products", "/api/v1/cart"
        ]

        attack_count = int(count * anomaly_ratio)

        for i in range(count):
            current_time += timedelta(milliseconds=random.randint(200, 2500))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")

            if i < attack_count:
                is_sqli = random.random() < 0.7
                path = random.choice(sqli_payloads if is_sqli else lfi_payloads)
                status_code = random.choice([403, 404, 500, 200])
                user_agent = random.choice([cls.USER_AGENTS[2], cls.USER_AGENTS[3], cls.USER_AGENTS[5]])
                method = "GET" if random.random() < 0.8 else "POST"
                attack_type = "SQL_Injection" if is_sqli else "Path_Traversal"
                severity = "high" if status_code == 200 else "medium"
                msg = f'{attacker_ip} - - [{current_time.strftime("%d/%b/%Y:%H:%M:%S +0000")}] "{method} {path} HTTP/1.1" {status_code} {random.randint(200, 5000)} "-" "{user_agent}"'
                
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "web_server",
                    "hostname": target_host,
                    "event_type": "web_request",
                    "status": "failure" if status_code >= 400 else "success",
                    "severity": severity,
                    "source_ip": attacker_ip,
                    "client_ip": attacker_ip,
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "bytes_sent": random.randint(200, 5000),
                    "user_agent": user_agent,
                    "attack_type": attack_type,
                    "message": msg,
                    "details": {"scenario": "web_attack_sqli", "attack_vector": attack_type}
                })
            else:
                # Benign web traffic
                client_ip = random.choice(cls.INTERNAL_IPS)
                path = random.choice(benign_paths)
                user_agent = cls.USER_AGENTS[0]
                status_code = 200 if random.random() < 0.95 else 304
                msg = f'{client_ip} - - [{current_time.strftime("%d/%b/%Y:%H:%M:%S +0000")}] "GET {path} HTTP/1.1" {status_code} {random.randint(500, 15000)} "-" "{user_agent}"'
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": iso_time,
                    "source": "web_server",
                    "hostname": target_host,
                    "event_type": "web_request",
                    "status": "success",
                    "severity": "informational",
                    "source_ip": client_ip,
                    "client_ip": client_ip,
                    "method": "GET",
                    "path": path,
                    "status_code": status_code,
                    "bytes_sent": random.randint(500, 15000),
                    "user_agent": user_agent,
                    "attack_type": None,
                    "message": msg,
                    "details": {"scenario": "web_attack_sqli", "traffic_type": "benign"}
                })
        return logs

    @classmethod
    def _generate_privilege_escalation(cls, count: int, current_time: datetime, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        user = params.get("username", "developer")
        host = "ubuntu-srv-core"
        src_ip = random.choice(cls.INTERNAL_IPS)

        stages = [
            ("sshd", "authentication", "success", "informational", f"Accepted publickey for {user} from {src_ip} port 52311 ssh2"),
            ("sudo", "privilege_escalation", "failure", "medium", f"{user} : user NOT in sudoers ; TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/bash"),
            ("sudo", "privilege_escalation", "failure", "medium", f"{user} : 1 incorrect password attempt ; TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow"),
            ("sudo", "privilege_escalation", "success", "high", f"{user} : TTY=pts/1 ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/find . -exec /bin/sh \\; -quit"),
            ("su", "privilege_escalation", "success", "critical", f"Successful su for root by {user}"),
            ("systemd", "process_creation", "success", "high", f"Created slice User Slice of UID 0"),
            ("kernel", "security_alert", "critical", "critical", f"audit: type=1300 audit({int(current_time.timestamp())}.102:45): arch=c000003e syscall=59 success=yes exit=0 exe=\"/bin/dash\"")
        ]

        for i in range(count):
            current_time += timedelta(seconds=random.randint(2, 8))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            stage = stages[i % len(stages)]

            logs.append({
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "linux",
                "hostname": host,
                "process": stage[0],
                "pid": random.randint(2000, 8000),
                "event_type": stage[1],
                "status": stage[2],
                "severity": stage[3],
                "source_ip": src_ip,
                "username": user if "root" not in stage[4] else "root",
                "action": stage[1],
                "message": stage[4],
                "details": {"scenario": "privilege_escalation", "stage_step": i % len(stages)}
            })
        return logs

    @classmethod
    def _generate_ransomware_staging(cls, count: int, current_time: datetime, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        host = "WIN-FINANCE-04"
        user = "jdoe"
        attacker_ip = random.choice(cls.ATTACK_IPS)

        ransomware_cmds = [
            ("4688", "Process Creation", "powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgA...", "critical"),
            ("4688", "Process Creation", "vssadmin.exe Delete Shadows /All /Quiet", "critical"),
            ("4688", "Process Creation", "wbadmin.exe DELETE SYSTEMSTATEBACKUP", "critical"),
            ("4688", "Process Creation", "bcdedit.exe /set {default} recoveryenabled No", "critical"),
            ("4688", "Process Creation", "bcdedit.exe /set {default} bootstatuspolicy ignoreallfailures", "critical"),
            ("4663", "File System Mass Touch", "Access to C:\\Shares\\Finance\\Q4_report.xlsx with write/encrypt mask", "high"),
            ("4688", "Process Creation", "cipher.exe /w:C:\\Shares\\Finance", "high"),
            ("7045", "Service Installation", "A service was installed in the system: WinCryptoSvc.exe", "critical")
        ]

        for i in range(count):
            current_time += timedelta(milliseconds=random.randint(100, 1500))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            cmd = ransomware_cmds[i % len(ransomware_cmds)]

            logs.append({
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "windows",
                "computer_name": host,
                "event_id": int(cmd[0]),
                "task_category": cmd[1],
                "event_type": "ransomware_execution",
                "severity": cmd[3],
                "status": "success",
                "subject_user_name": user,
                "source_network_address": attacker_ip if i == 0 else "-",
                "action": cmd[1],
                "message": f"EventID={cmd[0]} Source=Microsoft-Windows-Security-Auditing Computer={host} User={user} Desc={cmd[2]}",
                "details": {"scenario": "ransomware_staging", "command_executed": cmd[2], "event_id": cmd[0]}
            })
        return logs

    @classmethod
    def _generate_lateral_movement(cls, count: int, current_time: datetime, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        logs = []
        src_host = "WIN-JUMPBOX01"
        target_hosts = ["WIN-DB-SRV", "WIN-DC01", "WIN-FILESRV", "WIN-BACKUP"]
        user = "admin_svc"
        src_ip = "192.168.1.50"

        for i in range(count):
            current_time += timedelta(seconds=random.randint(3, 15))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            target = random.choice(target_hosts)

            logs.append({
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "windows",
                "computer_name": target,
                "event_id": 4624,
                "task_category": "Logon",
                "event_type": "lateral_movement",
                "severity": "high",
                "status": "success",
                "subject_user_name": user,
                "target_user_name": user,
                "source_network_address": src_ip,
                "logon_type": 3,  # Network logon
                "action": "network_logon_smb",
                "message": f"EventID=4624 Computer={target} An account was successfully logged on. Account Name: {user} Logon Type: 3 Source IP: {src_ip}",
                "details": {"scenario": "lateral_movement", "source_host": src_host, "target_host": target}
            })
        return logs

    @classmethod
    def _generate_benign_baseline(cls, count: int, current_time: datetime) -> List[Dict[str, Any]]:
        logs = []
        services = ["sshd", "cron", "systemd", "kernel", "sudo"]
        hosts = ["srv-prod-01", "srv-prod-02", "srv-db-01", "srv-cache-01"]

        for i in range(count):
            current_time += timedelta(seconds=random.randint(1, 10))
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            svc = random.choice(services)
            host = random.choice(hosts)
            user = random.choice(cls.BENIGN_USERS)
            src_ip = random.choice(cls.INTERNAL_IPS)

            if svc == "sshd":
                msg = f"Accepted publickey for {user} from {src_ip} port {random.randint(30000, 60000)} ssh2: RSA SHA256:key"
            elif svc == "cron":
                msg = f"(CRON) info (No MTA installed, discarding output)"
            elif svc == "sudo":
                msg = f"{user} : TTY=pts/0 ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/systemctl status nginx"
            else:
                msg = f"Started Daily apt download activities."

            logs.append({
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": "linux",
                "hostname": host,
                "process": svc,
                "pid": random.randint(1000, 5000),
                "event_type": "routine_system_event",
                "status": "success",
                "severity": "informational",
                "source_ip": src_ip,
                "username": user,
                "action": "system_routine",
                "message": msg,
                "details": {"scenario": "benign_baseline"}
            })
        return logs
