"use client"

import { useAppStore } from "@/lib/store"
import { Bell, User } from "lucide-react"
import { useState } from "react"

const viewTitles = {
  upload: "Import Videos",
  analysis: "Video Analysis",
  matching: "Clip Matching",
  transition: "Generate Transitions",
  timeline: "Timeline & Export",
}

export function Header() {
  const { currentView } = useAppStore()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs">⚡</span>
          </div>
        </div>
        <h2 className="text-base lg:text-lg font-semibold truncate">{viewTitles[currentView]}</h2>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button className="relative text-textSecondary hover:text-white transition-colors">
          <Bell size={18} className="lg:w-5 lg:h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-black font-bold text-xs">
          <User size={14} className="lg:w-4 lg:h-4" />
        </button>
      </div>
    </header>
  )
}
