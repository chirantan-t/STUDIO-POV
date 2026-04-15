from pydantic import BaseModel
from typing import List, Optional


class Detection(BaseModel):
    bbox: List[int]
    class_id: Optional[int] = None
    label: str
    confidence: float
    polygon: Optional[List[float]] = None


class EnhanceSuggestion(BaseModel):
    name: str
    param: str
    value: float
    reason: str
