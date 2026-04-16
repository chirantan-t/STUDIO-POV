import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from ultralytics import YOLO

# Load YOLOv8 segmentation model (lightweight)
_model = None


def _get_model():
    """Lazy-load the YOLOv8-seg model so startup is fast."""
    global _model
    if _model is None:
        _model = YOLO("yolov8n-seg.pt")
    return _model


# COCO class names for labelling detections
COCO_CLASSES = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic light",
    "fire hydrant",
    "stop sign",
    "parking meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports ball",
    "kite",
    "baseball bat",
    "baseball glove",
    "skateboard",
    "surfboard",
    "tennis racket",
    "bottle",
    "wine glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "couch",
    "potted plant",
    "bed",
    "dining table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy bear",
    "hair drier",
    "toothbrush",
]


# ─── SUBJECT DETECTION ─────────────────────────────────────────────────────
def detect_subjects(image_path: str) -> list:
    """
    Detect subjects in an image using YOLOv8 segmentation model.
    Returns bounding boxes + class name + confidence.
    """
    model = _get_model()
    image = cv2.imread(image_path)

    if image is None:
        return []

    results = model(image)
    detections = []

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        classes = r.boxes.cls.cpu().numpy()
        confidences = r.boxes.conf.cpu().numpy()
        masks_xy = r.masks.xy if r.masks is not None else []

        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box)
            class_id = int(classes[i])
            label = (
                COCO_CLASSES[class_id]
                if class_id < len(COCO_CLASSES)
                else f"class_{class_id}"
            )
            polygon = masks_xy[i].flatten().tolist() if i < len(masks_xy) else []

            detections.append(
                {
                    "bbox": [x1, y1, x2, y2],
                    "class_id": class_id,
                    "label": label,
                    "confidence": round(float(confidences[i]), 3),
                    "polygon": polygon,
                }
            )

    return detections


# ─── SEGMENTATION MASK GENERATION ──────────────────────────────────────────
def generate_segmentation_mask(image_path: str) -> dict:
    """
    Generate a binary segmentation mask for the main subject.
    Returns a base64-encoded grayscale PNG mask image plus detection metadata.
    The mask is white (255) where the subject is, black (0) elsewhere.
    """
    model = _get_model()
    image = cv2.imread(image_path)

    if image is None:
        return {"status": "error", "message": "Could not read image"}

    h, w = image.shape[:2]
    results = model(image)

    # Combine all detected subject masks into one binary mask
    combined_mask = np.zeros((h, w), dtype=np.uint8)
    detections = []

    for r in results:
        if r.masks is None:
            continue

        boxes = r.boxes.xyxy.cpu().numpy()
        classes = r.boxes.cls.cpu().numpy()
        confidences = r.boxes.conf.cpu().numpy()
        masks_xy = r.masks.xy

        for i, polygon_pts in enumerate(masks_xy):
            # Draw each polygon mask onto the combined mask
            pts = polygon_pts.astype(np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(combined_mask, [pts], 255)

            # Record detection info
            x1, y1, x2, y2 = map(int, boxes[i])
            class_id = int(classes[i])
            label = (
                COCO_CLASSES[class_id]
                if class_id < len(COCO_CLASSES)
                else f"class_{class_id}"
            )

            detections.append(
                {
                    "bbox": [x1, y1, x2, y2],
                    "label": label,
                    "confidence": round(float(confidences[i]), 3),
                }
            )

    # Apply slight Gaussian blur for smoother mask edges
    if np.any(combined_mask):
        combined_mask = cv2.GaussianBlur(combined_mask, (5, 5), 0)
        # Re-threshold to keep it clean
        _, combined_mask = cv2.threshold(combined_mask, 127, 255, cv2.THRESH_BINARY)

    # Encode mask as base64 PNG
    pil_mask = Image.fromarray(combined_mask, mode="L")
    buffer = BytesIO()
    pil_mask.save(buffer, format="PNG")
    mask_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "status": "success",
        "mask": mask_b64,
        "width": w,
        "height": h,
        "detections": detections,
        "subjectCount": len(detections),
    }


# ─── AUTO ENHANCE ANALYSIS ────────────────────────────────────────────────
def analyze_for_enhance(image_path: str) -> dict:
    """
    Analyze image histogram, contrast, color balance, and dynamic range.
    Returns real adjustment suggestions based on analysis.
    """
    image = cv2.imread(image_path)

    if image is None:
        return {"suggestions": [], "analysis": {}}

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Brightness analysis
    avg_brightness = float(np.mean(gray))

    # Histogram analysis
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
    total_pixels = gray.shape[0] * gray.shape[1]

    # Dynamic range (5th to 95th percentile)
    cumsum = np.cumsum(hist)
    p5 = int(np.searchsorted(cumsum, total_pixels * 0.05))
    p95 = int(np.searchsorted(cumsum, total_pixels * 0.95))
    dynamic_range = p95 - p5

    # Contrast (standard deviation of luminance)
    contrast_std = float(np.std(gray))

    # Color balance
    avg_b, avg_g, avg_r = [float(v) for v in np.mean(image, axis=(0, 1))]

    # Saturation
    avg_saturation = float(np.mean(hsv[:, :, 1]) / 255.0)

    suggestions = []

    # ── Exposure ──
    if avg_brightness < 100:
        boost = min(1.5, (128 - avg_brightness) / 80)
        suggestions.append(
            {
                "name": "Increase Exposure",
                "param": "exposure",
                "value": round(boost, 2),
                "reason": "Image appears underexposed",
            }
        )
    elif avg_brightness > 180:
        cut = max(-1.0, -(avg_brightness - 128) / 80)
        suggestions.append(
            {
                "name": "Decrease Exposure",
                "param": "exposure",
                "value": round(cut, 2),
                "reason": "Image appears overexposed",
            }
        )

    # ── Contrast ──
    if dynamic_range < 150:
        boost = min(40, round((200 - dynamic_range) / 3))
        suggestions.append(
            {
                "name": "Boost Contrast",
                "param": "contrast",
                "value": int(boost),
                "reason": f"Low dynamic range ({dynamic_range})",
            }
        )

    # ── Shadows ──
    if p5 < 20:
        suggestions.append(
            {
                "name": "Lift Shadows",
                "param": "shadows",
                "value": min(30, round((30 - p5) * 1.5)),
                "reason": "Crushed shadow detail",
            }
        )

    # ── Highlights ──
    if p95 > 240:
        suggestions.append(
            {
                "name": "Recover Highlights",
                "param": "highlights",
                "value": -min(30, round((p95 - 230) * 3)),
                "reason": "Highlight clipping detected",
            }
        )

    # ── Vibrance ──
    if avg_saturation < 0.25:
        suggestions.append(
            {
                "name": "Add Vibrance",
                "param": "vibrance",
                "value": min(35, round((0.35 - avg_saturation) * 100)),
                "reason": "Colors appear muted",
            }
        )

    # ── Sharpening ──
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < 500:
        suggestions.append(
            {
                "name": "Sharpen Details",
                "param": "sharpening",
                "value": 15,
                "reason": "Image could benefit from sharpening",
            }
        )

    return {
        "suggestions": suggestions,
        "analysis": {
            "avgBrightness": round(avg_brightness),
            "dynamicRange": int(dynamic_range),
            "contrast": round(contrast_std),
            "avgSaturation": round(avg_saturation, 2),
            "shadowClip": p5,
            "highlightClip": p95,
            "sharpness": round(laplacian_var, 1),
        },
    }


# ─── CAPTION GENERATION ───────────────────────────────────────────────────
def generate_image_caption(image_path: str) -> dict:
    """
    Analyze the image for brightness, dominant colors, scene lighting, and
    detected objects. Returns descriptive, social, and SEO captions.
    """
    image = cv2.imread(image_path)

    if image is None:
        return {
            "descriptive": "Unable to analyze image.",
            "social": "",
            "seo": "",
        }

    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    avg_brightness = float(np.mean(gray))
    avg_saturation = float(np.mean(hsv[:, :, 1]) / 255.0)
    aspect_ratio = w / h

    # ── Dominant colors ──
    color_refs = [
        ("red", 200, 50, 50),
        ("orange", 220, 140, 50),
        ("yellow", 220, 210, 60),
        ("green", 50, 180, 60),
        ("teal", 50, 180, 180),
        ("blue", 50, 80, 200),
        ("purple", 140, 50, 200),
        ("pink", 220, 80, 160),
        ("warm", 200, 160, 100),
        ("cool", 100, 140, 200),
    ]

    step = max(1, (h * w) // 5000)
    reshaped = image.reshape(-1, 3)[::step]

    votes = {name: 0 for name, *_ in color_refs}

    for pixel in reshaped:
        b_px, g_px, r_px = int(pixel[0]), int(pixel[1]), int(pixel[2])
        sat = (max(r_px, g_px, b_px) - min(r_px, g_px, b_px)) / 255.0
        if sat < 0.1:
            continue
        min_dist = float("inf")
        closest = "neutral"
        for name, cr, cg, cb in color_refs:
            d = (r_px - cr) ** 2 + (g_px - cg) ** 2 + (b_px - cb) ** 2
            if d < min_dist:
                min_dist = d
                closest = name
        votes[closest] = votes.get(closest, 0) + 1

    dominant = sorted(votes.items(), key=lambda x: -x[1])
    top_colors = [c[0] for c in dominant[:3] if c[1] > 0]

    # ── Detect objects for description ──
    try:
        detections = detect_subjects(image_path)
        detected_labels = list({d["label"] for d in detections[:5]})
    except Exception:
        detected_labels = []

    # ── Build descriptors ──
    mood = (
        "dramatic, moody"
        if avg_brightness < 80
        else "balanced" if avg_brightness < 140 else "bright, airy"
    )
    color_desc = ", ".join(top_colors) if top_colors else "neutral"
    sat_desc = (
        "vibrant"
        if avg_saturation > 0.5
        else "natural" if avg_saturation > 0.25 else "muted"
    )
    orientation = (
        "landscape"
        if aspect_ratio > 1.3
        else "portrait" if aspect_ratio < 0.77 else "square"
    )

    lighting = (
        "deep shadows and rich contrast"
        if avg_brightness < 100
        else "bright highlights and open shadows"
    )
    energy = "colorful and energetic" if avg_saturation > 0.4 else "subtle and refined"

    subjects_text = ""
    if detected_labels:
        subjects_text = f" featuring {', '.join(detected_labels)}"

    descriptive = (
        f"A {mood} {orientation}-oriented image with {sat_desc} {color_desc} tones{subjects_text}. "
        f"The composition features {lighting}, creating a {energy} visual atmosphere."
    )

    social_mood = "Colors that pop!" if avg_saturation > 0.4 else "Mood on point."
    social_emoji = "🌙 Dark vibes" if avg_brightness < 100 else "☀️ Golden feels"
    obj_tags = " ".join(f"#{l.replace(' ', '')}" for l in detected_labels[:3])
    social = f"✨ {social_mood} {social_emoji} #photography #creative #{sat_desc} #{mood.split(',')[0]} {obj_tags}".strip()

    seo_subjects = (
        f", featuring {', '.join(detected_labels)}" if detected_labels else ""
    )
    seo = (
        f"{orientation.capitalize()} photograph with {sat_desc} {color_desc} color palette, "
        f"{mood} lighting, professional composition{seo_subjects}"
    )

    return {
        "descriptive": descriptive,
        "social": social,
        "seo": seo,
        "detectedObjects": detected_labels,
    }
