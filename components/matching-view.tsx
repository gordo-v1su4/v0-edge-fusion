"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useAppStore, type ClipMatch } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { Sliders, Filter, Sparkles, ArrowRight, Check, X, ThumbsDown, ThumbsUp } from "lucide-react"
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
    setCurrentView,
    validationMode,
    setValidationMode,
    currentMatchIndex,
    setCurrentMatchIndex,
    validateMatch,
  } = useAppStore()

  const [showFilters, setShowFilters] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
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
        return "bg-green-500/30 text-green-400 border-green-500/50"
      case "good":
        return "bg-yellow-500/30 text-yellow-400 border-yellow-500/50"
      case "fair":
        return "bg-red-500/40 text-red-400 border-red-500/60"
    }
  }

  const getQualityBorderColor = (score: number) => {
    if (score > 70) return "border-green-500/60"
    if (score > 40) return "border-yellow-500/60"
    return "border-red-500/70"
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
      <div className="flex-1 p-4 md:p-6 overflow-auto pb-20 lg:pb-6" ref={canvasRef}>
        <div className="space-y-4 md:space-y-6">
          {/* Controls Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={
                  showFilters
                    ? "bg-primary/20 text-primary border-primary"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary bg-transparent"
                }
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden hover:bg-primary/10 hover:text-primary hover:border-primary bg-transparent"
              >
                <Sliders className="w-4 h-4 mr-2" />
                Weights
              </Button>
            </div>

            <Button
              className="text-sm md:text-base"
              onClick={() => setCurrentView("transition")}
              disabled={!selectedClipA || !selectedClipB}
            >
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
                className="bg-card rounded-xl border border-border p-3 md:p-4 space-y-3 md:space-y-4"
              >
                {Object.entries(filterOptions).map(([category, options]) => (
                  <div key={category}>
                    <h4 className="text-xs md:text-sm font-medium mb-2 capitalize">
                      {category.replace(/([A-Z])/g, " $1")}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {options.map((option) => (
                        <Badge
                          key={option}
                          variant={filters[category as keyof typeof filters].includes(option) ? "default" : "outline"}
                          className="cursor-pointer transition-colors text-xs"
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
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Do these clips match well?</h3>
                  <p className="text-sm text-muted-foreground">
                    Match {currentMatchIndex + 1} of {matches.length}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 max-w-3xl mx-auto">
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <div className="aspect-video">
                        <img
                          src={matches[currentMatchIndex].clipA.thumbnail || "/placeholder.svg"}
                          alt={matches[currentMatchIndex].clipA.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/25">
                        <p className="text-sm font-medium truncate text-gray-300">
                          {matches[currentMatchIndex].clipA.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {matches[currentMatchIndex].clipA.metadata?.sportType && (
                        <Badge variant="secondary" className="text-xs">
                          {matches[currentMatchIndex].clipA.metadata.sportType}
                        </Badge>
                      )}
                      {matches[currentMatchIndex].clipA.metadata?.environment && (
                        <Badge variant="outline" className="text-xs">
                          {matches[currentMatchIndex].clipA.metadata.environment}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <div className="aspect-video">
                        <img
                          src={matches[currentMatchIndex].clipB.thumbnail || "/placeholder.svg"}
                          alt={matches[currentMatchIndex].clipB.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/25">
                        <p className="text-sm font-medium truncate text-gray-300">
                          {matches[currentMatchIndex].clipB.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {matches[currentMatchIndex].clipB.metadata?.sportType && (
                        <Badge variant="secondary" className="text-xs">
                          {matches[currentMatchIndex].clipB.metadata.sportType}
                        </Badge>
                      )}
                      {matches[currentMatchIndex].clipB.metadata?.environment && (
                        <Badge variant="outline" className="text-xs">
                          {matches[currentMatchIndex].clipB.metadata.environment}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <Badge className={getQualityColor(matches[currentMatchIndex].quality)}>
                      {Math.round(matches[currentMatchIndex].score)}% match
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleValidation(false)}
                    className="border-muted-foreground text-muted-foreground hover:bg-red-500/20 hover:text-red-500 hover:border-red-500 transition-colors"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    No Match
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleValidation(true)}
                    className="border-muted-foreground text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500 transition-colors"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Good Match
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Matching Canvas */}
          <div className="relative bg-card/50 rounded-xl border border-border p-3 md:p-6 min-h-[300px] md:min-h-[400px]">
            {/* Connection Lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
              {matches.slice(0, 8).map((match, index) => {
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
                    className={cn("opacity-30", getQualityBorderColor(match.score))}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                )
              })}
            </svg>

            {/* Clips Grid */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {analyzedClips.map((clip, index) => {
                const isSelected = selectedClipA?.id === clip.id || selectedClipB?.id === clip.id
                const matchForClip = matches.find((m) => m.clipA.id === clip.id || m.clipB.id === clip.id)

                return (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{ delay: index * 0.05 }}
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
                        : matchForClip
                          ? `border-transparent ring-2 ${matchForClip.score > 70 ? "ring-green-500/30" : matchForClip.score > 40 ? "ring-yellow-500/30" : "ring-red-500/40"}`
                          : "border-border hover:border-muted-foreground/50",
                    )}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={clip.thumbnail || "/placeholder.svg"}
                        alt={clip.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                        </div>
                      )}
                      {matchForClip && (
                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 border",
                              matchForClip.score > 70
                                ? "bg-green-500/40 border-green-500/60 text-green-300"
                                : matchForClip.score > 40
                                  ? "bg-yellow-500/40 border-yellow-500/60 text-yellow-300"
                                  : "bg-red-500/50 border-red-500/70 text-red-300",
                            )}
                          >
                            {matchForClip.quality}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2.5 bg-black/25">
                        <p className="text-[10px] md:text-xs font-medium truncate text-gray-300 mb-1 md:mb-1.5">
                          {clip.name}
                        </p>
                        <div className="flex flex-wrap gap-0.5 md:gap-1">
                          {clip.metadata?.sportType && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0 bg-black/30 text-gray-300 border-none"
                            >
                              {clip.metadata.sportType}
                            </Badge>
                          )}
                          {clip.metadata?.environment && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0 bg-black/30 text-gray-300 border-none"
                            >
                              {clip.metadata.environment}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Empty State */}
            {analyzedClips.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 md:h-64 text-center">
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">No Analyzed Clips</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Go back to Analysis to process your clips first.
                </p>
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
                className="bg-card rounded-xl border border-border p-3 md:p-4"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h4 className="text-xs md:text-sm font-medium">Selected for Transition</h4>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClips(null, null)}>
                    <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div
                    className={cn(
                      "relative rounded-lg border-2 overflow-hidden",
                      selectedClipA ? "border-primary" : "border-dashed border-border bg-muted/20",
                    )}
                  >
                    {selectedClipA ? (
                      <>
                        <div className="aspect-video">
                          <img
                            src={selectedClipA.thumbnail || "/placeholder.svg"}
                            alt={selectedClipA.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-black/25">
                          <p className="text-[10px] md:text-xs font-medium truncate text-gray-300">
                            {selectedClipA.name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video flex items-center justify-center">
                        <span className="text-xs md:text-sm text-muted-foreground">Select Clip A</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "relative rounded-lg border-2 overflow-hidden",
                      selectedClipB ? "border-primary" : "border-dashed border-border bg-muted/20",
                    )}
                  >
                    {selectedClipB ? (
                      <>
                        <div className="aspect-video">
                          <img
                            src={selectedClipB.thumbnail || "/placeholder.svg"}
                            alt={selectedClipB.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-black/25">
                          <p className="text-[10px] md:text-xs font-medium truncate text-gray-300">
                            {selectedClipB.name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video flex items-center justify-center">
                        <span className="text-xs md:text-sm text-muted-foreground">Select Clip B</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-16 left-0 right-0 max-h-[calc(80vh-4rem)] border-t border-border bg-card z-[90] lg:hidden overflow-auto rounded-t-2xl"
            >
              <div className="sticky top-0 bg-card pt-2 pb-4 border-b border-border">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Match Weights</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 pb-8">
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
                  <h4 className="text-sm font-medium mb-4">Top Matches</h4>
                  <div className="space-y-2">
                    {matches.slice(0, 5).map((match) => (
                      <motion.button
                        key={match.id}
                        whileHover={{ x: 2 }}
                        onClick={() => {
                          handleMatchClick(match)
                          setShowSidebar(false)
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            match.score > 70 ? "bg-green-500" : match.score > 40 ? "bg-yellow-500" : "bg-red-500",
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Weights Sidebar */}
      <div className="hidden lg:block w-72 border-l border-border bg-card/50 p-4 overflow-auto">
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
          <h4 className="text-sm font-medium mb-4">Top Matches</h4>
          <div className="space-y-2">
            {matches.slice(0, 5).map((match) => (
              <motion.button
                key={match.id}
                whileHover={{ x: 2 }}
                onClick={() => handleMatchClick(match)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    match.score > 70 ? "bg-green-500" : match.score > 40 ? "bg-yellow-500" : "bg-red-500",
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
