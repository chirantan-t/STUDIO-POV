# 🎬 STUDIO POV — AI-Powered Photo & Video Editor

A premium creative studio with **Liquid Glass UI**, professional **Lightroom-style** editing tools, and **AI-powered** features.

![STUDIO POV](https://img.shields.io/badge/STUDIO_POV-v1.0-7C5CFC?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss)

## ✨ Features

### 🎨 Professional Editing Tools
- **Basic Adjustments** — Exposure, Contrast, Brightness, Highlights, Shadows, Whites, Blacks
- **Color Adjustments** — Temperature, Tint, Vibrance, Saturation
- **Tone Curve** — Interactive RGB curve editor with draggable control points
- **HSL Panel** — Per-color Hue, Saturation, and Luminance control
- **Color Grading** — Interactive color wheels for Shadows, Midtones, Highlights
- **Detail** — Sharpening, Noise Reduction, Texture, Clarity
- **Effects** — Dehaze, Vignette, Grain
- **Crop & Transform** — Aspect ratios, Rotation, Flip

### 🎬 30+ Built-in Presets
Cinematic, Vintage, Portrait, Travel, Street, Film Simulation, B&W, HDR, Instagram-style

### 🤖 AI Tools
- **Subject Detection** — Detect people, faces, animals, objects
- **AI Masking** — Auto-generate masks around subjects
- **Background Removal** — One-click background removal
- **Auto Enhance** — AI-powered lighting & color optimization
- **Caption Generation** — Auto-generate captions for images

### 🖥️ Liquid Glass UI
- Glassmorphism panels with frosted blur
- Neon glow accents and animated borders
- Smooth Framer Motion animations
- Floating shadows and parallax effects
- Premium dark theme with gradient mesh background

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Opens at [http://localhost:8000](http://localhost:8000) (API docs at `/docs`)

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+O` | Open file |
| `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `Scroll` | Zoom |
| `Alt+Drag` | Pan |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TailwindCSS v3 |
| Animations | Framer Motion |
| State | Zustand |
| Image Processing | Canvas 2D API (client), OpenCV (server) |
| Backend | FastAPI, Python |
| AI Models | Mock (structured for YOLOv8 / SAM integration) |

## 📁 Project Structure

```
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout/      # TopNav, LeftSidebar, RightPanel, BottomBar
│   │   │   ├── panels/      # All editing panels (Basic, Color, HSL, etc.)
│   │   │   ├── canvas/      # EditorCanvas with image processing
│   │   │   ├── presets/      # Preset library
│   │   │   ├── ai/          # AI tools panel
│   │   │   └── ui/          # Reusable glass UI components
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # Processing pipeline, presets, API client
│   └── ...
├── backend/
│   ├── main.py              # FastAPI app
│   ├── routers/             # API route handlers
│   ├── services/            # Image processing, AI services
│   └── models/              # Pydantic schemas
└── README.md
```

## 📝 License

MIT
