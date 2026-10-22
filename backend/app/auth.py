import os
import secrets
from typing import Optional

from fastapi import Header, HTTPException


def require_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    """Require a shared API key when configured.

    Local development may run without a key. Set APP_ENV=production (or
    staging) to fail closed if SCENARIO_API_KEY has not been configured.
    """
    expected = os.getenv("SCENARIO_API_KEY")
    environment = os.getenv("APP_ENV", "development").lower()

    if not expected:
        if environment in {"production", "prod", "staging"}:
            raise HTTPException(
                status_code=503,
                detail="API key authentication is not configured",
            )
        return

    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
