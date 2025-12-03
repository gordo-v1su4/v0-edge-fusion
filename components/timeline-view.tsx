"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import type React from "react"

import { useAppStore } from "@/lib/store"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Sparkles,
  Plus,
  Volume2,
  Maximize2,
  RotateCcw,
  Film,
  ChevronsLeftRight,
} from "lucide-react"

interface Track {
  id: string
  name: string
  type: "adjustment" | "video" | "ai" | "audio" | "soundfx"
  locked: boolean
  visible: boolean
  color: string
  icon: React.ElementType
}

interface TimelineClip {
  id: string
  name: string
  start: number
  duration: number
  track: string
  thumbnail?: string
  type: "video" | "ai" | "adjustment" | "audio" | "soundfx"
}

function generateWaveformPath(width: number, height: number, seed: string): string {
  const points: string[] = []
  const numPoints = Math.max(20, Math.floor(width / 4))
  const midY = height / 2

  // Generate a deterministic random based on seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  const seededRandom = (i: number) => {
    const x = Math.sin(hash + i * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  // Top line (going right)
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width
    const amp = seededRandom(i) * 0.7 + 0.2
    const y = midY - amp * (height * 0.4)
    points.push(`${x},${y}`)
  }

  // Bottom line (going left)
  for (let i = numPoints; i >= 0; i--) {
    const x = (i / numPoints) * width
    const amp = seededRandom(i + 100) * 0.7 + 0.2
    const y = midY + amp * (height * 0.4)
    points.push(`${x},${y}`)
  }

  return points.join(" ")
}

function generateEnhancedWaveform(width: number, height: number, seed: string): string {
  const points: string[] = []
  const numPoints = Math.max(50, Math.floor(width / 2))
  const midY = height / 2

  // Generate a deterministic random based on seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  const seededRandom = (i: number) => {
    const x = Math.sin(hash + i * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  // Top line (going right) - creates upper amplitude
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width
    const baseAmp = seededRandom(i) * 0.8 + 0.15
    const variation = Math.sin(i * 0.1) * 0.2
    const amp = Math.min(1, Math.max(0.1, baseAmp + variation))
    const y = midY - amp * (height * 0.45)
    points.push(`${x},${y}`)
  }

  // Bottom line (going left) - creates lower amplitude
  for (let i = numPoints; i >= 0; i--) {
    const x = (i / numPoints) * width
    const baseAmp = seededRandom(i + 100) * 0.8 + 0.15
    const variation = Math.sin(i * 0.1) * 0.2
    const amp = Math.min(1, Math.max(0.1, baseAmp + variation))
    const y = midY + amp * (height * 0.45)
    points.push(`${x},${y}`)
  }

  return points.join(" ")
}

function TimelineView() {
  const { timelineClips, project } = useAppStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [zoom, setZoom] = useState(80) // Increased initial zoom to fit clips within timeline
  const [dragState, setDragState] = useState<{
    clipId: string
    type: "move" | "resize-left" | "resize-right"
    trackId: string
    startX: number
    initialStart: number
    initialDuration: number
  } | null>(null)
  const [localClips, setLocalClips] = useState<TimelineClip[]>([])
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [trackStates, setTrackStates] = useState<Record<string, { muted: boolean; solo: boolean; locked: boolean }>>({
    video1: { muted: false, solo: false, locked: false },
    audio1: { muted: false, solo: false, locked: false },
  })

  const totalDuration = Math.max(60, Math.max(...localClips.map((c) => c.start + c.duration)))

  const tracks: Track[] = [
    {
      id: "video1",
      name: "VIDEO TRACK 2", // Uppercase styling
      type: "video",
      locked: false,
      visible: true,
      color: "#fbbf24",
      icon: Film,
    },
    {
      id: "audio1",
      name: "AUDIO TRACK", // Changed from "Audio Track 1" to "AUDIO TRACK"
      type: "audio",
      locked: false,
      visible: true,
      color: "#10b981",
      icon: Volume2,
    },
  ]

  const timelineWidth = totalDuration * zoom // Declare timelineWidth variable

  useEffect(() => {
    const TOTAL_DURATION = 60 // 1 minute total
    const videoClips: TimelineClip[] = []
    let currentPosition = 0

    const actualTotalDuration = timelineClips.reduce((acc, tc) => acc + (tc.clip.duration || 5), 0)
    const scaleFactor = actualTotalDuration > 0 ? Math.min(1, TOTAL_DURATION / actualTotalDuration) : 1

    // First clip, transition 1, conjoining clip 1, AI generated, conjoining clip 2, transition 2, last clip
    if (timelineClips.length >= 2) {
      const clips = timelineClips.slice(0, 2)
      const clipDurations = clips.map((c) => (c.clip.duration || 5) * scaleFactor)
      const transitionDuration = 2
      const conjoiningDuration = 1.5

      // Video Track 2: 5 clips symmetrical
      // Outer clips (main video)
      videoClips.push({
        id: clips[0].clip.id + "-start",
        name: clips[0].clip.name,
        start: currentPosition,
        duration: clipDurations[0],
        track: "video1",
        thumbnail: clips[0].clip.thumbnail,
        type: "video",
      })
      currentPosition += clipDurations[0]

      // Conjoining clip 1
      videoClips.push({
        id: clips[0].clip.id + "-conjoining-1",
        name: "Conjoining 1",
        start: currentPosition,
        duration: conjoiningDuration,
        track: "video1",
        thumbnail: clips[0].clip.thumbnail,
        type: "video",
      })
      currentPosition += conjoiningDuration

      // Generated AI (middle)
      const aiDuration = 3
      videoClips.push({
        id: "ai-generated-middle",
        name: "AI Generated",
        start: currentPosition,
        duration: aiDuration,
        track: "video1",
        type: "ai",
      })
      currentPosition += aiDuration

      // Conjoining clip 2
      videoClips.push({
        id: clips[1].clip.id + "-conjoining-2",
        name: "Conjoining 2",
        start: currentPosition,
        duration: conjoiningDuration,
        track: "video1",
        thumbnail: clips[1].clip.thumbnail,
        type: "video",
      })
      currentPosition += conjoiningDuration

      // Last clip
      videoClips.push({
        id: clips[1].clip.id + "-end",
        name: clips[1].clip.name,
        start: currentPosition,
        duration: clipDurations[1],
        track: "video1",
        thumbnail: clips[1].clip.thumbnail,
        type: "video",
      })
      currentPosition += clipDurations[1]
    }

    const totalVideoDuration = videoClips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0) || 30

    const audioClip: TimelineClip = {
      id: "audio-main",
      name: "audio_track_01.wav",
      start: 0,
      duration: totalVideoDuration,
      track: "audio1",
      type: "audio",
    }

    setLocalClips([...videoClips, audioClip])
  }, [timelineClips])

  // Playback loop
  useEffect(() => {
    let animationFrame: number
    if (isPlaying) {
      const updateTime = () => {
        setCurrentTime((prev) => {
          const next = prev + 0.016667
          if (next >= totalDuration) {
            setIsPlaying(false)
            return 0
          }
          return next
        })
        animationFrame = requestAnimationFrame(updateTime)
      }
      animationFrame = requestAnimationFrame(updateTime)
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [isPlaying, totalDuration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${frames.toString().padStart(2, "0")}`
  }

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = Math.max(0, Math.min(x / zoom, totalDuration))
    setCurrentTime(time)
  }

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingPlayhead(true)
    setIsPlaying(false)
  }

  const startDrag = (
    e: React.MouseEvent,
    trackId: string,
    clip: TimelineClip,
    type: "move" | "resize-left" | "resize-right",
  ) => {
    e.stopPropagation()
    setDragState({
      clipId: clip.id,
      type,
      trackId,
      startX: e.clientX,
      initialStart: clip.start,
      initialDuration: clip.duration,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingPlayhead && scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect()
        const scrollLeft = scrollContainerRef.current.scrollLeft
        const x = e.clientX - rect.left + scrollLeft
        const time = Math.max(0, Math.min(x / zoom, totalDuration))
        setCurrentTime(time)
        return
      }

      if (!dragState) return

      const deltaX = e.clientX - dragState.startX
      const deltaTime = deltaX / zoom
      const SNAP_THRESHOLD = 1.0 // Increased snap threshold for better detection

      const snapToGrid = (time: number) => Math.round(time / 0.5) * 0.5

      setLocalClips((prev) =>
        prev.map((c) => {
          if (c.id !== dragState.clipId) return c

          if (dragState.type === "resize-left") {
            const newStart = snapToGrid(Math.max(0, dragState.initialStart + deltaTime))
            const newDuration = Math.max(1, dragState.initialDuration - (newStart - dragState.initialStart))
            return { ...c, start: newStart, duration: newDuration }
          } else if (dragState.type === "resize-right") {
            const newDuration = snapToGrid(Math.max(1, dragState.initialDuration + deltaTime))
            return { ...c, duration: newDuration }
          } else {
            let newStart = snapToGrid(Math.max(0, dragState.initialStart + deltaTime))
            const clipEnd = newStart + c.duration

            // Get all other clips on the same track, sorted by start time
            const sameTrackClips = prev
              .filter((other) => other.track === c.track && other.id !== c.id)
              .sort((a, b) => a.start - b.start)

            // Check for overlaps and snap to edges
            for (const other of sameTrackClips) {
              const otherEnd = other.start + other.duration

              // Check if we're overlapping with this clip
              const wouldOverlap = newStart < otherEnd && clipEnd > other.start

              if (wouldOverlap) {
                // Determine which edge to snap to based on drag direction
                const movingRight = newStart > dragState.initialStart

                if (movingRight) {
                  // Snap to start of next clip (right edge)
                  newStart = otherEnd
                } else {
                  // Snap to end of previous clip (left edge)
                  newStart = Math.max(0, other.start - c.duration)
                }
              } else {
                // Snap to nearby edges if within threshold
                if (Math.abs(newStart - otherEnd) < SNAP_THRESHOLD) {
                  // Snap to end of previous clip
                  newStart = otherEnd
                } else if (Math.abs(clipEnd - other.start) < SNAP_THRESHOLD) {
                  // Snap to start of next clip
                  newStart = other.start - c.duration
                }
              }
            }

            return { ...c, start: Math.max(0, newStart) }
          }
        }),
      )
    },
    [dragState, isDraggingPlayhead, zoom, totalDuration],
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setIsDraggingPlayhead(false)
  }, [])

  useEffect(() => {
    if (dragState || isDraggingPlayhead) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragState, isDraggingPlayhead, handleMouseMove, handleMouseUp])

  const fitToTimeline = useCallback(() => {
    if (!scrollContainerRef.current) return
    const containerWidth = scrollContainerRef.current.clientWidth - 50 // Account for padding
    const contentDuration = Math.max(...localClips.map((c) => c.start + c.duration), 30)
    const newZoom = Math.max(20, Math.min(200, containerWidth / contentDuration))
    setZoom(newZoom)
  }, [localClips])

  const toggleMute = (trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...prev[trackId], muted: !prev[trackId].muted },
    }))
  }

  const toggleSolo = (trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...prev[trackId], solo: !prev[trackId].solo },
    }))
  }

  const toggleLock = (trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...prev[trackId], locked: !prev[trackId].locked },
    }))
  }

  const progressPercent = (currentTime / totalDuration) * 100

  useEffect(() => {
    if (localClips.length > 0 && scrollContainerRef.current) {
      // Small delay to ensure container is rendered with correct dimensions
      const timer = setTimeout(() => {
        fitToTimeline()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [localClips, fitToTimeline])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="flex items-center justify-center p-4 bg-[#0a0a0a]">
        <div className="w-full max-w-3xl">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-2xl group">
            <img src="/kayaking-on-mountain-lake.jpg" alt="Video preview" className="w-full h-full object-cover" />

            {/* Play button overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
              </div>
            </button>

            {/* Bottom controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress bar */}
              <div
                className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  setCurrentTime(percent * totalDuration)
                }}
              >
                <div className="h-full bg-primary rounded-full relative" style={{ width: `${progressPercent}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    onClick={() => setCurrentTime(0)}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    onClick={() => setCurrentTime(totalDuration)}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-mono ml-2">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 border-t border-border/50 flex flex-col min-h-0">
        {/* Timeline Header with controls */}
        <div className="h-12 border-b border-border flex items-center px-4 bg-surface">
          {/* Left section: Zoom Controls */}
          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <div className="flex bg-surfaceHighlight rounded-lg p-0.5 border border-border">
              <button
                className="p-1.5 text-textSecondary hover:text-white rounded hover:bg-white/5 transition-colors"
                onClick={() => setZoom(Math.max(20, zoom - 10))}
              >
                <ZoomOut size={14} />
              </button>
              <div className="w-px bg-border my-1" />
              <button
                className="p-1.5 text-textSecondary hover:text-white rounded hover:bg-white/5 transition-colors"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-px bg-border my-1" />
              <button
                className="p-1.5 text-textSecondary hover:text-white rounded hover:bg-white/5 transition-colors"
                onClick={fitToTimeline}
                title="Fit to Timeline"
              >
                <ChevronsLeftRight size={14} />
              </button>
            </div>
          </div>

          <div className="ml-16 flex items-center">
            <span className="text-sm font-mono font-medium text-primary tracking-wider tabular-nums mx-[23px]">
              {formatTimecode(currentTime)}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button
                className="p-1.5 text-textSecondary hover:text-white rounded hover:bg-white/10 transition-colors"
                onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
              >
                <SkipBack size={16} />
              </button>
              <button
                className="p-2 text-white rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="p-1.5 text-textSecondary hover:text-white rounded hover:bg-white/10 transition-colors"
                onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))}
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-medium border border-purple-500/30 hover:bg-purple-500/20 transition-all">
              <Sparkles size={14} />
              AI Generate
            </button>
            <div className="h-5 w-px bg-border mx-1" />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceHighlight text-white text-xs font-medium border border-border hover:bg-white/10 transition-colors">
              <Plus size={14} /> Add Clips
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceHighlight text-white text-xs font-medium border border-border hover:bg-white/10 transition-colors">
              <Share2 size={14} /> Share
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(253,224,71,0.2)]">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-[#0c0c0c]">
          {/* Track Names - Sticky Left Column */}
          <div className="w-12 lg:w-48 shrink-0 border-r border-border bg-surface flex flex-col">
            {/* Ruler spacer */}
            <div className="h-8 border-b border-border bg-surface shrink-0" />

            {/* Track labels */}
            {tracks.map((track) => {
              const TrackIcon = track.icon
              const trackHeight = track.type === "video" ? "h-40" : "h-20"
              const state = trackStates[track.id]

              return (
                <div
                  key={track.id}
                  className={`${trackHeight} border-b border-border/50 flex flex-col justify-center px-3 relative group hover:bg-surfaceHighlight/30 transition-colors shrink-0`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center bg-white/5"
                        style={{ color: track.color }}
                      >
                        <TrackIcon size={14} />
                      </div>
                      <span
                        className="hidden lg:inline text-xs font-bold uppercase tracking-wide truncate"
                        style={{ color: track.color }}
                      >
                        {track.name}
                      </span>
                    </div>
                  </div>

                  <div className="hidden lg:flex gap-1.5 pl-8">
                    <button
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        state.muted
                          ? "bg-red-500/30 text-red-400 border border-red-500/50"
                          : "bg-white/5 hover:bg-white/10 text-gray-300"
                      }`}
                      onClick={() => toggleMute(track.id)}
                      title="Mute"
                    >
                      M
                    </button>
                    <button
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        state.solo
                          ? "bg-yellow-500/30 text-yellow-400 border border-yellow-500/50"
                          : "bg-white/5 hover:bg-white/10 text-gray-300"
                      }`}
                      onClick={() => toggleSolo(track.id)}
                      title="Solo"
                    >
                      S
                    </button>
                    <button
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        state.locked
                          ? "bg-gray-500/30 text-gray-400 border border-gray-500/50"
                          : "bg-white/5 hover:bg-white/10 text-gray-300"
                      }`}
                      onClick={() => toggleLock(track.id)}
                      title="Lock"
                    >
                      Lock
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scrollable Timeline Area */}
          <div className="flex-1 relative overflow-auto" ref={scrollContainerRef}>
            <div style={{ width: timelineWidth, minWidth: "100%" }} className="relative">
              {/* Ruler */}
              <div
                className="h-8 border-b border-border bg-surface sticky top-0 z-10 cursor-pointer relative"
                onClick={handleRulerClick}
              >
                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                  <div key={i} className="absolute top-0 h-full flex flex-col justify-end" style={{ left: i * zoom }}>
                    <div className="h-3 w-px bg-textSecondary/40" />
                    {i % 5 === 0 && (
                      <span className="absolute bottom-3 left-1 text-[9px] text-textSecondary font-mono tabular-nums">
                        {formatTimecode(i)}
                      </span>
                    )}
                    {/* Minor ticks */}
                    {i < totalDuration &&
                      Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="absolute bottom-0 h-1.5 w-px bg-textSecondary/20"
                          style={{ left: (zoom / 5) * (j + 1) }}
                        />
                      ))}
                  </div>
                ))}
              </div>

              {/* Tracks Area */}
              <div className="relative">
                <div
                  className="absolute top-0 bottom-0 z-30 cursor-ew-resize pointer-events-auto"
                  style={{ left: currentTime * zoom }}
                  onMouseDown={handlePlayheadMouseDown}
                >
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                    style={{ opacity: 0.65 }}
                  />
                  <div className="absolute -top-1 -translate-x-1/2 w-3 h-2.5 bg-primary rounded-b-sm" />
                </div>

                {tracks.map((track) => {
                  const trackClips = localClips.filter((c) => c.track === track.id)
                  const trackHeight = track.type === "video" ? "h-40" : "h-20"
                  const state = trackStates[track.id]

                  return (
                    <div
                      key={track.id}
                      className={`${trackHeight} border-b border-border/20 relative bg-background overflow-hidden shrink-0 ${
                        state.muted ? "opacity-50" : ""
                      }`}
                    >
                      {/* Grid lines */}
                      {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 w-px bg-white/[0.03] pointer-events-none"
                          style={{ left: i * zoom }}
                        />
                      ))}

                      {trackClips.map((clip) => {
                        const clipWidth = clip.duration * zoom
                        const clipLeft = clip.start * zoom

                        const waveformPath =
                          clip.type === "audio" || clip.type === "soundfx"
                            ? generateEnhancedWaveform(clipWidth, track.type === "video" ? 140 : 60, clip.id)
                            : ""

                        return (
                          <div
                            key={clip.id}
                            className={`absolute top-1.5 bottom-1.5 rounded-xl overflow-hidden cursor-pointer group hover:brightness-110 transition-all shadow-sm ${
                              state.locked ? "pointer-events-none opacity-70" : ""
                            }`}
                            style={{
                              left: clipLeft,
                              width: clipWidth,
                              backgroundColor: clip.type === "adjustment" ? `${track.color}20` : `${track.color}15`,
                              border: `1px solid ${track.color}50`,
                            }}
                            onMouseDown={(e) => !state.locked && startDrag(e, track.id, clip, "move")}
                          >
                            {/* Left resize handle */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-primary/40 transition-colors border-r border-primary/50"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                if (!state.locked) startDrag(e, track.id, clip, "resize-left")
                              }}
                            />

                            {/* Right resize handle */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-primary/40 transition-colors border-l border-primary/50"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                if (!state.locked) startDrag(e, track.id, clip, "resize-right")
                              }}
                            />

                            {clip.type === "video" && clip.thumbnail && (
                              <div className="flex w-full h-full bg-black/20 overflow-hidden">
                                {Array.from({ length: Math.ceil(clipWidth / 80) + 1 }).map((_, i) => (
                                  <img
                                    key={i}
                                    src={clip.thumbnail || "/placeholder.svg"}
                                    alt=""
                                    className="h-full object-cover opacity-70 pointer-events-none"
                                    style={{ width: 80, maxWidth: "none", flexShrink: 0 }}
                                  />
                                ))}
                                <div
                                  className="absolute top-1.5 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium border border-white/10 truncate max-w-[90%] pointer-events-none z-10"
                                  style={{ color: track.color }}
                                >
                                  {clip.name}
                                </div>
                              </div>
                            )}

                            {(clip.type === "audio" || clip.type === "soundfx") && (
                              <div className="w-full h-full relative flex items-center justify-center pointer-events-none overflow-hidden bg-black/30">
                                <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
                                  <polygon points={waveformPath} fill={track.color} opacity={0.8} />
                                </svg>
                                <div
                                  className="absolute top-1 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium border border-white/10 truncate max-w-[90%] z-10"
                                  style={{ color: track.color }}
                                >
                                  {clip.name}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineView
export { TimelineView }
