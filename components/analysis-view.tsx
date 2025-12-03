"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAppStore, type AnalysisStep } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp, Play, Pause, SkipForward, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useState } from "react"

const analysisStepTemplates: Omit<AnalysisStep, "status" | "duration" | "startTime">[] = [
  { id: "upload", name: "Processing Upload" },
  { id: "segment", name: "Scene Detection & Segmentation" },
  { id: "embedding", name: "Visual Embedding Extraction" },
  { id: "tagging", name: "Visual Recognition & Tagging" },
  { id: "movement", name: "Movement Pattern Detection" },
  { id: "composition", name: "Composition & Color Analysis" },
  { id: "storage", name: "Storing in Database" },
]

export function AnalysisView() {
  const {
    clips,
    updateClip,
    analysisSteps,
    setAnalysisSteps,
    updateAnalysisStep,
    showDetailedProgress,
    setShowDetailedProgress,
    setCurrentView,
  } = useAppStore()

  const [isRunning, setIsRunning] = useState(false)
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  const pendingClips = clips.filter((c) => c.status === "pending" || c.status === "analyzing")
  const completedClips = clips.filter((c) => c.status === "complete")

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setAnalysisSteps(analysisStepTemplates.map((s) => ({ ...s, status: "pending" as const })))
      setShowDetailedProgress(false)
    }
  }, [setAnalysisSteps, setShowDetailedProgress])

  const startAnalysis = useCallback(() => {
    setShowDetailedProgress(true)
    setIsRunning(true)
    let stepIndex = 0
    let clipIdx = currentClipIndex

    if (clips[clipIdx]) {
      updateClip(clips[clipIdx].id, { status: "analyzing" })
    }

    intervalRef.current = setInterval(() => {
      if (stepIndex < analysisStepTemplates.length) {
        if (stepIndex > 0) {
          updateAnalysisStep(analysisStepTemplates[stepIndex - 1].id, {
            status: "complete",
            duration: Math.random() * 2000 + 500,
          })
        }

        updateAnalysisStep(analysisStepTemplates[stepIndex].id, {
          status: "running",
          startTime: Date.now(),
        })

        stepIndex++

        const clipProgress = (stepIndex / analysisStepTemplates.length) * 100
        const overall = (clipIdx * 100 + clipProgress) / clips.length
        setOverallProgress(overall)

        if (clips[clipIdx]) {
          updateClip(clips[clipIdx].id, { progress: clipProgress })
        }
      } else {
        updateAnalysisStep(analysisStepTemplates[analysisStepTemplates.length - 1].id, {
          status: "complete",
          duration: Math.random() * 2000 + 500,
        })

        if (clips[clipIdx]) {
          updateClip(clips[clipIdx].id, {
            status: "complete",
            progress: 100,
            metadata: {
              environment: ["indoor", "outdoor", "studio"][Math.floor(Math.random() * 3)],
              sportType: ["tennis", "bmx", "climbing", "surfing", "skateboard", "parkour"][
                Math.floor(Math.random() * 6)
              ],
              timeOfDay: ["morning", "afternoon", "evening", "night"][Math.floor(Math.random() * 4)],
              movement: ["fast", "medium", "slow"][Math.floor(Math.random() * 3)],
              colorPalette: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"].slice(
                0,
                Math.floor(Math.random() * 3) + 2,
              ),
            },
          })
        }

        clipIdx++
        setCurrentClipIndex(clipIdx)

        if (clipIdx < clips.length) {
          stepIndex = 0
          setAnalysisSteps(analysisStepTemplates.map((s) => ({ ...s, status: "pending" as const })))
          if (clips[clipIdx]) {
            updateClip(clips[clipIdx].id, { status: "analyzing" })
          }
        } else {
          setIsRunning(false)
          setOverallProgress(100)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }
    }, 800)
  }, [clips, currentClipIndex, updateClip, updateAnalysisStep, setAnalysisSteps, setShowDetailedProgress])

  const pauseAnalysis = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const skipToMatching = useCallback(() => {
    pauseAnalysis()
    clips.forEach((clip) => {
      if (clip.status !== "complete") {
        updateClip(clip.id, {
          status: "complete",
          progress: 100,
          metadata: {
            environment: ["indoor", "outdoor", "studio"][Math.floor(Math.random() * 3)],
            sportType: ["tennis", "bmx", "climbing", "surfing", "skateboard", "parkour"][Math.floor(Math.random() * 6)],
            timeOfDay: ["morning", "afternoon", "evening", "night"][Math.floor(Math.random() * 4)],
            movement: ["fast", "medium", "slow"][Math.floor(Math.random() * 3)],
            colorPalette: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"].slice(
              0,
              Math.floor(Math.random() * 3) + 2,
            ),
          },
        })
      }
    })
    setCurrentView("matching")
  }, [clips, pauseAnalysis, updateClip, setCurrentView])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex-1 p-4 md:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Analysis Progress</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {completedClips.length} of {clips.length} clips analyzed
              </p>
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  onClick={startAnalysis}
                  disabled={pendingClips.length === 0 && completedClips.length === clips.length}
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  <Play className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {completedClips.length === clips.length ? "Complete" : "Start"}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={pauseAnalysis}
                  variant="outline"
                  className="flex-1 sm:flex-none bg-transparent"
                  size="sm"
                >
                  <Pause className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Pause</span>
                </Button>
              )}
              <Button
                onClick={skipToMatching}
                variant="outline"
                className="hover:bg-primary/20 hover:text-primary hover:border-primary bg-transparent flex-1 sm:flex-none"
                size="sm"
              >
                <SkipForward className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Skip to Matching</span>
              </Button>
            </div>
          </div>

          <Progress value={overallProgress} className="h-2" />

          <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mt-2">
            <span>{Math.round(overallProgress)}% complete</span>
            <span>Est. {Math.max(0, (clips.length - completedClips.length) * 6)} seconds remaining</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showDetailedProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <Film className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm md:text-base truncate">
                      {clips[currentClipIndex]?.name || "Processing..."}
                    </h4>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      Clip {Math.min(currentClipIndex + 1, clips.length)} of {clips.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailedProgress(false)}
                  className="text-muted-foreground shrink-0"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Hide</span>
                </Button>
              </div>

              <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {analysisSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: step.status === "complete" ? "100%" : step.status === "running" ? "60%" : "0%",
                        }}
                        transition={{
                          duration: step.status === "running" ? 0.8 : 0.5,
                          ease: "easeInOut",
                        }}
                        className={cn(
                          "h-full",
                          // Yellow to orange gradient progression based on step index
                          step.status === "complete" && index === 0 && "bg-yellow-500/20",
                          step.status === "complete" && index === 1 && "bg-yellow-500/25",
                          step.status === "complete" && index === 2 && "bg-amber-500/25",
                          step.status === "complete" && index === 3 && "bg-amber-500/30",
                          step.status === "complete" && index === 4 && "bg-orange-500/30",
                          step.status === "complete" && index === 5 && "bg-orange-500/35",
                          step.status === "complete" && index === 6 && "bg-orange-600/35",
                          step.status === "running" && "bg-yellow-500/25",
                        )}
                      />
                    </div>

                    <div
                      className={cn(
                        "relative flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-colors",
                      )}
                    >
                      {step.status === "pending" && (
                        <Circle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                      )}
                      {step.status === "running" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                        </motion.div>
                      )}
                      {step.status === "complete" && (
                        <CheckCircle2
                          className={cn(
                            "w-4 h-4 md:w-5 md:h-5 shrink-0",
                            // Gradient of check colors from yellow to orange
                            index === 0 && "text-yellow-500",
                            index === 1 && "text-yellow-500",
                            index === 2 && "text-amber-500",
                            index === 3 && "text-amber-500",
                            index === 4 && "text-orange-500",
                            index === 5 && "text-orange-500",
                            index === 6 && "text-orange-600",
                          )}
                        />
                      )}

                      <span
                        className={cn(
                          "flex-1 text-xs md:text-sm",
                          step.status === "pending" && "text-muted-foreground",
                          step.status === "running" && "text-foreground font-medium",
                          step.status === "complete" && "text-foreground",
                        )}
                      >
                        {step.name}
                      </span>

                      {step.status === "complete" && step.duration && (
                        <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">
                          {(step.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      {step.status === "running" && (
                        <span className="text-[10px] md:text-xs text-yellow-500 animate-pulse shrink-0">
                          Processing...
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showDetailedProgress && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedProgress(true)}
              className="text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Details
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {clips.map((clip, index) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "relative rounded-lg overflow-hidden border transition-all",
                clip.status === "complete" && "border-success/50",
                clip.status === "analyzing" && "border-info/50 ring-2 ring-info/20",
                clip.status === "pending" && "border-border opacity-60",
              )}
            >
              <div className="aspect-video relative">
                <img
                  src={clip.thumbnail || "/placeholder.svg"}
                  alt={clip.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                {clip.status === "analyzing" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-info border-t-transparent"
                    />
                  </div>
                )}

                {clip.status === "complete" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-success/10">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-success" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {clip.status !== "pending" && <Progress value={clip.progress} className="h-1" />}
                </div>
              </div>

              <div className="p-2 bg-card">
                <p className="text-[10px] md:text-xs font-medium truncate">{clip.name}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {completedClips.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
            <Button
              size="lg"
              onClick={() => setCurrentView("matching")}
              className="bg-primary text-primary-foreground w-full sm:w-auto"
            >
              Continue to Matching
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
