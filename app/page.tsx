"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { UploadView } from "@/components/upload-view"
import { AnalysisView } from "@/components/analysis-view"
import { MatchingView } from "@/components/matching-view"
import { TransitionView } from "@/components/transition-view"
import { TimelineView } from "@/components/timeline-view"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex">
          {currentView === "upload" && <UploadView />}
          {currentView === "analysis" && <AnalysisView />}
          {currentView === "matching" && <MatchingView />}
          {currentView === "transition" && <TransitionView />}
          {currentView === "timeline" && <TimelineView />}
        </main>
      </div>
    </div>
  )
}
