"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Settings, HelpCircle, Bell } from "lucide-react"

const viewTitles = {
  upload: "Import Videos",
  analysis: "Video Analysis",
  matching: "Clip Matching",
  transition: "Generate Transitions",
  timeline: "Timeline & Export",
}

export function Header() {
  const { currentView } = useAppStore()

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{viewTitles[currentView]}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
