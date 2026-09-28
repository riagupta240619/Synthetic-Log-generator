# SynthoSec — Synthetic Cybersecurity Log Platform & Wazuh Detection Evaluator

A full-stack cybersecurity platform that generates **realistic, event-aware, structured synthetic security logs** using **Rule/Scenario Engines**, **File Pattern Learning**, **LLM Prompting**, **ML Markov Sequences**, and **Multi-Cloud Audit Simulators (AWS, Azure, GCP)**, and validates them against **Wazuh SIEM** detection rulesets.

> **Objective:** Ground-truth synthetic telemetry for testing SIEM rules, training analysts, and evaluating detection engineering offline — **no live attacks, production infrastructure, or GPU/CUDA required**.

---

## 🏛 Architecture Overview

```text
                                  REACT + VITE FRONTEND (TypeScript)
                                                 │
                                                 │ REST API (JSON)
                                                 ▼
                                     PYTHON FASTAPI BACKEND
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
                   ▼                             ▼                             ▼
          Rule/Scenario Engine           File Pattern Learner            Cloud Log Engine
          (SSH, SQLi, Sudo, Ransom)     (JSON, CSV, Syslog)          (AWS, Azure, GCP)
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                       LLM Prompt Engine                  ML Stochastic Model
                       (Ollama / Semantic)             (Markov Transition Matrix)
                               │                                   │
                               └─────────────────┬─────────────────┘
                                                 ▼
                                    PYDANTIC VALIDATION LAYER
                                  (Schema, Time Monotonicity, IP)
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                           STORAGE ENGINE                 EXPORTERS
                         (MongoDB / Local)           (JSON, CSV, Syslog)
                                 │                               │
                                 └───────────────┬───────────────┘
                                                 ▼
                                     WAZUH EVALUATION ENGINE
                                 (Ruleset Decoders & MITRE ATT&CK)
                                                 │
                                                 ▼
                                       DETECTION DASHBOARD
```

---

## 🚀 Key Features

### 1. Scenario-Based Generator
- **SSH Brute Force & Breach:** Models password guessing across invalid users and root, followed by authentic breach, tty allocation, and post-exploitation inspection (`id`, `/etc/shadow`).
- **Linux Privilege Escalation:** Sudo permission denials, password attempts, sudo escapes, and root shell spawning (`/bin/sh`, `/bin/bash`).
- **Web Application Attacks:** SQL Injection (`UNION SELECT`, `OR 1=1`) and Path Traversal / LFI (`/../../../../etc/passwd`, `/.env`) with realistic status codes (403, 404, 500, 200).
- **Windows Ransomware Defense Evasion:** Event IDs 4688, 4663, and 7045 simulating `vssadmin delete shadows`, `bcdedit recovery disabled`, encoded PowerShell cradles, and mass file encryption.
- **Lateral Movement:** Event ID 4624 (Type 3 network logon) across domain controllers using compromised service credentials.
- **Configurable Anomaly Ratio:** Mix 0%–100% attack events with benign background noise to simulate noisy enterprise environments.

### 2. File Pattern Learner & Synthesizer
- Accepts real logs in **JSON**, **JSONL**, **CSV**, or **Syslog/TXT** format.
- Extracts column types, discrete empirical probability distributions, and inter-arrival time intervals.
- Synthesizes completely new records that adhere to the learned statistical patterns without leaking original sensitive strings.

### 3. Multi-Cloud Security & Audit Logs
- **AWS CloudTrail:** Simulates IAM backdoors (`CreateUser`, `AttachUserPolicy: AdministratorAccess`), public S3 buckets (`PutBucketPolicy`), and trail tampering (`StopLogging`).
- **Azure Activity Logs:** Administrative RBAC role assignments (`RoleAssignmentWrite: Owner`), KeyVault secret retrieval, and VM deletion.
- **GCP Cloud Audit Logs:** Service account key generation (`CreateServiceAccountKey`) and firewall perimeter alterations (`compute.firewalls.insert`).

### 4. LLM-Based Structured Log Generator
- Accepts natural language incident descriptions (e.g. *"Generate 15 PowerShell download cradle events"*).
- Interacts with local **Ollama** (`http://localhost:11434`) or automatically falls back to an intelligent semantic schema generator.
- Passes all records through Pydantic validators to eliminate hallucinations or invalid types.

### 5. ML Markov Chain Stochastic Sequence Model
- Models attacker operational lifecycles through a first-order Markov transition matrix:
  $$\text{Reconnaissance} \rightarrow \text{Initial Access} \rightarrow \text{Credential Spray} \rightarrow \text{Privilege Escalation} \rightarrow \text{Defense Evasion} \rightarrow \text{Exfiltration}$$
- Uses exponential Poisson distributions for realistic non-deterministic inter-event arrival delays.

### 6. Pydantic Validation & Temporal Integrity Engine
- Validates data against strict Pydantic models.
- Checks chronological timestamp monotonicity (no time inversion).
- Validates IPv4/IPv6 syntax and RFC standard HTTP status codes.
- Computes an overall Dataset Integrity Score (0%–100%).

### 7. Multi-Format Exporters
- **JSON:** Formatted array of structured log objects.
- **NDJSON:** Newline-delimited JSON for log forwarders (Filebeat, Logstash, Fluentd).
- **CSV:** Tabular format with headers for spreadsheet analytics.
- **Syslog BSD (RFC 3164):** Standard syslog format `<PRI>Mmm dd hh:mm:ss hostname tag: msg`.
- **Syslog IETF (RFC 5424):** Modern structured syslog format.

### 8. Wazuh SIEM Integration & Detection Testing
- Grounded in official Wazuh Rulesets (Rules 5710, 5712, 5716, 5402, 31103, 31106, 60106, 60112, 80100, 80102, etc.).
- Calculates **Detection Rate %**, severity breakdown (Critical, High, Medium, Low), and maps triggered alerts to **MITRE ATT&CK Tactics & Techniques**.
- **Live Syslog Forwarder:** Stream synthetic logs directly to any Wazuh Manager over UDP/TCP port 514.

### 9. Resilient Storage
- Supports **MongoDB** natively.
- Automatic zero-config fallback to **local file-backed storage** (`data/db_storage.json`) when MongoDB is offline, enabling immediate out-of-the-box execution.

---

## 🛠 Quickstart Guide

### Option A: Local Development (Fastest)

#### 1. Setup Backend (Python FastAPI)
```bash
# Activate virtual environment
.\venv\Scripts\activate.bat   # Windows
# or: source venv/bin/activate # Linux/Mac

# Run backend
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*Backend runs at: `http://127.0.0.1:8000` (Swagger UI at: `http://127.0.0.1:8000/docs`)*

#### 2. Setup Frontend (React + Vite)
```bash
# In a new terminal
cd frontend
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

#### 3. Convenience Windows Launchers
- Double click `start_backend.bat`
- Double click `start_frontend.bat`

---

### Option B: Docker Compose

To run the entire platform (Frontend + Backend + MongoDB) inside containers:

```bash
docker compose up --build
```
- Frontend UI: `http://localhost` or `http://localhost:3000`
- FastAPI Backend: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## 🧪 Running Automated Tests

To run the unit test suite verifying all 5 engines, validator, exporters, and Wazuh matcher:

```bash
cd backend
..\venv\Scripts\python -m pytest tests -v
```

All 7 test suites pass:
- `test_ssh_brute_force_scenario` — PASSED
- `test_web_attack_scenario` — PASSED
- `test_cloud_engine_aws_and_azure` — PASSED
- `test_ml_markov_sequence_generation` — PASSED
- `test_llm_engine_fallback` — PASSED
- `test_validator_and_wazuh_ruleset` — PASSED
- `test_exporters_formatting` — PASSED

---

## 📂 Project Structure

```text
Synthetic-Log-Generator/
├── backend/
│   ├── app/
│   │   ├── config.py             # Environment & path settings
│   │   ├── database.py           # MongoDB + local storage fallback
│   │   ├── main.py               # FastAPI entry point & CORS
│   │   ├── models/               # Pydantic schemas (log events, datasets, wazuh)
│   │   ├── engines/
│   │   │   ├── scenario_engine.py      # SSH, Sudo, SQLi, Ransomware, Lateral
│   │   │   ├── cloud_engine.py         # AWS CloudTrail, Azure Activity, GCP Audit
│   │   │   ├── file_learner_engine.py  # JSON, CSV, Syslog learner
│   │   │   ├── llm_engine.py           # Ollama + Semantic prompt fallback
│   │   │   └── ml_engine.py            # Stochastic Markov state sequences
│   │   ├── validators/           # LogValidator & schema scoring
│   │   ├── exporters/            # JSON, NDJSON, CSV, Syslog formatters
│   │   ├── wazuh/                # WazuhRulesetMatcher & LiveForwarder
│   │   └── routers/              # API endpoints (/generate, /upload, /datasets, /validate, /wazuh)
│   ├── tests/                    # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts         # API integration client
│   │   ├── components/           # UI views (Scenarios, Cloud, Upload, LLM, ML, Datasets, Wazuh)
│   │   ├── types/index.ts        # TypeScript models
│   │   ├── App.tsx
│   │   ├── index.css             # Cyber SOC dark theme
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── samples/                  # Sample reference files for File Learner testing
├── docker-compose.yml
└── README.md
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate/scenario` | Generate rule/scenario-based event sequence |
| `POST` | `/api/generate/cloud` | Generate AWS, Azure, or GCP audit events |
| `POST` | `/api/generate/llm` | Generate structured logs from natural language prompt |
| `POST` | `/api/generate/ml` | Sample sequence from ML Markov Transition Model |
| `POST` | `/api/upload/learn` | Upload file (JSON/CSV/Syslog) and synthesize new logs |
| `GET` | `/api/datasets` | List all stored datasets with summary metadata |
| `GET` | `/api/datasets/{id}` | Retrieve dataset records and fields |
| `GET` | `/api/datasets/{id}/export` | Export as `json`, `ndjson`, `csv`, or `syslog` |
| `DELETE` | `/api/datasets/{id}` | Delete a dataset |
| `POST` | `/api/validate/{id}` | Run Pydantic & temporal integrity validation |
| `POST` | `/api/wazuh/test/{id}` | Evaluate dataset against Wazuh detection rules |
| `POST` | `/api/wazuh/forward/{id}` | Live stream logs to Wazuh Syslog socket |
| `GET` | `/health` | System and database connection status |

---

## 🛡️ Wazuh SIEM Testing Workflow

1. Generate a dataset with an attack scenario (e.g. **SSH Brute Force** or **AWS S3 Exposure**).
2. The system knows the **ground truth** (which scenario and attack stage occurred).
3. Click **"Test in Wazuh"** in the UI:
   - The platform evaluates each log against standard Wazuh XML detection rules.
   - Computes **Detection Rate %**, triggered rule levels (1–15), and **MITRE ATT&CK** tags.
4. *(Optional)* If you have an active Wazuh Manager running, enter its IP in the **Live Syslog Forwarder** to stream the logs over UDP/TCP port 514 into your Wazuh cluster!
