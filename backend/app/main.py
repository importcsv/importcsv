from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from app.api.routes import api_router
from app.core.config import settings

# Load environment variables
load_dotenv()

app = FastAPI(
    title="ImportCSV API",
    description="API for ImportCSV - An intelligent CSV import tool",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "ImportCSV API is running"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
