"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import type { ProductMedia } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wand2,
  RotateCcw,
  ChevronRight,
  ImageIcon,
  Sparkles,
  Package,
  Clock,
  CheckCircle2,
  User,
  Bike,
  Shirt,
  Camera,
  Layers,
  ArrowRight,
  Film,
  Upload,
  X,
  ImageIcon as ImageIconLucide,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface GenerationStep {
  id: string
  name: string
  status: "pending" | "running" | "complete"
  duration?: number
}

interface ExtractedIngredient {
  id: string
  type: "person" | "accessory" | "object" | "vehicle"
  name: string
  icon: React.ReactNode
  thumbnail: string
  selected: boolean
}

const singlePromptSteps: GenerationStep[] = [
  { id: "extract", name: "Extracting boundary frames", status: "pending" },
  { id: "keyframe", name: "Creating keyframe images", status: "pending" },
  { id: "ingredients", name: "Extracting visual ingredients", status: "pending" },
  { id: "generate", name: "Generating transition video", status: "pending" },
  { id: "finalize", name: "Finalizing output", status: "pending" },
]

const multiPromptSteps: GenerationStep[] = [
  { id: "extract", name: "Extracting boundary frames from Clip A & B", status: "pending" },
  { id: "analyze", name: "Analyzing frames for people & accessories", status: "pending" },
  { id: "segment", name: "Segmenting ingredients from keyframes", status: "pending" },
  { id: "generate-product", name: "Generating product placement video", status: "pending" },
  { id: "extract-product-frames", name: "Extracting product video frames", status: "pending" },
  { id: "transition-a", name: "Creating transition: Clip A → Product Video", status: "pending" },
  { id: "transition-b", name: "Creating transition: Product Video → Clip B", status: "pending" },
  { id: "composite", name: "Compositing final sequence", status: "pending" },
  { id: "finalize", name: "Finalizing output", status: "pending" },
]

export function TransitionView() {
  const {
    selectedClipA,
    selectedClipB,
    setCurrentView,
    generatedTransition,
    setGeneratedTransition,
    addToTimeline,
    productMedia,
    selectedProduct,
    addProductMedia,
    removeProductMedia,
    setSelectedProduct,
  } = useAppStore()

  const [transitionDuration, setTransitionDuration] = useState(8)
  const [productPlacement, setProductPlacement] = useState(false)
  const [productPrompt, setProductPrompt] = useState("")
  const [multiKeyframe, setMultiKeyframe] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [steps, setSteps] = useState<GenerationStep[]>(singlePromptSteps)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const [multiPromptMode, setMultiPromptMode] = useState(false)
  const [ingredientVideoPrompt, setIngredientVideoPrompt] = useState("")
  const [extractedIngredients, setExtractedIngredients] = useState<ExtractedIngredient[]>([])
  const [ingredientsExtracted, setIngredientsExtracted] = useState(false)
  const [productVideoGenerated, setProductVideoGenerated] = useState(false)

  const [showSettingsSheet, setShowSettingsSheet] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file)
      const isVideo = file.type.startsWith("video/")

      const newMedia: ProductMedia = {
        id: `product-${Date.now()}-${Math.random()}`,
        name: file.name,
        url,
        type: isVideo ? "video" : "image",
        thumbnail: isVideo ? undefined : url,
      }

      addProductMedia(newMedia)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleMultiPromptToggle = (enabled: boolean) => {
    setMultiPromptMode(enabled)
    setSteps(enabled ? multiPromptSteps : singlePromptSteps)
    setExtractedIngredients([])
    setIngredientsExtracted(false)
    setProductVideoGenerated(false)
  }

  const extractIngredients = () => {
    // Simulate extracting people, accessories, objects from keyframes
    const mockIngredients: ExtractedIngredient[] = [
      {
        id: "1",
        type: "person",
        name: "Person 1",
        icon: <User className="w-4 h-4" />,
        thumbnail: "/person-silhouette.png",
        selected: true,
      },
      {
        id: "2",
        type: "person",
        name: "Person 2",
        icon: <User className="w-4 h-4" />,
        thumbnail: "/person-outline.jpg",
        selected: true,
      },
      {
        id: "3",
        type: "vehicle",
        name: "Bicycle",
        icon: <Bike className="w-4 h-4" />,
        thumbnail: "/bicycle-silhouette.jpg",
        selected: true,
      },
      {
        id: "4",
        type: "accessory",
        name: "Backpack",
        icon: <Shirt className="w-4 h-4" />,
        thumbnail: "/backpack-outline.jpg",
        selected: false,
      },
      {
        id: "5",
        type: "object",
        name: "Camera",
        icon: <Camera className="w-4 h-4" />,
        thumbnail: "/camera-silhouette.jpg",
        selected: false,
      },
    ]
    setExtractedIngredients(mockIngredients)
    setIngredientsExtracted(true)
  }

  const toggleIngredient = (id: string) => {
    setExtractedIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, selected: !ing.selected } : ing)))
  }

  const startGeneration = () => {
    setIsGenerating(true)
    setProgress(0)
    const currentSteps = multiPromptMode ? multiPromptSteps : singlePromptSteps
    setSteps(currentSteps.map((s) => ({ ...s, status: "pending" })))

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < currentSteps.length) {
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < currentStep ? "complete" : i === currentStep ? "running" : "pending",
            duration: i < currentStep ? Math.random() * 2000 + 1000 : undefined,
          })),
        )
        setProgress(((currentStep + 1) / currentSteps.length) * 100)

        if (multiPromptMode && currentStep === 4) {
          setProductVideoGenerated(true)
        }

        currentStep++
      } else {
        setSteps((prev) => prev.map((s) => ({ ...s, status: "complete", duration: Math.random() * 2000 + 1000 })))
        setIsGenerating(false)
        setGeneratedTransition("/seamless-video-transition-effect.jpg")
        clearInterval(interval)
      }
    }, 1500)
  }

  const resetGeneration = () => {
    setGeneratedTransition(null)
    setSteps(multiPromptMode ? multiPromptSteps : singlePromptSteps)
    setProgress(0)
    setProductVideoGenerated(false)
  }

  const handleAddToTimeline = () => {
    if (selectedClipA) {
      addToTimeline(selectedClipA, generatedTransition || undefined)
    }
    if (selectedClipB) {
      addToTimeline(selectedClipB)
    }
    setCurrentView("timeline")
  }

  if (!selectedClipA || !selectedClipB) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Wand2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Select Clips First</h2>
          <p className="text-muted-foreground mb-6">
            Go to the Matching view and select two clips to generate a transition between them.
          </p>
          <Button onClick={() => setCurrentView("matching")}>Go to Matching</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Preview Area */}
      <div className="flex-1 p-4 md:p-6 overflow-auto pb-20 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
          <div className="lg:hidden flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowSettingsSheet(true)} className="gap-2">
              <Layers className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {multiPromptMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Multi-Prompt Transition Flow
              </h3>

              {/* Visual Flow Diagram */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
                {/* Clip A Last Frame */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-24 h-18 rounded-lg overflow-hidden border-2 border-info mb-1">
                    <img
                      src={selectedClipA.thumbnail || "/placeholder.svg"}
                      alt="Clip A"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clip A</p>
                  <p className="text-[11px] font-medium text-info">Last Frame</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Transition A -> Product */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-24 h-18 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary/50" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Transition</p>
                  <p className="text-[11px] font-medium text-primary">Interpolation</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Product Video First Frame */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className={cn(
                      "w-24 h-18 rounded-lg border-2 flex items-center justify-center",
                      productVideoGenerated
                        ? "border-success bg-success/10"
                        : "border-dashed border-warning/50 bg-warning/5",
                    )}
                  >
                    {productVideoGenerated ? (
                      <Film className="w-6 h-6 text-success" />
                    ) : (
                      <Package className="w-6 h-6 text-warning/50" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Product Video</p>
                  <p className="text-[11px] font-medium text-warning">First Frame</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Product Video Center */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className={cn(
                      "w-28 h-20 rounded-lg border-2 flex items-center justify-center",
                      productVideoGenerated
                        ? "border-success bg-success/10"
                        : "border-dashed border-warning/50 bg-warning/5",
                    )}
                  >
                    {productVideoGenerated ? (
                      <div className="text-center">
                        <Film className="w-7 h-7 text-success mx-auto" />
                        <p className="text-[10px] text-success mt-1">Generated</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Package className="w-7 h-7 text-warning/50 mx-auto" />
                        <p className="text-[10px] text-warning/50 mt-1">Ingredients</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-warning mt-1">Product Placement</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Product Video Last Frame */}
                <div className="flex-shrink-0 text-center">
                  <div
                    className={cn(
                      "w-24 h-18 rounded-lg border-2 flex items-center justify-center",
                      productVideoGenerated
                        ? "border-success bg-success/10"
                        : "border-dashed border-warning/50 bg-warning/5",
                    )}
                  >
                    {productVideoGenerated ? (
                      <Film className="w-6 h-6 text-success" />
                    ) : (
                      <Package className="w-6 h-6 text-warning/50" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Product Video</p>
                  <p className="text-[11px] font-medium text-warning">Last Frame</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Transition Product -> B */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-24 h-18 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary/50" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Transition</p>
                  <p className="text-[11px] font-medium text-primary">Interpolation</p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Clip B First Frame */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-24 h-18 rounded-lg overflow-hidden border-2 border-info mb-1">
                    <img
                      src={selectedClipB.thumbnail || "/placeholder.svg"}
                      alt="Clip B"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Clip B</p>
                  <p className="text-[11px] font-medium text-info">First Frame</p>
                </div>
              </div>
            </motion.div>
          )}

          {multiPromptMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-warning" />
                  Ingredient Extraction
                </h3>
                {!ingredientsExtracted && (
                  <Button size="sm" variant="outline" onClick={extractIngredients}>
                    Extract from Keyframes
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Extract people, accessories, and objects from the boundary frames to use in the product placement video.
              </p>

              {!ingredientsExtracted ? (
                <div className="flex gap-4">
                  <div className="flex-1 aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clip A - Last Frame</p>
                    <p className="text-xs text-muted-foreground">Click extract to analyze</p>
                  </div>
                  <div className="flex-1 aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/20">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clip B - First Frame</p>
                    <p className="text-xs text-muted-foreground">Click extract to analyze</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    {extractedIngredients.map((ingredient) => (
                      <motion.button
                        key={ingredient.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => toggleIngredient(ingredient.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-left",
                          ingredient.selected ? "border-primary bg-primary/10" : "border-border bg-muted/20 opacity-60",
                        )}
                      >
                        <div className="w-full aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                          <img
                            src={ingredient.thumbnail || "/placeholder.svg"}
                            alt={ingredient.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {ingredient.icon}
                          <span className="text-xs truncate">{ingredient.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">{ingredient.type}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <Label className="text-sm font-medium mb-2 block">Product Placement Video Prompt</Label>
                    <Textarea
                      placeholder="Describe how the extracted ingredients should interact with your product... e.g., 'The person rides the bicycle while drinking the energy drink, camera focuses on the product label'"
                      value={ingredientVideoPrompt}
                      onChange={(e) => setIngredientVideoPrompt(e.target.value)}
                      rows={3}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected ingredients:{" "}
                      {extractedIngredients
                        .filter((i) => i.selected)
                        .map((i) => i.name)
                        .join(", ") || "None"}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Clips Preview */}
          <div className="bg-card rounded-xl border border-border p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">{multiPromptMode ? "Source Clips" : "Transition Preview"}</h3>

            <div className="flex items-center gap-4">
              {/* Clip A */}
              <div className="flex-1">
                <div className="aspect-video rounded-lg overflow-hidden border border-border mb-2">
                  <img
                    src={selectedClipA.thumbnail || "/placeholder.svg"}
                    alt={selectedClipA.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-300 truncate">{selectedClipA.name}</p>
              </div>

              <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />

              {/* Clip B */}
              <div className="flex-1">
                <div className="aspect-video rounded-lg overflow-hidden border border-border mb-2">
                  <img
                    src={selectedClipB.thumbnail || "/placeholder.svg"}
                    alt={selectedClipB.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-gray-300 truncate">{selectedClipB.name}</p>
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {(isGenerating || generatedTransition) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4 md:space-y-6"
            >
              <div className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Generation Progress</h4>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5 mt-2" />
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      step.status === "running" && "bg-info/10",
                      step.status === "complete" && "bg-success/5",
                    )}
                  >
                    {step.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    {step.status === "running" && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Clock className="w-5 h-5 text-info" />
                      </motion.div>
                    )}
                    {step.status === "complete" && <CheckCircle2 className="w-5 h-5 text-success" />}

                    <span
                      className={cn(
                        "flex-1 text-sm",
                        step.status === "pending" && "text-muted-foreground",
                        step.status === "running" && "text-foreground font-medium",
                        step.status === "complete" && "text-foreground",
                      )}
                    >
                      {step.name}
                    </span>

                    {step.status === "complete" && step.duration && (
                      <span className="text-xs text-muted-foreground">{(step.duration / 1000).toFixed(1)}s</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          {generatedTransition && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button variant="outline" size="lg" onClick={resetGeneration} className="flex-1 bg-transparent">
                <RotateCcw className="w-5 h-5 mr-2" />
                Regenerate
              </Button>
              <Button size="lg" onClick={handleAddToTimeline} className="flex-1 bg-primary text-primary-foreground">
                Add to Timeline
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {!isGenerating && !generatedTransition && (
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={startGeneration}
              disabled={isGenerating || (multiPromptMode && !ingredientsExtracted)}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {multiPromptMode ? "Generate Multi-Prompt Transition" : "Generate Transition"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-80 border-l border-border bg-card/50 p-4 overflow-auto">
        <h3 className="font-semibold mb-6">Transition Settings</h3>

        <div className="space-y-6">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 font-medium">
                  <Layers className="w-4 h-4 text-primary" />
                  Multi-Prompt Mode
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Generate product placement video</p>
              </div>
              <Switch checked={multiPromptMode} onCheckedChange={handleMultiPromptToggle} />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Duration</Label>
              <span className="text-sm text-muted-foreground">{transitionDuration}s</span>
            </div>
            <Slider
              value={[transitionDuration]}
              onValueChange={([v]) => setTransitionDuration(v)}
              min={5}
              max={12}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Recommended: 5-12 seconds for seamless transitions</p>
          </div>

          <div className="h-px bg-border" />

          {/* Product Placement (Single Prompt) */}
          {!multiPromptMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Product Placement
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Integrate products naturally</p>
                </div>
                <Switch checked={productPlacement} onCheckedChange={setProductPlacement} />
              </div>

              <AnimatePresence>
                {productPlacement && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label>Product Prompt</Label>
                    <Textarea
                      placeholder="e.g., 'Have them drink the energy drink' or 'Show the shoes during the jump'"
                      value={productPrompt}
                      onChange={(e) => setProductPrompt(e.target.value)}
                      rows={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Product Media Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4 text-warning" />
                Product Media
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2 text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Product Media Pool */}
            <div className="bg-muted/30 rounded-lg border border-border p-3 min-h-[120px] max-h-[200px] overflow-y-auto">
              {productMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                  <Package className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No products uploaded</p>
                  <p className="text-xs text-muted-foreground/70">Upload images or videos of products</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {productMedia.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all aspect-square",
                        selectedProduct?.id === product.id
                          ? "border-warning bg-warning/10 shadow-sm"
                          : "border-border hover:border-warning/50",
                      )}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="absolute inset-0 bg-black">
                        <img
                          src={product.thumbnail || product.url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Type indicator */}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                        {product.type === "video" ? (
                          <Video className="w-3 h-3 text-white" />
                        ) : (
                          <ImageIconLucide className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* Selected indicator */}
                      {selectedProduct?.id === product.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeProductMedia(product.id)
                        }}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{product.name}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-lg bg-warning/10 border border-warning/30"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-warning" />
                  <p className="text-xs text-foreground flex-1 truncate">
                    Selected: <span className="font-medium">{selectedProduct.name}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="h-5 w-5 p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Keyframe Preview */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Keyframe Preview
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <img
                  src={selectedClipA.thumbnail || "/placeholder.svg"}
                  alt="Start frame"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <img
                  src={selectedClipB.thumbnail || "/placeholder.svg"}
                  alt="End frame"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Quality Settings */}
          <div className="space-y-3">
            <Label>Output Quality</Label>
            <div className="flex gap-2">
              {["720p", "1080p", "4K"].map((quality) => (
                <Button
                  key={quality}
                  variant={quality === "1080p" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettingsSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowSettingsSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-16 left-0 right-0 bg-card rounded-t-2xl z-[90] max-h-[calc(85vh-4rem)] flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex items-center justify-center py-3 border-b border-border">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-lg">Transition Settings</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSettingsSheet(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-6">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2 font-medium">
                          <Layers className="w-4 h-4 text-primary" />
                          Multi-Prompt Mode
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Generate product placement video</p>
                      </div>
                      <Switch checked={multiPromptMode} onCheckedChange={handleMultiPromptToggle} />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Duration</Label>
                      <span className="text-sm text-muted-foreground">{transitionDuration}s</span>
                    </div>
                    <Slider
                      value={[transitionDuration]}
                      onValueChange={([v]) => setTransitionDuration(v)}
                      min={5}
                      max={12}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: 5-12 seconds for seamless transitions</p>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Product Placement (Single Prompt) */}
                  {!multiPromptMode && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Product Placement
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">Integrate products naturally</p>
                        </div>
                        <Switch checked={productPlacement} onCheckedChange={setProductPlacement} />
                      </div>

                      <AnimatePresence>
                        {productPlacement && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <Label>Product Prompt</Label>
                            <Textarea
                              placeholder="e.g., 'Have them drink the energy drink' or 'Show the shoes during the jump'"
                              value={productPrompt}
                              onChange={(e) => setProductPrompt(e.target.value)}
                              rows={3}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="h-px bg-border" />

                  {/* Product Media Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Product Media
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-3 h-3" />
                        Add
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="min-h-[120px] rounded-lg border border-dashed border-border p-2 bg-muted/20">
                      {productMedia.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                          <Package className="w-8 h-8 text-muted-foreground/50 mb-2" />
                          <p className="text-xs text-muted-foreground">No products uploaded</p>
                          <p className="text-xs text-muted-foreground/70">Upload images or videos of products</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {productMedia.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all aspect-square",
                                selectedProduct?.id === product.id
                                  ? "border-warning bg-warning/10 shadow-sm"
                                  : "border-border hover:border-warning/50",
                              )}
                              onClick={() => setSelectedProduct(product)}
                            >
                              <div className="absolute inset-0 bg-black">
                                <img
                                  src={product.thumbnail || product.url}
                                  alt={product.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              {/* Type indicator */}
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                                {product.type === "video" ? (
                                  <Video className="w-3 h-3 text-white" />
                                ) : (
                                  <ImageIconLucide className="w-3 h-3 text-white" />
                                )}
                              </div>

                              {/* Selected indicator */}
                              {selectedProduct?.id === product.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                </motion.div>
                              )}

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeProductMedia(product.id)
                                }}
                                className="absolute bottom-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              {/* Name overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] text-white truncate">{product.name}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 rounded-lg bg-warning/10 border border-warning/30"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-warning" />
                          <p className="text-xs text-foreground flex-1 truncate">
                            Selected: <span className="font-medium">{selectedProduct.name}</span>
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProduct(null)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="h-px bg-border" />

                  {/* Keyframe Preview */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Keyframe Preview
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                        <img
                          src={selectedClipA.thumbnail || "/placeholder.svg"}
                          alt="Start frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                        <img
                          src={selectedClipB.thumbnail || "/placeholder.svg"}
                          alt="End frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Quality Settings */}
                  <div className="space-y-3">
                    <Label>Output Quality</Label>
                    <div className="flex gap-2">
                      {["720p", "1080p", "4K"].map((quality) => (
                        <Button
                          key={quality}
                          variant={quality === "1080p" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                        >
                          {quality}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
