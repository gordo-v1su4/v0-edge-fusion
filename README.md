# EDGE_FUSION

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/gordo-v1su4s-projects/v0-edge-fusion)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/1OK3gpVLlDj)

## Overview

**EDGE_FUSION** is an AI-powered video editing platform designed for automated video clip matching and seamless transition generation. The application analyzes sports and action video clips to identify compatible pairs based on motion, composition, and color palette, then generates smooth AI-powered transitions between them for professional video montages.

### Key Features

- **Intelligent Video Upload & Analysis** - Bulk upload video clips with automated AI analysis of movement patterns, environment, color palette, and sport type
- **Smart Clip Matching** - ML-powered algorithm matches clips based on motion compatibility, composition similarity, and color harmony
- **Customizable Match Weights** - Fine-tune matching algorithm with adjustable weights for motion, composition, and color palette
- **AI Transition Generation** - Generate smooth, context-aware transitions between matched clips with product integration support
- **Timeline Editor** - Assemble matched clips with transitions into a final video sequence
- **Product Media Integration** - Upload and feature product images/videos in generated transitions for branded content

## Architecture

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19.2
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Type Safety**: TypeScript
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics

### Project Structure

\`\`\`
edge-fusion/
├── app/
│   ├── page.tsx              # Main application shell with view routing
│   ├── layout.tsx            # Root layout with fonts and metadata
│   └── globals.css           # Global styles and design tokens
│
├── components/
│   ├── upload-view.tsx       # Video upload interface with drag & drop
│   ├── analysis-view.tsx     # Real-time analysis progress visualization
│   ├── matching-view.tsx     # Clip matching grid with filters and validation
│   ├── transition-view.tsx   # AI transition generation with product integration
│   ├── timeline-view.tsx     # Timeline editor for final video assembly
│   ├── sidebar.tsx           # Navigation sidebar
│   ├── header.tsx            # Top header with view title and actions
│   └── ui/                   # shadcn/ui component library
│
├── lib/
│   ├── store.ts              # Zustand state management
│   └── utils.ts              # Utility functions (cn helper)
│
├── hooks/
│   ├── use-mobile.tsx        # Mobile detection hook
│   └── use-toast.ts          # Toast notification hook
│
└── public/                   # Static assets and sample clips
\`\`\`

## Application Flow

### 1. Upload View
**Purpose**: Bulk video upload with drag & drop support

**Features**:
- Multi-file video upload with preview thumbnails
- Automatic metadata extraction (duration, dimensions)
- Upload progress tracking
- Clip management (view details, delete)

**State Updates**:
- Adds clips to `clips[]` array in global state
- Sets initial clip status to "pending"

---

### 2. Analysis View
**Purpose**: AI-powered video analysis with real-time progress

**Features**:
- Parallel processing of uploaded clips
- Real-time progress visualization with step breakdown
- Detailed analysis metrics:
  - Environment detection (outdoor, indoor, studio)
  - Sport type classification (tennis, skateboarding, surfing, etc.)
  - Time of day analysis (day, sunset, night)
  - Movement patterns (fast, moderate, slow)
  - Color palette extraction
- Expandable detailed progress view

**Analysis Pipeline**:
1. Frame extraction
2. Motion vector analysis
3. Composition analysis
4. Color extraction
5. Embedding generation

**State Updates**:
- Updates `clips[].status` from "analyzing" to "complete"
- Populates `clips[].metadata` with analysis results
- Stores `clips[].embeddings` for similarity matching

---

### 3. Matching View
**Purpose**: Smart clip pairing based on similarity metrics

**Features**:
- Grid view of matched clip pairs
- Match quality scoring (excellent >70%, good 40-70%, fair <40%)
- Adjustable matching weights:
  - Motion Compatibility (50% default)
  - Composition Similarity (50% default)
  - Color Palette Harmony (50% default)
- Advanced filters:
  - Environment (outdoor, indoor, studio)
  - Sport Type (tennis, skateboarding, climbing, surfing, etc.)
  - Time of Day (day, sunset, night)
- Match validation mode
- Selected clips preview
- Top matches ranking sidebar

**Matching Algorithm**:
\`\`\`
matchScore = (motionScore * motionWeight + 
              compositionScore * compositionWeight + 
              colorScore * colorWeight) / totalWeight
\`\`\`

**State Updates**:
- Generates `matches[]` array with ClipMatch objects
- Sets `selectedClipA` and `selectedClipB` for transition generation
- Tracks `matches[].validated` status

---

### 4. Transition View (Generation Page)
**Purpose**: AI-powered transition generation with product integration

**Features**:
- Side-by-side clip preview with keyframes
- Product media pool:
  - Upload product images/videos
  - Select featured product for transition
  - Thumbnail grid with delete controls
- Transition style selection:
  - Morph (default)
  - Flow
  - Fusion
  - Blend
- Transition duration control (0.5s - 5.0s)
- Transition speed adjustment (0.5x - 2.0x)
- Keyframe preview with timestamp scrubbing
- Generate transition button
- Preview generated transition

**Generation Process**:
1. Analyzes end keyframe of Clip A
2. Analyzes start keyframe of Clip B
3. Integrates selected product media
4. Generates intermediate frames using AI
5. Applies selected transition style
6. Returns video URL

**State Updates**:
- Stores `generatedTransition` URL
- Links `selectedProduct` with transition
- Enables "Add to Timeline" action

---

### 5. Timeline View
**Purpose**: Video sequence assembly and export

**Features**:
- Drag-and-drop timeline editor
- Clip duration display
- Transition preview between clips
- Playback controls (play/pause)
- Timeline scrubbing
- Export final video

**Timeline Structure**:
\`\`\`
[Clip 1] → [Transition A] → [Clip 2] → [Transition B] → [Clip 3]
\`\`\`

**State Updates**:
- Manages `timelineClips[]` array
- Each entry: `{ clip: VideoClip, transition?: string }`
- Supports reordering with drag & drop

---

## State Management

### Zustand Store (`lib/store.ts`)

**Core State Types**:

\`\`\`typescript
interface VideoClip {
  id: string
  name: string
  duration: number
  thumbnail: string
  status: "pending" | "analyzing" | "complete" | "error"
  progress: number
  metadata?: {
    environment: string
    sportType: string
    timeOfDay: string
    movement: string
    colorPalette: string[]
  }
  embeddings?: number[]
}

interface ClipMatch {
  id: string
  clipA: VideoClip
  clipB: VideoClip
  score: number
  quality: "excellent" | "good" | "fair"
  validated?: boolean
}

interface ProductMedia {
  id: string
  name: string
  url: string
  type: "image" | "video"
  thumbnail?: string
}
\`\`\`

**State Management Actions**:

- **Navigation**: `setCurrentView()`
- **Clips**: `addClips()`, `updateClip()`, `removeClip()`
- **Matching**: `setMatches()`, `validateMatch()`, `setSelectedClips()`
- **Weights & Filters**: `setWeights()`, `setFilters()`
- **Analysis**: `setAnalysisSteps()`, `updateAnalysisStep()`
- **Transitions**: `setGeneratedTransition()`
- **Timeline**: `addToTimeline()`, `removeFromTimeline()`, `reorderTimeline()`
- **Products**: `addProductMedia()`, `removeProductMedia()`, `setSelectedProduct()`

---

## Design System

### Color Palette

**Theme**: Dark mode optimized for video editing
- **Background**: `oklch(0.11 0.005 285)` - Deep blue-gray
- **Primary**: `oklch(0.85 0.15 85)` - Bright yellow accent
- **Accent**: `oklch(0.65 0.18 250)` - Electric blue
- **Success**: `oklch(0.7 0.2 145)` - Green
- **Destructive**: `oklch(0.55 0.2 25)` - Red

### Typography

- **Sans Serif**: Geist (headings and body)
- **Monospace**: Geist Mono (code and technical data)

### Components

Built with shadcn/ui component library including:
- Button, Card, Badge, Progress, Slider
- Dropdown Menu, Dialog, Sheet
- Tabs, Select, Checkbox
- Custom video player controls

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/gordo-v1su4/v0-edge-fusion.git
cd v0-edge-fusion

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

---

## Deployment

This project is automatically deployed via Vercel and stays in sync with changes from v0.app.

**Live Deployment**: [https://vercel.com/gordo-v1su4s-projects/v0-edge-fusion](https://vercel.com/gordo-v1su4s-projects/v0-edge-fusion)

**Continue Building**: [https://v0.app/chat/1OK3gpVLlDj](https://v0.app/chat/1OK3gpVLlDj)

---

## Future Enhancements

- Real AI model integration for video analysis and generation
- Cloud storage integration for video processing
- Collaborative editing features
- Custom transition templates
- Advanced color grading
- Audio synchronization
- Multi-track timeline support
- Real-time preview rendering

---

## License

Built with [v0.app](https://v0.app) by Vercel

## Support

For issues or questions, visit the [v0.app documentation](https://v0.dev/docs) or open an issue in this repository.
