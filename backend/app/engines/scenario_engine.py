import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


class ScenarioEngine:
    """Generate realistic enterprise telemetry with small, controlled anomalies.

    The generator deliberately models a normal activity stream first and then
    injects scenario-specific deviations. This keeps attacks from appearing as
    isolated blocks of obviously malicious events.
    """

    BENIGN_USERS = [
        "jdoe", "asmith", "developer", "alice", "bob", "analyst",
        "svc_backup", "monitor"
    ]
    ADMIN_USERS = ["admin_ops", "platform_admin", "db_admin"]
    INTERNAL_IPS = [
        "192.168.1.10", "192.168.1.15", "192.168.1.42",
        "10.0.0.5", "10.0.0.12", "172.16.5.20"
    ]
    SYNTHETIC_EXTERNAL_IPS = [
        "198.51.100.23", "198.51.100.47", "203.0.113.18",
        "203.0.113.77", "198.51.100.91"
    ]
    HOSTS = [
        "workstation-01", "workstation-02", "dev-laptop-01",
        "jump-host-01", "web-server-01", "db-server-01"
    ]
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.3",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0 Safari/537.36",
        "curl/8.4.0",
    ]

    @classmethod
    def generate(
        cls,
        scenario_name: str,
        count: int = 100,
        parameters: Dict[str, Any] = None,
    ) -> List[Dict[str, Any]]:
        parameters = parameters or {}
        count = max(1, int(count))

        # anomaly_ratio is now the fraction of the stream influenced by the
        # anomalous behavior, rather than the fraction that becomes "attack logs".
        anomaly_ratio = float(parameters.get("anomaly_ratio", 0.10))
        anomaly_ratio = max(0.0, min(1.0, anomaly_ratio))

        start_time = datetime.utcnow() - timedelta(minutes=max(1, count // 3))

        generators = {
            "ssh_brute_force": cls._generate_ssh_behavior,
            "privilege_escalation": cls._generate_privilege_behavior,
            "web_attack_sqli": cls._generate_web_behavior,
            "ransomware_staging": cls._generate_windows_behavior,
            "lateral_movement": cls._generate_lateral_behavior,
            "benign_baseline": cls._generate_benign_baseline,
        }
        generator = generators.get(scenario_name, cls._generate_ssh_behavior)

        if scenario_name == "benign_baseline":
            return generator(count, start_time, 0.0, parameters)

        return generator(count, start_time, anomaly_ratio, parameters)

    @staticmethod
    def _ts(value: datetime) -> str:
        return value.strftime("%Y-%m-%dT%H:%M:%SZ")

    @classmethod
    def _base_event(
        cls,
        timestamp: datetime,
        source: str,
        hostname: str,
        process: str,
        event_type: str,
        status: str,
        severity: str,
        username: str,
        source_ip: str,
        action: str,
        message: str,
        details: Dict[str, Any],
        **extra: Any,
    ) -> Dict[str, Any]:
        event = {
            "id": str(uuid.uuid4()),
            "timestamp": cls._ts(timestamp),
            "source": source,
            "hostname": hostname,
            "process": process,
            "pid": random.randint(1200, 9000),
            "event_type": event_type,
            "status": status,
            "severity": severity,
            "source_ip": source_ip,
            "username": username,
            "action": action,
            "message": message,
            "details": details,
        }
        event.update(extra)
        return event

    @classmethod
    def _normal_event(
        cls,
        timestamp: datetime,
        index: int,
        scenario: str,
        user: str = None,
        host: str = None,
    ) -> Dict[str, Any]:
        user = user or random.choice(cls.BENIGN_USERS)
        host = host or random.choice(cls.HOSTS)
        src_ip = random.choice(cls.INTERNAL_IPS)
        kind = random.choice([
            "authentication", "process", "file_access",
            "dns", "network", "application"
        ])

        if kind == "authentication":
            port = random.randint(30000, 62000)
            msg = f"Accepted publickey for {user} from {src_ip} port {port} ssh2"
            return cls._base_event(
                timestamp, "linux", host, "sshd", "authentication",
                "success", "informational", user, src_ip, "login_success",
                msg, {"scenario": scenario, "activity": "normal"},
                auth_method="publickey", session_id=f"sess-{index:06d}",
            )

        if kind == "process":
            process = random.choice(["git", "python", "node", "code", "systemd"])
            return cls._base_event(
                timestamp, "linux", host, process, "process_creation",
                "success", "informational", user, src_ip, "process_start",
                f"User {user} started {process} on {host}",
                {"scenario": scenario, "activity": "normal"},
                command_family=process,
            )

        if kind == "file_access":
            path = random.choice([
                "/home/{}/project/src/app.py".format(user),
                "/home/{}/project/README.md".format(user),
                "/var/log/application.log",
                "/srv/shared/report.csv",
            ])
            return cls._base_event(
                timestamp, "linux", host, "file-service", "file_access",
                "success", "informational", user, src_ip, "read",
                f"File read by {user}: {path}",
                {"scenario": scenario, "activity": "normal"},
                path=path,
            )

        if kind == "dns":
            domain = random.choice([
                "git.example.test", "registry.example.test",
                "docs.example.test", "updates.example.test"
            ])
            return cls._base_event(
                timestamp, "linux", host, "systemd-resolved", "dns_query",
                "success", "informational", user, src_ip, "dns_query",
                f"DNS query for {domain}",
                {"scenario": scenario, "activity": "normal"},
                query=domain,
            )

        if kind == "network":
            destination = random.choice(["10.0.0.20", "10.0.0.30", "10.0.0.40"])
            return cls._base_event(
                timestamp, "linux", host, "network-manager", "network_connection",
                "success", "informational", user, src_ip, "connection_established",
                f"Outbound connection from {host} to {destination}",
                {"scenario": scenario, "activity": "normal"},
                destination_ip=destination, destination_port=random.choice([443, 22, 5432]),
            )

        app = random.choice(["Git", "Jira", "VSCode", "PostgreSQL", "Nginx"])
        return cls._base_event(
            timestamp, "linux", host, app.lower(), "application",
            "success", "informational", user, src_ip, "request",
            f"{app} request completed for user {user}",
            {"scenario": scenario, "activity": "normal"},
        )

    @classmethod
    def _stream(
        cls,
        count: int,
        start: datetime,
        scenario: str,
        anomaly_ratio: float,
        normal_builder,
        anomaly_builder,
        params: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        logs = []
        anomaly_count = max(0, int(round(count * anomaly_ratio)))
        # Spread anomalies over the whole timeline instead of putting them first.
        anomaly_positions = set()
        if anomaly_count:
            step = count / anomaly_count
            for n in range(anomaly_count):
                pos = min(count - 1, int(n * step + random.uniform(0, max(0.1, step * 0.35))))
                anomaly_positions.add(pos)

        current = start
        for i in range(count):
            current += timedelta(seconds=random.randint(2, 12))
            if i in anomaly_positions:
                event_params = dict(params)
                event_params["_anomaly_index"] = len([x for x in logs if x.get("details", {}).get("anomaly")])
                event = anomaly_builder(current, i, event_params)
                event["details"]["anomaly"] = True
            else:
                event = normal_builder(current, i)
                event["details"]["anomaly"] = False
            logs.append(event)

        return logs

    @classmethod
    def _storyline_event(
        cls,
        timestamp: datetime,
        index: int,
        user: str,
        host: str,
        src_ip: str,
        session_id: str,
    ) -> Dict[str, Any]:
        """Generate one event from a coherent developer work session.

        Instead of selecting unrelated event types at random, the storyline
        cycles through activities a user would plausibly perform during a
        session. The sequence remains synthetic, but related events share the
        same user, host, source IP and session identifier.
        """
        phase = index % 8

        if phase == 0:
            port = random.randint(30000, 62000)
            return cls._base_event(
                timestamp, "linux", host, "sshd", "authentication",
                "success", "informational", user, src_ip, "login_success",
                f"Accepted publickey for {user} from {src_ip} port {port} ssh2",
                {
                    "scenario": "ssh_brute_force",
                    "activity": "normal",
                    "activity_phase": "session_start",
                    "storyline_id": session_id,
                    "sequence_index": index,
                    "baseline_expected": True,
                },
                auth_method="publickey",
                session_id=session_id,
            )

        if phase in (1, 2):
            process = random.choice(["git", "python", "node", "code"])
            action = random.choice(["process_start", "process_resume"])
            return cls._base_event(
                timestamp, "linux", host, process, "process_creation",
                "success", "informational", user, src_ip, action,
                f"User {user} {('started' if phase == 1 else 'resumed')} {process} on {host}",
                {
                    "scenario": "ssh_brute_force",
                    "activity": "normal",
                    "activity_phase": "development",
                    "storyline_id": session_id,
                    "sequence_index": index,
                    "baseline_expected": True,
                },
                command_family=process,
                session_id=session_id,
            )

        if phase in (3, 4):
            path = random.choice([
                f"/home/{user}/project/src/app.py",
                f"/home/{user}/project/src/config.ts",
                f"/home/{user}/project/README.md",
                "/srv/shared/report.csv",
            ])
            return cls._base_event(
                timestamp, "linux", host, "file-service", "file_access",
                "success", "informational", user, src_ip, random.choice(["read", "write"]),
                f"File activity by {user}: {path}",
                {
                    "scenario": "ssh_brute_force",
                    "activity": "normal",
                    "activity_phase": "project_work",
                    "storyline_id": session_id,
                    "sequence_index": index,
                    "baseline_expected": True,
                },
                path=path,
                session_id=session_id,
            )

        if phase == 5:
            domain = random.choice([
                "git.example.test", "registry.example.test",
                "docs.example.test", "updates.example.test",
            ])
            return cls._base_event(
                timestamp, "linux", host, "systemd-resolved", "dns_query",
                "success", "informational", user, src_ip, "dns_query",
                f"DNS query for {domain}",
                {
                    "scenario": "ssh_brute_force",
                    "activity": "normal",
                    "activity_phase": "dependency_lookup",
                    "storyline_id": session_id,
                    "sequence_index": index,
                    "baseline_expected": True,
                },
                query=domain,
                session_id=session_id,
            )

        if phase == 6:
            destination = random.choice(["10.0.0.20", "10.0.0.30", "10.0.0.40"])
            destination_port = random.choice([443, 5432])
            return cls._base_event(
                timestamp, "linux", host, "network-manager", "network_connection",
                "success", "informational", user, src_ip, "connection_established",
                f"Outbound connection from {host} to {destination}:{destination_port}",
                {
                    "scenario": "ssh_brute_force",
                    "activity": "normal",
                    "activity_phase": "service_access",
                    "storyline_id": session_id,
                    "sequence_index": index,
                    "baseline_expected": True,
                },
                destination_ip=destination,
                destination_port=destination_port,
                session_id=session_id,
            )

        app = random.choice(["Git", "Jira", "VSCode"])
        return cls._base_event(
            timestamp, "linux", host, app.lower(), "application",
            "success", "informational", user, src_ip, "request",
            f"{app} request completed for user {user}",
            {
                "scenario": "ssh_brute_force",
                "activity": "normal",
                "activity_phase": "application_use",
                "storyline_id": session_id,
                "sequence_index": index,
                "baseline_expected": True,
            },
            session_id=session_id,
        )

    @classmethod
    def _generate_ssh_behavior(cls, count, start, anomaly_ratio, params):
        """Generate a believable work-session timeline with interleaved SSH anomalies.

        The background is a single synthetic user's work session rather than a
        bag of unrelated random events. Authentication anomalies are embedded
        into that session and carry ground-truth metadata so the detector can be
        evaluated without making the attack visually obvious.
        """
        user = params.get("username", "developer")
        host = params.get("target_host", "dev-server-01")
        internal_ip = params.get("internal_ip") or random.choice(cls.INTERNAL_IPS)
        external_ip = params.get("attacker_ip") or random.choice(cls.SYNTHETIC_EXTERNAL_IPS)
        session_id = f"work-{uuid.uuid4().hex[:10]}"
        campaign_id = f"ssh-campaign-{uuid.uuid4().hex[:8]}"

        anomaly_count = max(0, int(round(count * anomaly_ratio)))
        anomaly_positions = set()
        if anomaly_count:
            # Keep anomalies distributed through the session, but add small
            # jitter so repeated datasets do not have identical spacing.
            step = count / anomaly_count
            for n in range(anomaly_count):
                center = n * step
                jitter = random.uniform(-step * 0.18, step * 0.18)
                pos = int(max(1, min(count - 1, center + jitter)))
                anomaly_positions.add(pos)

        # Preserve the existing testable behavior: when enough anomaly slots
        # exist, the second anomaly represents an unusual successful login.
        success_anomaly_index = 1 if params.get("compromise_at_end", True) and anomaly_count >= 2 else -1

        logs = []
        current = start
        anomaly_index = 0

        for i in range(count):
            # Work activity has uneven timing rather than a fixed heartbeat.
            current += timedelta(seconds=random.randint(4, 45))

            if i not in anomaly_positions:
                event = cls._storyline_event(
                    current, i, user, host, internal_ip, session_id
                )
                event["details"]["anomaly"] = False
                logs.append(event)
                continue

            port = random.randint(30000, 62000)

            if anomaly_index == success_anomaly_index:
                # A single successful password authentication is modeled as a
                # subtle deviation from the user's normal public-key session.
                msg = f"Accepted password for {user} from {external_ip} port {port} ssh2"
                event = cls._base_event(
                    current, "linux", host, "sshd", "authentication",
                    "success", "high", user, external_ip, "login_success",
                    msg,
                    {
                        "scenario": "ssh_brute_force",
                        "stage": "unusual_authentication",
                        "activity": "authentication_anomaly",
                        "storyline_id": session_id,
                        "sequence_index": i,
                        "baseline_expected": False,
                        "attack_campaign_id": campaign_id,
                        "attempt_number": anomaly_index + 1,
                    },
                    auth_method="password",
                    session_id=session_id,
                )
            else:
                attempted_user = random.choice([
                    user, "admin_ops", "svc_backup", "developer"
                ])
                # Keep the event format familiar to SSH telemetry while making
                # the failed attempts part of the same synthetic timeline.
                invalid_prefix = "invalid user " if attempted_user != user else ""
                msg = (
                    f"Failed password for {invalid_prefix}{attempted_user} "
                    f"from {external_ip} port {port} ssh2"
                )
                event = cls._base_event(
                    current, "linux", host, "sshd", "authentication",
                    "failure", "medium", attempted_user, external_ip,
                    "login_failed", msg,
                    {
                        "scenario": "ssh_brute_force",
                        "stage": "authentication_anomaly",
                        "activity": "authentication_anomaly",
                        "storyline_id": session_id,
                        "sequence_index": i,
                        "baseline_expected": False,
                        "attack_campaign_id": campaign_id,
                        "attempt_number": anomaly_index + 1,
                    },
                    auth_method="password",
                    session_id=session_id,
                )

            event["details"]["anomaly"] = True
            logs.append(event)
            anomaly_index += 1

        return logs

    @classmethod
    def _generate_privilege_behavior(cls, count, start, anomaly_ratio, params):
        user = params.get("username", "developer")
        host = "ubuntu-srv-core"
        src_ip = random.choice(cls.INTERNAL_IPS)

        def normal(ts, i):
            return cls._normal_event(ts, i, "privilege_escalation", user=user, host=host)

        def anomaly(ts, i, _):
            action = random.choice(["sudo_attempt", "role_change", "privileged_session"])
            if action == "sudo_attempt":
                msg = f"{user} : TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=systemctl status application"
                process, event_type = "sudo", "privilege_escalation"
            elif action == "role_change":
                msg = f"Audit: privileged role transition requested by {user} on {host}"
                process, event_type = "auditd", "privilege_escalation"
            else:
                msg = f"Privileged session opened for user root following activity by {user}"
                process, event_type = "su", "privilege_escalation"
            return cls._base_event(
                ts, "linux", host, process, event_type, "success",
                "high", user, src_ip, "privilege_change", msg,
                {"scenario": "privilege_escalation", "stage": action},
            )

        return cls._stream(count, start, "privilege_escalation", anomaly_ratio, normal, anomaly, params)

    @classmethod
    def _generate_web_behavior(cls, count, start, anomaly_ratio, params):
        host = "web-nginx-edge01"
        external_ip = params.get("attacker_ip") or random.choice(cls.SYNTHETIC_EXTERNAL_IPS)
        normal_paths = [
            "/", "/about", "/dashboard", "/api/v1/products",
            "/api/v1/metrics", "/static/css/main.css", "/static/js/bundle.js"
        ]
        anomalous_paths = [
            "/api/v1/users?id=1%20OR%201=1",
            "/login.php?user=admin%27%20--",
            "/search?q=%27%20UNION%20SELECT%20user%20FROM%20accounts--",
            "/view?file=../../../../etc/config",
        ]

        def normal(ts, i):
            ip = random.choice(cls.INTERNAL_IPS)
            path = random.choice(normal_paths)
            status_code = random.choice([200, 200, 200, 304])
            ua = random.choice(cls.USER_AGENTS[:3])
            msg = f'{ip} - - [{ts.strftime("%d/%b/%Y:%H:%M:%S +0000")}] "GET {path} HTTP/1.1" {status_code} 842 "-" "{ua}"'
            return cls._base_event(
                ts, "web_server", host, "nginx", "web_request", "success",
                "informational", "web_user", ip, "http_request", msg,
                {"scenario": "web_attack_sqli", "traffic_type": "normal"},
                client_ip=ip, method="GET", path=path, status_code=status_code,
                user_agent=ua, attack_type=None,
            )

        def anomaly(ts, i, _):
            path = random.choice(anomalous_paths)
            ua = random.choice(["Mozilla/5.0 (X11; Linux x86_64)", "curl/8.4.0"])
            status_code = random.choice([400, 403, 404, 500])
            attack_type = "SQL_Injection" if ("SELECT" in path or "OR" in path) else "Path_Traversal"
            msg = f'{external_ip} - - [{ts.strftime("%d/%b/%Y:%H:%M:%S +0000")}] "GET {path} HTTP/1.1" {status_code} 642 "-" "{ua}"'
            return cls._base_event(
                ts, "web_server", host, "nginx", "web_request", "failure",
                "high", "web_unknown", external_ip, "http_request", msg,
                {"scenario": "web_attack_sqli", "traffic_type": "anomalous", "attack_vector": attack_type},
                client_ip=external_ip, method="GET", path=path, status_code=status_code,
                user_agent=ua, attack_type=attack_type,
            )

        return cls._stream(count, start, "web_attack_sqli", anomaly_ratio, normal, anomaly, params)

    @classmethod
    def _generate_windows_behavior(cls, count, start, anomaly_ratio, params):
        host = "WIN-FINANCE-04"
        user = "jdoe"

        def normal(ts, i):
            event_id = random.choice([4624, 4634, 4688, 4663])
            msg = f"EventID={event_id} Computer={host} User={user} Routine workstation activity"
            return cls._base_event(
                ts, "windows", host, "Security-Auditing", "windows_event",
                "success", "informational", user, "10.0.0.25",
                "routine_activity", msg,
                {"scenario": "ransomware_staging", "activity": "normal"},
                event_id=event_id, task_category="User Activity",
                computer_name=host, subject_user_name=user,
            )

        def anomaly(ts, i, _):
            # Keep the telemetry synthetic and descriptive; no real destructive
            # commands are generated.
            event_id = random.choice([4688, 4663, 7045])
            desc = random.choice([
                "Unusual backup-management process observed",
                "Unusual burst of protected-file write activity",
                "Unexpected service installation observed",
            ])
            msg = f"EventID={event_id} Computer={host} User={user} Desc={desc}"
            return cls._base_event(
                ts, "windows", host, "Security-Auditing", "ransomware_execution",
                "success", "high", user, "10.0.0.25",
                "suspicious_sequence", msg,
                {"scenario": "ransomware_staging", "stage": "behavioral_anomaly"},
                event_id=event_id, task_category="Process Creation",
                computer_name=host, subject_user_name=user,
            )

        return cls._stream(count, start, "ransomware_staging", anomaly_ratio, normal, anomaly, params)

    @classmethod
    def _generate_lateral_behavior(cls, count, start, anomaly_ratio, params):
        src_host = "jump-host-01"
        user = "admin_svc"
        normal_targets = ["web-server-01", "app-server-01"]
        unusual_targets = ["db-server-01", "domain-controller-01", "backup-server-01"]

        def normal(ts, i):
            target = random.choice(normal_targets)
            return cls._base_event(
                ts, "windows", target, "Security-Auditing", "windows_logon",
                "success", "informational", user, "10.0.0.50",
                "network_logon", 
                f"EventID=4624 Computer={target} Account={user} Logon Type=3 Source IP=10.0.0.50",
                {"scenario": "lateral_movement", "activity": "normal", "source_host": src_host},
                event_id=4624, task_category="Logon", computer_name=target,
                subject_user_name=user, target_user_name=user,
                source_network_address="10.0.0.50", logon_type=3,
            )

        def anomaly(ts, i, _):
            target = random.choice(unusual_targets)
            return cls._base_event(
                ts, "windows", target, "Security-Auditing", "windows_logon",
                "success", "high", user, "10.0.0.50",
                "network_logon",
                f"EventID=4624 Computer={target} Account={user} Logon Type=3 Source IP=10.0.0.50",
                {"scenario": "lateral_movement", "activity": "unusual_host_access", "source_host": src_host},
                event_id=4624, task_category="Logon", computer_name=target,
                subject_user_name=user, target_user_name=user,
                source_network_address="10.0.0.50", logon_type=3,
            )

        return cls._stream(count, start, "lateral_movement", anomaly_ratio, normal, anomaly, params)

    @classmethod
    def _generate_benign_baseline(cls, count, start, anomaly_ratio=0.0, params=None):
        params = params or {}
        logs = []
        current = start
        hosts = ["srv-prod-01", "srv-prod-02", "srv-db-01", "srv-cache-01"]
        for i in range(count):
            current += timedelta(seconds=random.randint(2, 12))
            event = cls._normal_event(
                current, i, "benign_baseline",
                user=random.choice(cls.BENIGN_USERS),
                host=random.choice(hosts),
            )
            event["details"]["anomaly"] = False
            logs.append(event)
        return logs
