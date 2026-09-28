import random
import uuid
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

class MLMarkovSequenceEngine:
    """
    Stochastic Markov Chain & Tabular Statistical Sequence Model for synthetic security event generation.
    Models transition probabilities across attacker operational lifecycles (MITRE ATT&CK stages).
    """

    STATES = [
        "RECONNAISSANCE",
        "INITIAL_ACCESS_ATTEMPT",
        "CREDENTIAL_ACCESS",
        "ACCESS_SUCCESS",
        "PRIVILEGE_ESCALATION",
        "DEFENSE_EVASION",
        "COLLECTION_EXFILTRATION",
        "BENIGN_ACTIVITY"
    ]

    # Pre-trained baseline transition matrix (Empirical security log transition model)
    DEFAULT_TRANSITION_MATRIX = {
        "BENIGN_ACTIVITY": {
            "BENIGN_ACTIVITY": 0.88,
            "RECONNAISSANCE": 0.08,
            "INITIAL_ACCESS_ATTEMPT": 0.04
        },
        "RECONNAISSANCE": {
            "RECONNAISSANCE": 0.40,
            "INITIAL_ACCESS_ATTEMPT": 0.50,
            "BENIGN_ACTIVITY": 0.10
        },
        "INITIAL_ACCESS_ATTEMPT": {
            "INITIAL_ACCESS_ATTEMPT": 0.65,
            "CREDENTIAL_ACCESS": 0.25,
            "BENIGN_ACTIVITY": 0.10
        },
        "CREDENTIAL_ACCESS": {
            "CREDENTIAL_ACCESS": 0.60,
            "ACCESS_SUCCESS": 0.30,
            "BENIGN_ACTIVITY": 0.10
        },
        "ACCESS_SUCCESS": {
            "PRIVILEGE_ESCALATION": 0.75,
            "DEFENSE_EVASION": 0.15,
            "BENIGN_ACTIVITY": 0.10
        },
        "PRIVILEGE_ESCALATION": {
            "DEFENSE_EVASION": 0.60,
            "COLLECTION_EXFILTRATION": 0.35,
            "PRIVILEGE_ESCALATION": 0.05
        },
        "DEFENSE_EVASION": {
            "COLLECTION_EXFILTRATION": 0.70,
            "DEFENSE_EVASION": 0.20,
            "BENIGN_ACTIVITY": 0.10
        },
        "COLLECTION_EXFILTRATION": {
            "COLLECTION_EXFILTRATION": 0.40,
            "BENIGN_ACTIVITY": 0.60
        }
    }

    @classmethod
    def fit_from_logs(cls, sequence_labels: List[str]) -> Dict[str, Dict[str, float]]:
        """Learns transition probability matrix from observed sequence"""
        transitions = {}
        for s in cls.STATES:
            transitions[s] = {}

        for i in range(len(sequence_labels) - 1):
            curr_s = sequence_labels[i]
            next_s = sequence_labels[i + 1]
            if curr_s in transitions:
                transitions[curr_s][next_s] = transitions[curr_s].get(next_s, 0) + 1

        # Normalize to probabilities
        matrix = {}
        for s, targets in transitions.items():
            total = sum(targets.values())
            if total > 0:
                matrix[s] = {k: v / total for k, v in targets.items()}
            else:
                matrix[s] = cls.DEFAULT_TRANSITION_MATRIX.get(s, {"BENIGN_ACTIVITY": 1.0})
        return matrix

    @classmethod
    def generate_sequence(cls, count: int = 100, transition_matrix: Dict[str, Dict[str, float]] = None) -> List[Dict[str, Any]]:
        matrix = transition_matrix or cls.DEFAULT_TRANSITION_MATRIX
        current_state = "BENIGN_ACTIVITY"
        current_time = datetime.utcnow() - timedelta(minutes=count * 3)

        logs = []
        attacker_ip = "194.26.29.112"
        normal_ip = "192.168.1.45"
        user = "victim_admin"

        state_templates = {
            "RECONNAISSANCE": {
                "source": "network_ids",
                "severity": "low",
                "status": "detected",
                "process": "suricata",
                "action": "port_scan",
                "msg": f"ET SCAN Potential SSH Scan from {attacker_ip} -> target port 22"
            },
            "INITIAL_ACCESS_ATTEMPT": {
                "source": "linux",
                "severity": "medium",
                "status": "failure",
                "process": "sshd",
                "action": "login_failed",
                "msg": f"Failed password for invalid user admin from {attacker_ip} port 51234 ssh2"
            },
            "CREDENTIAL_ACCESS": {
                "source": "linux",
                "severity": "high",
                "status": "failure",
                "process": "sshd",
                "action": "brute_force_spray",
                "msg": f"PAM 2 more authentication failures; logname= uid=0 euid=0 tty=ssh ruser= rhost={attacker_ip}"
            },
            "ACCESS_SUCCESS": {
                "source": "linux",
                "severity": "high",
                "status": "success",
                "process": "sshd",
                "action": "login_success",
                "msg": f"Accepted password for {user} from {attacker_ip} port 51234 ssh2"
            },
            "PRIVILEGE_ESCALATION": {
                "source": "linux",
                "severity": "critical",
                "status": "success",
                "process": "sudo",
                "action": "sudo_abuse",
                "msg": f"{user} : TTY=pts/2 ; PWD=/tmp ; USER=root ; COMMAND=/bin/bash"
            },
            "DEFENSE_EVASION": {
                "source": "linux",
                "severity": "critical",
                "status": "success",
                "process": "auditd",
                "action": "log_tampering",
                "msg": "type=SYSCALL msg=audit: arch=c000003e syscall=87 success=yes exe=\"/bin/rm\" comm=\"rm\" args=\"-rf /var/log/auth.log\""
            },
            "COLLECTION_EXFILTRATION": {
                "source": "network_ids",
                "severity": "critical",
                "status": "success",
                "process": "suricata",
                "action": "data_exfiltration",
                "msg": f"ET POLICY Suspicious Inbound/Outbound SSL Data Transfer to {attacker_ip}:443 bytes=1489201"
            },
            "BENIGN_ACTIVITY": {
                "source": "linux",
                "severity": "informational",
                "status": "success",
                "process": "cron",
                "action": "scheduled_task",
                "msg": "CRON[19283]: (root) CMD (/usr/local/bin/backup_routine.sh > /dev/null 2>&1)"
            }
        }

        for i in range(count):
            # Markov transition
            transitions = matrix.get(current_state, matrix["BENIGN_ACTIVITY"])
            states = list(transitions.keys())
            probs = list(transitions.values())
            # Normalize probabilities just in case
            sum_p = sum(probs)
            if sum_p > 0:
                probs = [p / sum_p for p in probs]
                current_state = np.random.choice(states, p=probs)
            else:
                current_state = "BENIGN_ACTIVITY"

            # Sample inter-arrival delay with exponential distribution
            delay_sec = max(1, int(np.random.exponential(scale=6.0)))
            current_time += timedelta(seconds=delay_sec)
            iso_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")

            tmpl = state_templates[current_state]
            src_ip = attacker_ip if current_state != "BENIGN_ACTIVITY" else normal_ip

            log = {
                "id": str(uuid.uuid4()),
                "timestamp": iso_time,
                "source": tmpl["source"],
                "event_type": tmpl["action"],
                "status": tmpl["status"],
                "severity": tmpl["severity"],
                "source_ip": src_ip,
                "username": user if current_state in ["ACCESS_SUCCESS", "PRIVILEGE_ESCALATION"] else "system",
                "action": tmpl["action"],
                "message": tmpl["msg"],
                "details": {
                    "ml_model": "markov_sequence_chain",
                    "markov_state": current_state,
                    "inter_arrival_delay_s": delay_sec
                }
            }
            logs.append(log)

        return logs
