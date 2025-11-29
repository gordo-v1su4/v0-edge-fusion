"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useAppStore, type ClipMatch } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { Sliders, Filter, ThumbsUp, ThumbsDown, Sparkles, ArrowRight, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function MatchingView() {
  const {
    clips,
    matches,
    setMatches,
    weights,
    setWeights,
    filters,
    setFilters,
    selectedClipA,
    selectedClipB,
    setSelectedClips,
    validateMatch,
    setCurrentView,
  } = useAppStore()

  const [showFilters, setShowFilters] = useState(false)
  const [validationMode, setValidationMode] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const matchesInitializedRef = useRef(false)

  const analyzedClips = useMemo(() => clips.filter((c) => c.status === "complete"), [clips])

  const analyzedClipIdsRef = useRef<string>("")

  useEffect(() => {
    if (analyzedClips.length < 2) return

    const currentClipIds = analyzedClips.map((c) => c.id).join(",")
    const weightsKey = `${weights.motion}-${weights.composition}-${weights.color}`
    const currentKey = `${currentClipIds}-${weightsKey}`

    if (matchesInitializedRef.current && analyzedClipIdsRef.current === currentKey) {
      return
    }

    analyzedClipIdsRef.current = currentKey
    matchesInitializedRef.current = true

    const newMatches: ClipMatch[] = []
    for (let i = 0; i < analyzedClips.length; i++) {
      for (let j = i + 1; j < analyzedClips.length; j++) {
        const clipA = analyzedClips[i]
        const clipB = analyzedClips[j]

        const seed = (clipA.id + clipB.id).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const pseudoRandom = (offset: number) => ((seed + offset) % 100) / 100

        const motionScore = pseudoRandom(1) * weights.motion
        const compositionScore = pseudoRandom(2) * weights.composition
        const colorScore = pseudoRandom(3) * weights.color
        const totalScore = ((motionScore + compositionScore + colorScore) / 150) * 100

        newMatches.push({
          id: `match-${clipA.id}-${clipB.id}`,
          clipA,
          clipB,
          score: totalScore,
          quality: totalScore > 70 ? "excellent" : totalScore > 40 ? "good" : "fair",
        })
      }
    }

    newMatches.sort((a, b) => b.score - a.score)
    setMatches(newMatches.slice(0, 15))
  }, [analyzedClips, weights.motion, weights.composition, weights.color, setMatches])

  const getQualityColor = (quality: ClipMatch["quality"]) => {
    switch (quality) {
      case "excellent":
        return "bg-success/20 text-success border-success/30"
      case "good":
        return "bg-warning/20 text-warning border-warning/30"
      case "fair":
        return "bg-destructive/20 text-destructive border-destructive/30"
    }
  }

  const getQualityLineColor = (quality: ClipMatch["quality"]) => {
    switch (quality) {
      case "excellent":
        return "stroke-success"
      case "good":
        return "stroke-warning"
      case "fair":
        return "stroke-destructive/50"
    }
  }

  const filterOptions = {
    environment: ["indoor", "outdoor", "studio"],
    sportType: ["tennis", "bmx", "climbing", "surfing", "skateboard", "parkour"],
    timeOfDay: ["morning", "afternoon", "evening", "night"],
  }

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    const current = filters[category]
    if (current.includes(value)) {
      setFilters({ [category]: current.filter((v) => v !== value) })
    } else {
      setFilters({ [category]: [...current, value] })
    }
  }

  const handleMatchClick = (match: ClipMatch) => {
    setSelectedClips(match.clipA, match.clipB)
  }

  const handleValidation = (validated: boolean) => {
    const match = matches[currentMatchIndex]
    if (match) {
      validateMatch(match.id, validated)
      if (currentMatchIndex < matches.length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1)
      } else {
        setValidationMode(false)
        setCurrentMatchIndex(0)
      }
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex-1 p-6 overflow-auto" ref={canvasRef}>
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant={validationMode ? "default" : "outline"}
                size="sm"
                onClick={() => setValidationMode(!validationMode)}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Validate Matches
              </Button>
            </div>

            <Button onClick={() => setCurrentView("transition")} disabled={!selectedClipA || !selectedClipB}>
              Generate Transition
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card rounded-xl border border-border p-4 space-y-4"
              >
                {Object.entries(filterOptions).map(([category, options]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-2 capitalize">{category.replace(/([A-Z])/g, " $1")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => (
                        <Badge
                          key={option}
                          variant={filters[category as keyof typeof filters].includes(option) ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          onClick={() => toggleFilter(category as keyof typeof filters, option)}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Mode */}
          <AnimatePresence>
            {validationMode && matches[currentMatchIndex] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Do these clips match well?</h3>
                  <p className="text-sm text-muted-foreground">
                    Match {currentMatchIndex + 1} of {matches.length}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="w-48 h-28 rounded-lg overflow-hidden mb-2">
                      <img
                        src={matches[currentMatchIndex].clipA.thumbnail || "/placeholder.svg"}
                        alt={matches[currentMatchIndex].clipA.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-48">
                      {matches[currentMatchIndex].clipA.name}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <Sparkles className="w-6 h-6 text-primary mb-2" />
                    <Badge className={getQualityColor(matches[currentMatchIndex].quality)}>
                      {Math.round(matches[currentMatchIndex].score)}% match
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-48 h-28 rounded-lg overflow-hidden mb-2">
                      <img
                        src={matches[currentMatchIndex].clipB.thumbnail || "/placeholder.svg"}
                        alt={matches[currentMatchIndex].clipB.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-48">
                      {matches[currentMatchIndex].clipB.name}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleValidation(false)}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    No Match
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleValidation(true)}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Good Match
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Matching Canvas */}
          <div className="relative bg-card/50 rounded-xl border border-border p-6 min-h-[400px]">
            {/* Connection Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {matches.slice(0, 8).map((match, index) => {
                if (match.validated === false) return null
                const startX = 100 + (index % 4) * 180
                const startY = 120 + Math.floor(index / 4) * 200
                const endX = startX + 160
                const endY = startY + 50
                return (
                  <motion.path
                    key={match.id}
                    d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 30} ${endX} ${endY}`}
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className={cn("opacity-30", getQualityLineColor(match.quality))}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                )
              })}
            </svg>

            {/* Clips Grid */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analyzedClips.map((clip, index) => {
                const isSelected = selectedClipA?.id === clip.id || selectedClipB?.id === clip.id
                const matchForClip = matches.find(
                  (m) => (m.clipA.id === clip.id || m.clipB.id === clip.id) && m.validated !== false,
                )

                return (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.05 : 1,
                      y: isSelected ? -5 : 0,
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ delay: index * 0.05, type: "spring" }}
                    onClick={() => {
                      if (!selectedClipA) {
                        setSelectedClips(clip, null)
                      } else if (!selectedClipB && selectedClipA.id !== clip.id) {
                        setSelectedClips(selectedClipA, clip)
                      } else {
                        setSelectedClips(clip, null)
                      }
                    }}
                    className={cn(
                      "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-muted-foreground/50",
                      matchForClip &&
                        `ring-2 ${
                          matchForClip.quality === "excellent"
                            ? "ring-success/30"
                            : matchForClip.quality === "good"
                              ? "ring-warning/30"
                              : "ring-destructive/30"
                        }`,
                    )}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={clip.thumbnail || "/placeholder.svg"}
                        alt={clip.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}

                      {/* Match quality indicator */}
                      {matchForClip && (
                        <div className="absolute top-2 left-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              matchForClip.quality === "excellent"
                                ? "bg-success"
                                : matchForClip.quality === "good"
                                  ? "bg-warning"
                                  : "bg-destructive/50",
                            )}
                          />
                        </div>
                      )}

                      {/* Metadata tags */}
                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                        {clip.metadata?.sportType && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {clip.metadata.sportType}
                          </Badge>
                        )}
                        {clip.metadata?.environment && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {clip.metadata.environment}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">{clip.name}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Empty State */}
            {analyzedClips.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analyzed Clips</h3>
                <p className="text-muted-foreground">Go back to Analysis to process your clips first.</p>
              </div>
            )}
          </div>

          {/* Selected Clips Preview */}
          <AnimatePresence>
            {(selectedClipA || selectedClipB) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Selected for Transition</h4>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClips(null, null)}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div
                    className={cn(
                      "flex-1 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
                      selectedClipA ? "border-primary" : "border-border",
                    )}
                  >
                    {selectedClipA ? (
                      <img
                        src={selectedClipA.thumbnail || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Select Clip A</span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div
                    className={cn(
                      "flex-1 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
                      selectedClipB ? "border-primary" : "border-border",
                    )}
                  >
                    {selectedClipB ? (
                      <img
                        src={selectedClipB.thumbnail || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Select Clip B</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Weights Sidebar */}
      <div className="w-72 border-l border-border bg-card/50 p-4 overflow-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Match Weights</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Motion Compatibility</span>
              <span className="text-muted-foreground">{weights.motion}%</span>
            </div>
            <Slider
              value={[weights.motion]}
              onValueChange={([v]) => setWeights({ motion: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Composition</span>
              <span className="text-muted-foreground">{weights.composition}%</span>
            </div>
            <Slider
              value={[weights.composition]}
              onValueChange={([v]) => setWeights({ composition: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Color Palette</span>
              <span className="text-muted-foreground">{weights.color}%</span>
            </div>
            <Slider
              value={[weights.color]}
              onValueChange={([v]) => setWeights({ color: v })}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => setWeights({ motion: 50, composition: 50, color: 50 })}
          >
            Reset to Default
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-sm font-medium mb-4">Match Quality Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Excellent (70%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Good (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <span className="text-sm text-muted-foreground">Fair (Below 40%)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-sm font-medium mb-4">Top Matches</h4>
          <div className="space-y-2">
            {matches
              .filter((m) => m.validated !== false)
              .slice(0, 5)
              .map((match) => (
                <motion.button
                  key={match.id}
                  whileHover={{ x: 2 }}
                  onClick={() => handleMatchClick(match)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      match.quality === "excellent"
                        ? "bg-success"
                        : match.quality === "good"
                          ? "bg-warning"
                          : "bg-destructive/50",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">
                      {match.clipA.name.split(".")[0]} → {match.clipB.name.split(".")[0]}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{Math.round(match.score)}%</span>
                </motion.button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
