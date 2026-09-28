import pytest
from app.engines.scenario_engine import ScenarioEngine
from app.engines.cloud_engine import CloudEngine
from app.engines.ml_engine import MLMarkovSequenceEngine
from app.engines.llm_engine import LlmEngine
from app.validators.log_validator import LogValidator
from app.wazuh.emulator import WazuhRulesetMatcher
from app.exporters.formatters import LogExporter

def test_ssh_brute_force_scenario():
    logs = ScenarioEngine.generate("ssh_brute_force", count=30, parameters={"anomaly_ratio": 0.8})
    assert len(logs) == 30
    assert any("Failed password" in log["message"] for log in logs)
    assert any("Accepted password" in log["message"] for log in logs)

def test_web_attack_scenario():
    logs = ScenarioEngine.generate("web_attack_sqli", count=25)
    assert len(logs) == 25
    assert any("UNION SELECT" in log["message"] or "OR 1=1" in log["message"] or "../" in log["message"] for log in logs)

def test_cloud_engine_aws_and_azure():
    aws_logs = CloudEngine.generate("aws", count=15)
    assert len(aws_logs) == 15
    assert aws_logs[0]["source"] == "aws_cloudtrail"

    azure_logs = CloudEngine.generate("azure", count=15)
    assert len(azure_logs) == 15
    assert azure_logs[0]["source"] == "azure_activity"

def test_ml_markov_sequence_generation():
    logs = MLMarkovSequenceEngine.generate_sequence(count=40)
    assert len(logs) == 40
    states = [l["details"]["markov_state"] for l in logs]
    assert len(set(states)) >= 2

def test_llm_engine_fallback():
    import asyncio
    logs = asyncio.run(LlmEngine.generate_with_prompt("Generate 10 suspicious PowerShell download commands", count=10))
    assert len(logs) == 10
    assert logs[0]["source"] in ["windows", "linux", "generic"]

def test_validator_and_wazuh_ruleset():
    logs = ScenarioEngine.generate("ssh_brute_force", count=20)
    report = LogValidator.validate_dataset("test-ds", logs)
    assert report.total_logs == 20
    assert report.score >= 90.0

    wazuh_summary = WazuhRulesetMatcher.evaluate_logs("test-ds", logs)
    assert wazuh_summary.total_alerts_generated > 0
    assert "Credential Access" in wazuh_summary.mitre_tactics_detected

def test_exporters_formatting():
    logs = ScenarioEngine.generate("ssh_brute_force", count=5)
    json_out = LogExporter.to_json(logs)
    assert len(json_out) > 0
    csv_out = LogExporter.to_csv(logs)
    assert "timestamp" in csv_out
    syslog_out = LogExporter.to_syslog_rfc3164(logs)
    assert "<8" in syslog_out
