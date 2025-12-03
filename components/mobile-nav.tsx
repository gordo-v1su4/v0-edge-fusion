"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { Upload, Sparkles, GitMerge, Wand2, Film } from "lucide-react"

const navItems = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analysis", label: "Analysis", icon: Sparkles },
  { id: "matching", label: "Matching", icon: GitMerge },
  { id: "transition", label: "Transitions", icon: Wand2 },
  { id: "timeline", label: "Timeline", icon: Film },
] as const

export function MobileNav() {
  const { currentView, setCurrentView, clips } = useAppStore()

  const hasClips = clips.length > 0
  const analyzedClips = clips.filter((c) => c.status === "complete").length

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border z-[100] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id
          const isDisabled =
            (item.id === "analysis" && !hasClips) ||
            (item.id === "matching" && analyzedClips < 2) ||
            (item.id === "transition" && analyzedClips < 2) ||
            (item.id === "timeline" && analyzedClips < 1)

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setCurrentView(item.id)}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive ? "text-primary" : "text-textSecondary",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
