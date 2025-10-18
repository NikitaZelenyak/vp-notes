"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus } from "lucide-react";
import { BlockList } from "@/components/block-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditorProps {
  selectedItem: { type: "page" | "subpage"; id: string; title: string } | null;
  userId: string;
}

interface Block {
  id: string;
  type: "text" | "image";
  content: any;
  position: number;
}

export function Editor({ selectedItem, userId }: EditorProps) {
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (selectedItem) {
      setTitle(selectedItem.title);
      setIsEditingTitle(false);
      loadBlocks();
    }
  }, [selectedItem]);

  const loadBlocks = async () => {
    if (!selectedItem) return;

    const supabase = createClient();
    const query = supabase
      .from("blocks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (selectedItem.type === "page") {
      query.eq("page_id", selectedItem.id).is("subpage_id", null);
    } else {
      query.eq("subpage_id", selectedItem.id).is("page_id", null);
    }

    const { data } = await query;
    setBlocks(data || []);
  };

  const handleUpdateTitle = async () => {
    if (!selectedItem || !title.trim()) return;

    const supabase = createClient();
    const table = selectedItem.type === "page" ? "pages" : "subpages";

    await supabase.from(table).update({ title }).eq("id", selectedItem.id);

    setIsEditingTitle(false);
  };

  const handleAddBlock = async (type: "text" | "image") => {
    if (!selectedItem) return;

    const supabase = createClient();
    const newBlock = {
      type,
      user_id: userId,
      position: blocks.length,
      content: type === "text" ? { text: "" } : { url: "" },
      ...(selectedItem.type === "page"
        ? { page_id: selectedItem.id }
        : { subpage_id: selectedItem.id }),
    };

    const { data, error } = await supabase
      .from("blocks")
      .insert(newBlock)
      .select()
      .single();

    if (!error && data) {
      setBlocks([...blocks, data]);
    }
  };

  if (!selectedItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Select a page or subpage to start editing</p>
          <p className="mt-2 text-sm">
            Create a new module from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title || "Untitled"}</h1>
            <div className="mt-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="w-64 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => handleAddBlock("text")}>Add Text</Button>
            <Button onClick={() => {}}>Paste Image</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <BlockList
          blocks={blocks}
          onBlocksChange={setBlocks}
          userId={userId}
          selectedItem={selectedItem}
        />
      </div>
    </div>
  );
}
