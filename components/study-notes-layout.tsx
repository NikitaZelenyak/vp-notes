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
    type: "page" | "subpage"
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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Study Notes</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-64 border-r bg-muted/30">
            <Sidebar modules={modules} userId={userId} onSelectItem={setSelectedItem} selectedItem={selectedItem} />
          </aside>
        )}

        {/* Editor */}
        <main className="flex-1 overflow-auto">
          <Editor selectedItem={selectedItem} userId={userId} />
        </main>
      </div>
    </div>
  )
}
