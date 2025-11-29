"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { Upload, Sparkles, GitMerge, Wand2, Film, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analysis", label: "Analysis", icon: Sparkles },
  { id: "matching", label: "Matching", icon: GitMerge },
  { id: "transition", label: "Transitions", icon: Wand2 },
  { id: "timeline", label: "Timeline", icon: Film },
] as const

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { currentView, setCurrentView, clips } = useAppStore()

  const hasClips = clips.length > 0
  const analyzedClips = clips.filter((c) => c.status === "complete").length

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">edge-fusion</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground"
            >
              <p>{clips.length} clips imported</p>
              <p>{analyzedClips} analyzed</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
