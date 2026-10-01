import os
import secrets
from fastapi import Header, HTTPException


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Require a shared API key for protected API routes."""
    expected = os.getenv("SCENARIO_API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="API key authentication is not configured")
    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
