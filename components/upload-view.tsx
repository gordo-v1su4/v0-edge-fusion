"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { useAppStore, type VideoClip } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Film, X, Play, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function UploadView() {
  const [isDragging, setIsDragging] = useState(false)
  const { clips, addClips, removeClip, setCurrentView } = useAppStore()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("video/"))

      if (files.length > 0) {
        const newClips: VideoClip[] = files.map((file, index) => ({
          id: `clip-${Date.now()}-${index}`,
          name: file.name,
          duration: Math.floor(Math.random() * 120) + 10,
          thumbnail: `/placeholder.svg?height=180&width=320&query=video frame ${index + 1}`,
          status: "pending",
          progress: 0,
        }))
        addClips(newClips)
      }
    },
    [addClips],
  )

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = "video/*"
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        const newClips: VideoClip[] = files.map((file, index) => ({
          id: `clip-${Date.now()}-${index}`,
          name: file.name,
          duration: Math.floor(Math.random() * 120) + 10,
          thumbnail: `/placeholder.svg?height=180&width=320&query=video scene ${index + 1}`,
          status: "pending",
          progress: 0,
        }))
        addClips(newClips)
      }
    }
    input.click()
  }, [addClips])

  const addDemoClips = () => {
    const demoClips: VideoClip[] = [
      {
        id: "demo-1",
        name: "tennis_match_01.mp4",
        duration: 45,
        thumbnail: "/tennis-player-serving.jpg",
        status: "pending",
        progress: 0,
      },
      {
        id: "demo-2",
        name: "bmx_jump_02.mp4",
        duration: 28,
        thumbnail: "/bmx-bike-jump.jpg",
        status: "pending",
        progress: 0,
      },
      {
        id: "demo-3",
        name: "rock_climbing_03.mp4",
        duration: 67,
        thumbnail: "/rock-climbing-wall.jpg",
        status: "pending",
        progress: 0,
      },
      {
        id: "demo-4",
        name: "surfing_wave_04.mp4",
        duration: 32,
        thumbnail: "/surfer-riding-wave.jpg",
        status: "pending",
        progress: 0,
      },
      {
        id: "demo-5",
        name: "skateboard_trick_05.mp4",
        duration: 18,
        thumbnail: "/skateboard-trick.png",
        status: "pending",
        progress: 0,
      },
      {
        id: "demo-6",
        name: "parkour_run_06.mp4",
        duration: 54,
        thumbnail: "/parkour-athlete-jumping.jpg",
        status: "pending",
        progress: 0,
      },
    ]
    addClips(demoClips)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative border-2 rounded-xl p-6 md:p-12 transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-gradient-to-br from-surfaceHighlight/50 to-surface/30 hover:from-surfaceHighlight/70 hover:to-surface/50 hover:border-muted-foreground/50",
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{
                scale: isDragging ? 1.1 : 1,
                y: isDragging ? -10 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 md:mb-4 transition-colors",
                isDragging ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <Upload className="w-6 h-6 md:w-8 md:h-8" />
            </motion.div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              {isDragging ? "Drop videos here" : "Drag & drop video files"}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">or click to browse your files</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={handleFileSelect} className="w-full sm:w-auto">
                Browse Files
              </Button>
              <Button
                variant="outline"
                onClick={addDemoClips}
                className="hover:bg-primary/20 hover:text-primary hover:border-primary bg-transparent w-full sm:w-auto"
              >
                Load Demo Clips
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Supports MP4, MOV, AVI, WebM</p>
          </div>
        </motion.div>

        {/* Uploaded Clips Grid */}
        <AnimatePresence mode="popLayout">
          {clips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base md:text-lg font-semibold">Imported Clips ({clips.length})</h3>
                <Button
                  onClick={() => setCurrentView("analysis")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                >
                  Start Analysis
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {clips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-muted-foreground/50 transition-colors"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={clip.thumbnail || "/placeholder.svg"}
                        alt={clip.name}
                        className="w-full h-full object-cover"
                      />

                      {clip.status !== "pending" && (
                        <div className="absolute top-2 left-2">
                          {clip.status === "complete" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30 backdrop-blur-sm">
                              <CheckCircle2 className="w-3 h-3" />
                              Analyzed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-info/20 text-info border border-info/30 backdrop-blur-sm">
                              <Clock className="w-3 h-3" />
                              Analyzing
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => removeClip(clip.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-gray-200 ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/25 text-gray-300 text-xs font-medium">
                        {formatDuration(clip.duration)}
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/25">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-gray-300" />
                        <p className="text-sm font-medium truncate flex-1 text-gray-300">{clip.name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
