/**
 * STUDIO POV — Backend API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Send an image file to an AI endpoint and return JSON.
 */
async function postImage(endpoint, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error (${response.status}): ${err}`);
  }

  return response.json();
}

/**
 * Detect subjects in an image using YOLOv8.
 * Returns { status, detections[], count }
 */
export async function detectSubjects(file) {
  return postImage('/ai/detect', file);
}

/**
 * Generate a segmentation mask for the main subject.
 * Returns { status, mask (base64 PNG), width, height, detections[], subjectCount }
 */
export async function generateMask(file) {
  return postImage('/ai/mask', file);
}

/**
 * Analyze image and return enhancement suggestions.
 * Returns { suggestions[], analysis }
 */
export async function autoEnhance(file) {
  return postImage('/ai/enhance', file);
}

/**
 * Generate captions for the image.
 * Returns { descriptive, social, seo, detectedObjects[] }
 */
export async function generateCaption(file) {
  return postImage('/ai/caption', file);
}
