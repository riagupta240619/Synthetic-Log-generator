from app.wazuh.client import WazuhLiveForwarder


def test_cloudtrail_transport_preserves_structured_json():
    log = {
        "id": "cloudtrail-1",
        "source": "aws_cloudtrail",
        "eventVersion": "1.08",
        "userIdentity": {
            "type": "IAMUser",
            "userName": "aws_admin",
            "accountId": "987654321098",
        },
        "eventTime": "2026-10-07T10:00:00Z",
        "eventSource": "iam.amazonaws.com",
        "eventName": "CreateUser",
        "awsRegion": "us-east-1",
        "sourceIPAddress": "203.0.113.10",
        "requestParameters": {
            "userName": "backup_backdoor_svc",
        },
        "message": "AWS CloudTrail CreateUser from 203.0.113.10 by aws_admin",
    }

    payload = WazuhLiveForwarder._serialize_for_transport(log)

    assert payload.startswith("{")
    assert payload.endswith("}")
    assert "AWS CloudTrail CreateUser from" in payload

    # Verify the complete nested CloudTrail structure survives serialization.
    import json
    restored = json.loads(payload)

    assert restored["eventVersion"] == "1.08"
    assert restored["userIdentity"]["userName"] == "aws_admin"
    assert restored["eventTime"] == "2026-10-07T10:00:00Z"
    assert restored["eventSource"] == "iam.amazonaws.com"
    assert restored["eventName"] == "CreateUser"
    assert restored["awsRegion"] == "us-east-1"
    assert restored["sourceIPAddress"] == "203.0.113.10"
    assert restored["requestParameters"]["userName"] == "backup_backdoor_svc"


def test_non_cloudtrail_transport_still_uses_syslog():
    log = {
        "timestamp": "2026-10-07T10:00:00Z",
        "hostname": "ubuntu-srv-01",
        "process": "sshd",
        "event_type": "authentication",
        "username": "admin",
        "source_ip": "203.0.113.10",
        "message": "Accepted password for admin",
    }

    payload = WazuhLiveForwarder._serialize_for_transport(log)

    assert payload.startswith("<")
    assert "Accepted password for admin" in payload
    assert not payload.startswith("{")
