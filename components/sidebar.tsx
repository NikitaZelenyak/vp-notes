"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    item:
      | { type: "module" | "page" | "subpage"; id: string; title: string }
      | null
  ) => void;
  selectedItem:
    | { type: "module" | "page" | "subpage"; id: string; title: string }
    | null;
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

  const expandModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      if (prev.has(moduleId)) return prev;
      const next = new Set(prev);
      next.add(moduleId);
      return next;
    });
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

  const expandPage = (pageId: string) => {
    setExpandedPages((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      return next;
    });
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("modules")
      .insert({
        title: newModuleTitle.trim(),
        user_id: userId,
        position: modules.length,
      })
      .select()
      .single();

    if (!error && data) {
      setNewModuleTitle("");
      setIsAddingModule(false);
      expandModule(data.id);
      onSelectItem({
        type: "module",
        id: data.id,
        title: data.title,
      });
      router.refresh();
    }
  };

  const handleEditModule = async (moduleId: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename module:", currentTitle);
    if (!newTitle?.trim()) return;
    const supabase = createClient();
    await supabase
      .from("modules")
      .update({ title: newTitle.trim() })
      .eq("id", moduleId);
    if (selectedItem?.type === "module" && selectedItem.id === moduleId) {
      onSelectItem({
        type: "module",
        id: moduleId,
        title: newTitle.trim(),
      });
    }
    router.refresh();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete module and all its pages? This cannot be undone."))
      return;
    const supabase = createClient();
    await supabase.from("modules").delete().eq("id", moduleId);
    if (selectedItem?.type === "module" && selectedItem.id === moduleId) {
      onSelectItem(null);
    }
    router.refresh();
  };

  const handleEditPage = async (pageId: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename page:", currentTitle);
    if (!newTitle?.trim()) return;
    const supabase = createClient();
    await supabase
      .from("pages")
      .update({ title: newTitle.trim() })
      .eq("id", pageId);
    if (selectedItem?.type === "page" && selectedItem.id === pageId) {
      onSelectItem({
        type: "page",
        id: pageId,
        title: newTitle.trim(),
      });
    }
    router.refresh();
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Delete page and its subpages?")) return;
    const supabase = createClient();
    await supabase.from("pages").delete().eq("id", pageId);
    if (
      (selectedItem?.type === "page" && selectedItem.id === pageId) ||
      (selectedItem?.type === "subpage" &&
        modules
          .flatMap((module) => module.pages || [])
          .some(
            (page) =>
              page.id === pageId &&
              page.subpages?.some(
                (subpage) => subpage.id === selectedItem.id
              )
          ))
    ) {
      onSelectItem(null);
    }
    router.refresh();
  };

  const handleEditSubpage = async (
    subpageId: string,
    currentTitle: string
  ) => {
    const newTitle = window.prompt("Rename subpage:", currentTitle);
    if (!newTitle?.trim()) return;
    const supabase = createClient();
    await supabase
      .from("subpages")
      .update({ title: newTitle.trim() })
      .eq("id", subpageId);
    if (selectedItem?.type === "subpage" && selectedItem.id === subpageId) {
      onSelectItem({
        type: "subpage",
        id: subpageId,
        title: newTitle.trim(),
      });
    }
    router.refresh();
  };

  const handleDeleteSubpage = async (subpageId: string) => {
    if (!confirm("Delete subpage?")) return;
    const supabase = createClient();
    await supabase.from("subpages").delete().eq("id", subpageId);
    if (selectedItem?.type === "subpage" && selectedItem.id === subpageId) {
      onSelectItem(null);
    }
    router.refresh();
  };

  const handleAddPage = async (moduleId: string) => {
    const supabase = createClient();
    const module = modules.find((m) => m.id === moduleId);
    const { data, error } = await supabase
      .from("pages")
      .insert({
        title: "New Page",
        module_id: moduleId,
        user_id: userId,
        position: module?.pages?.length || 0,
      })
      .select()
      .single();

    if (!error && data) {
      expandModule(moduleId);
      onSelectItem({
        type: "page",
        id: data.id,
        title: data.title,
      });
      router.refresh();
    }
  };

  const handleAddSubpage = async (pageId: string) => {
    const supabase = createClient();
    const page = modules
      .flatMap((m) => m.pages || [])
      .find((p) => p.id === pageId);
    const { data, error } = await supabase
      .from("subpages")
      .insert({
        title: "New Subpage",
        page_id: pageId,
        user_id: userId,
        position: page?.subpages?.length || 0,
      })
      .select()
      .single();

    if (!error && data) {
      const parentModule = modules.find((module) =>
        module.pages?.some((p) => p.id === pageId)
      );
      if (parentModule) {
        expandModule(parentModule.id);
      }
      expandPage(pageId);
      onSelectItem({
        type: "subpage",
        id: data.id,
        title: data.title,
      });
      router.refresh();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Navigator
              </p>
              <h2 className="text-base font-semibold text-foreground">
                Modules & Pages
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setIsAddingModule(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New module
            </Button>
          </div>

          {isAddingModule && (
            <div className="rounded-xl border bg-background p-3 shadow-sm">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Module name"
                  value={newModuleTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewModuleTitle(e.target.value)
                  }
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleAddModule();
                    if (e.key === "Escape") {
                      setIsAddingModule(false);
                      setNewModuleTitle("");
                    }
                  }}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingModule(false);
                      setNewModuleTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddModule}
                    disabled={!newModuleTitle.trim()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {modules.length === 0 && (
            <div className="rounded-xl border border-dashed bg-background/60 p-4 text-center text-sm text-muted-foreground">
              Create your first module to start organising your notes.
            </div>
          )}

          {modules.map((module) => {
            const isModuleExpanded = expandedModules.has(module.id);
            const isModuleSelected =
              selectedItem?.type === "module" && selectedItem.id === module.id;

            return (
              <div
                key={module.id}
                className="group rounded-2xl border border-transparent bg-transparent transition hover:border-accent/60 hover:bg-accent/40"
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground transition hover:text-foreground"
                    onClick={() => toggleModule(module.id)}
                    aria-label={isModuleExpanded ? "Collapse module" : "Expand module"}
                  >
                    {isModuleExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start gap-2 rounded-md px-2 text-left font-medium transition",
                      isModuleSelected
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      onSelectItem({
                        type: "module",
                        id: module.id,
                        title: module.title,
                      })
                    }
                  >
                    {isModuleExpanded ? (
                      <FolderOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{module.title}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-0 transition group-hover:opacity-100"
                        aria-label="Module actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      className="w-48"
                    >
                      <DropdownMenuItem
                        onClick={() => handleAddPage(module.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add page
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleEditModule(module.id, module.title)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteModule(module.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isModuleExpanded && module.pages && module.pages.length > 0 && (
                  <div className="space-y-1 pb-2 pl-10 pr-2">
                    {module.pages.map((page) => {
                      const hasSubpages = (page.subpages?.length || 0) > 0;
                      const isPageExpanded = expandedPages.has(page.id);
                      const isPageSelected =
                        selectedItem?.type === "page" &&
                        selectedItem.id === page.id;

                      return (
                        <div key={page.id} className="group/page">
                          <div className="flex items-center gap-2 py-1">
                            {hasSubpages ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground transition hover:text-foreground"
                                onClick={() => togglePage(page.id)}
                                aria-label={
                                  isPageExpanded
                                    ? "Collapse subpages"
                                    : "Expand subpages"
                                }
                              >
                                {isPageExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <span className="ml-2 w-4" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "flex-1 justify-start gap-2 rounded-md px-2 text-left text-sm transition",
                                isPageSelected
                                  ? "bg-primary/10 text-primary shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() =>
                                onSelectItem({
                                  type: "page",
                                  id: page.id,
                                  title: page.title,
                                })
                              }
                            >
                              <FileText className="h-4 w-4" />
                              <span className="truncate">{page.title}</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover/page:opacity-100"
                                  aria-label="Page actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                side="right"
                                className="w-48"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleAddSubpage(page.id)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add subpage
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditPage(page.id, page.title)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeletePage(page.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {isPageExpanded &&
                            page.subpages &&
                            page.subpages.length > 0 && (
                              <div className="space-y-1 pl-9">
                                {page.subpages.map((subpage) => {
                                  const isSubpageSelected =
                                    selectedItem?.type === "subpage" &&
                                    selectedItem.id === subpage.id;
                                  return (
                                    <div
                                      key={subpage.id}
                                      className="group/subpage flex items-center gap-2 py-1"
                                    >
                                      <span className="ml-1 w-3 border-l border-dashed border-border/60" />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "flex-1 justify-start gap-2 rounded-md px-2 text-left text-sm transition",
                                          isSubpageSelected
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() =>
                                          onSelectItem({
                                            type: "subpage",
                                            id: subpage.id,
                                            title: subpage.title,
                                          })
                                        }
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="truncate">
                                          {subpage.title}
                                        </span>
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover/subpage:opacity-100"
                                            aria-label="Subpage actions"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="start"
                                          side="right"
                                          className="w-40"
                                        >
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleEditSubpage(
                                                subpage.id,
                                                subpage.title
                                              )
                                            }
                                          >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Rename
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleDeleteSubpage(subpage.id)
                                            }
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
