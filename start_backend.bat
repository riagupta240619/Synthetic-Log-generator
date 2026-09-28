@echo off
echo ========================================================
echo Starting SynthoSec FastAPI Backend (Port 8000)...
echo ========================================================
call .\venv\Scripts\activate.bat
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
