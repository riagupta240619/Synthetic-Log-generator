import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db_manager
from app.routers import generation, upload, datasets, validation, wazuh

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Synthetic Log Platform...")
    await db_manager.connect()
    yield
    # Shutdown
    logger.info("Shutting down Synthetic Log Platform...")
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack Synthetic Cybersecurity Log Generation Platform with Scenario, File-Learner, LLM, ML, Cloud engines & Wazuh Detection Testing.",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default port 5173 or any dev origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(generation.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(validation.router, prefix=settings.API_V1_STR)
app.include_router(wazuh.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "mongodb" if db_manager.is_mongo_connected else "local_json_storage",
        "storage_dir": settings.DATA_DIR
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to Synthetic Cybersecurity Log Generator API",
        "docs_url": "/docs",
        "health_url": "/health"
    }
