"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { motion, Reorder } from "framer-motion"
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  Trash2,
  GripVertical,
  Plus,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export function TimelineView() {
  const { timelineClips, removeFromTimeline, reorderTimeline, clips, setCurrentView } = useAppStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)

  const totalDuration = timelineClips.reduce((acc, item) => acc + item.clip.duration + (item.transition ? 8 : 0), 0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleExport = () => {
    alert("Export functionality would be implemented here. Your video would be compiled and downloaded.")
  }

  if (timelineClips.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Timeline Empty</h2>
          <p className="text-muted-foreground mb-6">
            Add clips and transitions from the Transition view to start building your video.
          </p>
          <Button onClick={() => setCurrentView("matching")}>Go to Matching</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Video Preview */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black rounded-xl overflow-hidden aspect-video relative"
          >
            {/* Video Preview Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={timelineClips[0]?.clip.thumbnail || "/placeholder.svg?height=720&width=1280&query=video preview"}
                alt="Video preview"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
              </button>
            </div>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {/* Progress Bar */}
              <div className="mb-3">
                <Slider
                  value={[currentTime]}
                  onValueChange={([v]) => setCurrentTime(v)}
                  max={totalDuration}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 10))}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm ml-2">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([v]) => {
                        setVolume(v)
                        if (v > 0) setIsMuted(false)
                      }}
                      max={100}
                      className="w-20"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-border bg-card">
        {/* Timeline Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">Timeline</h3>
            <span className="text-sm text-muted-foreground">
              {timelineClips.length} clips • {formatTime(totalDuration)} total
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentView("matching")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Clips
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Timeline Track */}
        <div className="p-4 overflow-x-auto">
          <div className="min-w-max">
            {/* Time markers */}
            <div className="flex items-center gap-4 mb-2 pl-2">
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }).map((_, i) => (
                <div key={i} className="flex items-center" style={{ width: "100px" }}>
                  <span className="text-xs text-muted-foreground">{formatTime(i * 10)}</span>
                </div>
              ))}
            </div>

            {/* Clips Track */}
            <Reorder.Group
              axis="x"
              values={timelineClips}
              onReorder={(newOrder) => {
                const fromIndex = timelineClips.findIndex((item) => !newOrder.includes(item))
                const toIndex = newOrder.findIndex((item) => !timelineClips.includes(item))
                if (fromIndex !== -1 && toIndex !== -1) {
                  reorderTimeline(fromIndex, toIndex)
                }
              }}
              className="flex gap-1 p-2 bg-muted/30 rounded-lg min-h-[100px]"
            >
              {timelineClips.map((item, index) => (
                <Reorder.Item key={`${item.clip.id}-${index}`} value={item} className="flex items-stretch">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-stretch"
                  >
                    {/* Clip */}
                    <div
                      className="group relative rounded-lg overflow-hidden border border-border bg-card cursor-grab active:cursor-grabbing"
                      style={{ width: `${Math.max(80, item.clip.duration * 3)}px` }}
                    >
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-white/70" />
                      </div>
                      <img
                        src={item.clip.thumbnail || "/placeholder.svg"}
                        alt={item.clip.name}
                        className="w-full h-16 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[10px] text-white truncate">{item.clip.name}</p>
                        <p className="text-[9px] text-white/70 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(item.clip.duration)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromTimeline(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Transition */}
                    {item.transition && (
                      <div className="w-12 h-16 mx-1 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-5 h-5 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-0.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">8s</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Audio Track (placeholder) */}
            <div className="mt-2 p-2 bg-muted/20 rounded-lg min-h-[40px] flex items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Volume2 className="w-4 h-4" />
                <span className="text-xs">Audio Track</span>
              </div>
              <div className="flex-1 mx-4 h-6 bg-muted/30 rounded flex items-center px-2">
                {/* Waveform placeholder */}
                <div className="flex items-center gap-0.5 flex-1">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-accent/50 rounded-full"
                      style={{ height: `${Math.random() * 16 + 4}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
