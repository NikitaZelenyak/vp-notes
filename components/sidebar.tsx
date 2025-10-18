"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  FolderOpen,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  position: number;
  pages?: Page[];
}

interface Page {
  id: string;
  title: string;
  position: number;
  module_id: string;
  subpages?: Subpage[];
}

interface Subpage {
  id: string;
  title: string;
  position: number;
  page_id: string;
}

interface SidebarProps {
  modules: Module[];
  userId: string;
  onSelectItem: (
    item: { type: "page" | "subpage"; id: string; title: string } | null
  ) => void;
  selectedItem: { type: "page" | "subpage"; id: string; title: string } | null;
}

export function Sidebar({
  modules,
  userId,
  onSelectItem,
  selectedItem,
}: SidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const router = useRouter();

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const togglePage = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;

    const supabase = createClient();
    const { error } = await supabase.from("modules").insert({
      title: newModuleTitle,
      user_id: userId,
      position: modules.length,
    });

    if (!error) {
      setNewModuleTitle("");
      setIsAddingModule(false);
      router.refresh();
    }
  };

  const handleEditModule = async (moduleId: string) => {
    const newTitle = window.prompt("Rename module:");
    if (!newTitle) return;
    const supabase = createClient();
    await supabase
      .from("modules")
      .update({ title: newTitle })
      .eq("id", moduleId);
    router.refresh();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete module and all its pages? This cannot be undone."))
      return;
    const supabase = createClient();
    await supabase.from("modules").delete().eq("id", moduleId);
    router.refresh();
  };

  const handleEditPage = async (pageId: string) => {
    const newTitle = window.prompt("Rename page:");
    if (!newTitle) return;
    const supabase = createClient();
    await supabase.from("pages").update({ title: newTitle }).eq("id", pageId);
    router.refresh();
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Delete page and its subpages?")) return;
    const supabase = createClient();
    await supabase.from("pages").delete().eq("id", pageId);
    router.refresh();
  };

  const handleEditSubpage = async (subpageId: string) => {
    const newTitle = window.prompt("Rename subpage:");
    if (!newTitle) return;
    const supabase = createClient();
    await supabase
      .from("subpages")
      .update({ title: newTitle })
      .eq("id", subpageId);
    router.refresh();
  };

  const handleDeleteSubpage = async (subpageId: string) => {
    if (!confirm("Delete subpage?")) return;
    const supabase = createClient();
    await supabase.from("subpages").delete().eq("id", subpageId);
    router.refresh();
  };

  const handleAddPage = async (moduleId: string) => {
    const supabase = createClient();
    const module = modules.find((m) => m.id === moduleId);
    const { error } = await supabase.from("pages").insert({
      title: "New Page",
      module_id: moduleId,
      user_id: userId,
      position: module?.pages?.length || 0,
    });

    if (!error) {
      router.refresh();
    }
  };

  const handleAddSubpage = async (pageId: string) => {
    const supabase = createClient();
    const page = modules
      .flatMap((m) => m.pages || [])
      .find((p) => p.id === pageId);
    const { error } = await supabase.from("subpages").insert({
      title: "New Subpage",
      page_id: pageId,
      user_id: userId,
      position: page?.subpages?.length || 0,
    });

    if (!error) {
      router.refresh();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-transparent"
          onClick={() => setIsAddingModule(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isAddingModule && (
            <div className="mb-2 flex gap-2">
              <Input
                placeholder="Module name"
                value={newModuleTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewModuleTitle(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleAddModule();
                  if (e.key === "Escape") setIsAddingModule(false);
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleAddModule}>
                Add
              </Button>
            </div>
          )}

          {modules.map((module) => (
            <div key={module.id} className="mb-1">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1 justify-start px-2"
                  onClick={() => toggleModule(module.id)}
                >
                  {expandedModules.has(module.id) ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  {expandedModules.has(module.id) ? (
                    <FolderOpen className="mr-2 h-4 w-4" />
                  ) : (
                    <Folder className="mr-2 h-4 w-4" />
                  )}
                  <span className="truncate">{module.title}</span>
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleAddPage(module.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleEditModule(module.id)}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDeleteModule(module.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </div>

              {expandedModules.has(module.id) && module.pages && (
                <div className="ml-4">
                  {module.pages.map((page) => (
                    <div key={page.id} className="mb-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 flex-1 justify-start px-2 text-left",
                            selectedItem?.type === "page" &&
                              selectedItem?.id === page.id &&
                              "bg-gray-100 dark:bg-gray-700 font-medium"
                          )}
                          onClick={() => {
                            if (page.subpages && page.subpages.length > 0) {
                              togglePage(page.id);
                            } else {
                              onSelectItem({
                                type: "page",
                                id: page.id,
                                title: page.title,
                              });
                            }
                          }}
                        >
                          {page.subpages && page.subpages.length > 0 ? (
                            expandedPages.has(page.id) ? (
                              <ChevronDown className="mr-1 h-4 w-4" />
                            ) : (
                              <ChevronRight className="mr-1 h-4 w-4" />
                            )
                          ) : (
                            <div className="mr-1 w-4" />
                          )}
                          <FileText className="mr-2 h-4 w-4" />
                          <span className="truncate">{page.title}</span>
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleAddSubpage(page.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleEditPage(page.id)}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleDeletePage(page.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>

                      {expandedPages.has(page.id) && page.subpages && (
                        <div className="ml-4">
                          {page.subpages.map((subpage) => (
                            <div
                              key={subpage.id}
                              className="flex items-center gap-1 mb-1"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 flex-1 justify-start px-2 text-left",
                                  selectedItem?.type === "subpage" &&
                                    selectedItem?.id === subpage.id &&
                                    "bg-gray-100 dark:bg-gray-700 font-medium"
                                )}
                                onClick={() =>
                                  onSelectItem({
                                    type: "subpage",
                                    id: subpage.id,
                                    title: subpage.title,
                                  })
                                }
                              >
                                <div className="mr-1 w-4" />
                                <FileText className="mr-2 h-4 w-4" />
                                <span className="truncate">
                                  {subpage.title}
                                </span>
                              </Button>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => handleEditSubpage(subpage.id)}
                                >
                                  ✏️
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() =>
                                    handleDeleteSubpage(subpage.id)
                                  }
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
