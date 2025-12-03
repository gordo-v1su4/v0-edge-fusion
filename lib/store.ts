import { create } from "zustand"

export interface VideoClip {
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

export interface ClipMatch {
  id: string
  clipA: VideoClip
  clipB: VideoClip
  score: number
  quality: "excellent" | "good" | "fair"
}

export interface AnalysisStep {
  id: string
  name: string
  status: "pending" | "running" | "complete" | "error"
  duration?: number
  startTime?: number
}

export interface ProductMedia {
  id: string
  name: string
  url: string
  type: "image" | "video"
  thumbnail?: string
}

interface AppState {
  currentView: "upload" | "analysis" | "matching" | "transition" | "timeline"
  setCurrentView: (view: AppState["currentView"]) => void

  clips: VideoClip[]
  addClips: (clips: VideoClip[]) => void
  updateClip: (id: string, updates: Partial<VideoClip>) => void
  removeClip: (id: string) => void

  matches: ClipMatch[]
  setMatches: (matches: ClipMatch[]) => void

  selectedClipA: VideoClip | null
  selectedClipB: VideoClip | null
  setSelectedClips: (a: VideoClip | null, b: VideoClip | null) => void

  weights: {
    motion: number
    composition: number
    color: number
  }
  setWeights: (weights: Partial<AppState["weights"]>) => void

  filters: {
    environment: string[]
    sportType: string[]
    timeOfDay: string[]
  }
  setFilters: (filters: Partial<AppState["filters"]>) => void

  analysisSteps: AnalysisStep[]
  setAnalysisSteps: (steps: AnalysisStep[]) => void
  updateAnalysisStep: (id: string, updates: Partial<AnalysisStep>) => void

  showDetailedProgress: boolean
  setShowDetailedProgress: (show: boolean) => void

  generatedTransition: string | null
  setGeneratedTransition: (url: string | null) => void

  timelineClips: { clip: VideoClip; transition?: string }[]
  addToTimeline: (clip: VideoClip, transition?: string) => void
  removeFromTimeline: (index: number) => void
  reorderTimeline: (from: number, to: number) => void

  productMedia: ProductMedia[]
  selectedProduct: ProductMedia | null
  addProductMedia: (media: ProductMedia) => void
  removeProductMedia: (id: string) => void
  setSelectedProduct: (product: ProductMedia | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "upload",
  setCurrentView: (view) => set({ currentView: view }),

  clips: [],
  addClips: (clips) => set((state) => ({ clips: [...state.clips, ...clips] })),
  updateClip: (id, updates) =>
    set((state) => ({
      clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeClip: (id) =>
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== id),
    })),

  matches: [],
  setMatches: (matches) => set({ matches }),

  selectedClipA: null,
  selectedClipB: null,
  setSelectedClips: (a, b) => set({ selectedClipA: a, selectedClipB: b }),

  weights: {
    motion: 50,
    composition: 50,
    color: 50,
  },
  setWeights: (weights) =>
    set((state) => ({
      weights: { ...state.weights, ...weights },
    })),

  filters: {
    environment: [],
    sportType: [],
    timeOfDay: [],
  },
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  analysisSteps: [],
  setAnalysisSteps: (steps) => set({ analysisSteps: steps }),
  updateAnalysisStep: (id, updates) =>
    set((state) => ({
      analysisSteps: state.analysisSteps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  showDetailedProgress: true,
  setShowDetailedProgress: (show) => set({ showDetailedProgress: show }),

  generatedTransition: null,
  setGeneratedTransition: (url) => set({ generatedTransition: url }),

  timelineClips: [],
  addToTimeline: (clip, transition) =>
    set((state) => ({
      timelineClips: [...state.timelineClips, { clip, transition }],
    })),
  removeFromTimeline: (index) =>
    set((state) => ({
      timelineClips: state.timelineClips.filter((_, i) => i !== index),
    })),
  reorderTimeline: (from, to) =>
    set((state) => {
      const items = [...state.timelineClips]
      const [removed] = items.splice(from, 1)
      items.splice(to, 0, removed)
      return { timelineClips: items }
    }),

  productMedia: [],
  selectedProduct: null,
  addProductMedia: (media) =>
    set((state) => ({
      productMedia: [...state.productMedia, media],
    })),
  removeProductMedia: (id) =>
    set((state) => ({
      productMedia: state.productMedia.filter((m) => m.id !== id),
      selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
    })),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}))
