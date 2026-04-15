from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
import traceback

from services.ai_detection import (
    detect_subjects,
    generate_segmentation_mask,
    analyze_for_enhance,
    generate_image_caption,
)

router = APIRouter()


def _save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded bytes to the uploads directory and return the path."""
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    path = os.path.join("uploads", safe_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


# ─── SUBJECT DETECTION ─────────────────────────────────────────────────────
@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    """Detect subjects in an image using YOLOv8."""
    try:
        image_path = _save_upload(await file.read(), file.filename)
        detections = detect_subjects(image_path)
        return {
            "status": "success",
            "detections": detections,
            "count": len(detections),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── SEGMENTATION MASK ────────────────────────────────────────────────────
@router.post("/mask")
async def mask(file: UploadFile = File(...)):
    """Generate a segmentation mask for the main subject using YOLOv8-seg."""
    try:
        image_path = _save_upload(await file.read(), file.filename)
        result = generate_segmentation_mask(image_path)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── AUTO ENHANCE ──────────────────────────────────────────────────────────
@router.post("/enhance")
async def enhance(file: UploadFile = File(...)):
    """Analyze image and return suggested adjustments."""
    try:
        image_path = _save_upload(await file.read(), file.filename)
        result = analyze_for_enhance(image_path)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── CAPTION GENERATION ───────────────────────────────────────────────────
@router.post("/caption")
async def caption(file: UploadFile = File(...)):
    """Generate descriptive, social, and SEO captions for the image."""
    try:
        image_path = _save_upload(await file.read(), file.filename)
        result = generate_image_caption(image_path)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
