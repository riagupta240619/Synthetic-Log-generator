import io
import re
import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import pandas as pd

class FileLearnerEngine:
    @staticmethod
    def parse_file(file_content: bytes, filename: str) -> List[Dict[str, Any]]:
        lower_name = filename.lower()
        text = file_content.decode("utf-8", errors="replace")

        # 1. JSON or JSONL
        if lower_name.endswith(".json") or lower_name.endswith(".jsonl"):
            # Try full JSON array
            try:
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    if "logs" in parsed and isinstance(parsed["logs"], list):
                        return parsed["logs"]
                    return [parsed]
            except Exception:
                pass
            # Try line-by-line JSON (JSONL)
            records = []
            for line in text.splitlines():
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except Exception:
                        continue
            if records:
                return records

        # 2. CSV
        if lower_name.endswith(".csv") or "," in text.splitlines()[0]:
            try:
                df = pd.read_csv(io.StringIO(text))
                return df.to_dict(orient="records")
            except Exception:
                pass

        # 3. Syslog / Raw TXT
        records = []
        syslog_pattern = re.compile(r"^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([\w\.\-]+)\s+([\w\.\-]+)(?:\[(\d+)\])?:\s+(.*)$")
        iso_syslog_pattern = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\s+([\w\.\-]+)\s+([\w\.\-]+)(?:\[(\d+)\])?:\s+(.*)$")

        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue

            m = iso_syslog_pattern.match(line) or syslog_pattern.match(line)
            if m:
                ts, host, proc, pid, msg = m.groups()
                records.append({
                    "timestamp": ts,
                    "hostname": host,
                    "process": proc,
                    "pid": int(pid) if pid else 0,
                    "message": msg,
                    "source": "syslog",
                    "event_type": "system_event"
                })
            else:
                # Generic raw log
                records.append({
                    "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "source": "raw_upload",
                    "event_type": "generic_log",
                    "message": line
                })

        return records

    @classmethod
    def analyze_and_synthesize(cls, reference_logs: List[Dict[str, Any]], count: int = 100) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        if not reference_logs:
            return {"error": "Empty reference logs"}, []

        df = pd.DataFrame(reference_logs)
        field_distributions = {}
        sample_pools = {}
        column_types = {}

        for col in df.columns:
            non_null = df[col].dropna()
            if len(non_null) == 0:
                continue

            unique_vals = non_null.unique()
            n_unique = len(unique_vals)

            if n_unique <= 20:
                # Categorical
                counts = non_null.value_counts(normalize=True).to_dict()
                field_distributions[col] = {str(k): float(v) for k, v in counts.items()}
                column_types[col] = "categorical"
            else:
                # High cardinality / sample pool
                sample_pools[col] = [str(x) for x in unique_vals[:100]]
                column_types[col] = "free_text" if col in ["message", "raw"] else "high_cardinality"

        # Analyze timestamps
        start_time = datetime.utcnow()
        time_col = None
        for cand in ["timestamp", "eventTime", "time", "date"]:
            if cand in df.columns:
                time_col = cand
                break

        # Generate synthetic records
        synthetic_logs = []
        current_time = start_time - timedelta(minutes=count)

        for i in range(count):
            current_time += timedelta(seconds=random.randint(1, 10))
            record = {"id": str(uuid.uuid4())}

            for col in df.columns:
                if col in ["id", "_id"]:
                    continue

                if col == time_col:
                    record[col] = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
                elif col in field_distributions:
                    dist = field_distributions[col]
                    keys = list(dist.keys())
                    weights = list(dist.values())
                    record[col] = random.choices(keys, weights=weights)[0]
                elif col in sample_pools:
                    record[col] = random.choice(sample_pools[col])
                else:
                    record[col] = f"synthetic_{col}_{i}"

            # Ensure minimal required fields for platform
            if "timestamp" not in record:
                record["timestamp"] = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
            if "source" not in record:
                record["source"] = "learned_pattern"
            if "message" not in record:
                record["message"] = f"Learned event from file pattern with {len(record.keys())} attributes"
            if "event_type" not in record:
                record["event_type"] = "learned_event"

            synthetic_logs.append(record)

        profile = {
            "columns_discovered": list(df.columns),
            "record_count_analyzed": len(df),
            "column_types": column_types,
            "categorical_distributions": field_distributions
        }

        return profile, synthetic_logs
