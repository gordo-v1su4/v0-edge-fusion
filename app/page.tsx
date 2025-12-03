"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { UploadView } from "@/components/upload-view"
import { AnalysisView } from "@/components/analysis-view"
import { MatchingView } from "@/components/matching-view"
import { TransitionView } from "@/components/transition-view"
import { TimelineView } from "@/components/timeline-view"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <>
      <MobileNav />

      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            {currentView === "upload" && <UploadView />}
            {currentView === "analysis" && <AnalysisView />}
            {currentView === "matching" && <MatchingView />}
            {currentView === "transition" && <TransitionView />}
            {currentView === "timeline" && <TimelineView />}
          </main>
        </div>
      </div>
    </>
  )
}
