from fastapi import APIRouter, Body, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import logging
import json
import os

from app.db.base import get_db
from app.models.importer import Importer
from app.services.importer import get_importer_by_key
from app.services.llm import llm_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Column mapping classes removed - functionality moved to frontend

# Column mapping endpoint removed - functionality moved to frontend
