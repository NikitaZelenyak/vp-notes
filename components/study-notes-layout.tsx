"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Editor } from "@/components/editor"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Module {
  id: string
  title: string
  position: number
  pages?: Page[]
}

interface Page {
  id: string
  title: string
  position: number
  module_id: string
  subpages?: Subpage[]
}

interface Subpage {
  id: string
  title: string
  position: number
  page_id: string
}

interface StudyNotesLayoutProps {
  modules: Module[]
  userId: string
}

export function StudyNotesLayout({ modules, userId }: StudyNotesLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState<{
    type: "module" | "page" | "subpage"
    id: string
    title: string
  } | null>(null)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="flex h-screen flex-col bg-background/80">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-primary"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Study suite
            </p>
            <h1 className="text-lg font-semibold text-primary">Study Notes</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden bg-muted/20">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-72 border-r border-border/60 bg-sidebar/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
            <Sidebar modules={modules} userId={userId} onSelectItem={setSelectedItem} selectedItem={selectedItem} />
          </aside>
        )}

        {/* Editor */}
        <main className="flex-1 overflow-hidden">
          <Editor selectedItem={selectedItem} userId={userId} />
        </main>
      </div>
    </div>
  )
}
