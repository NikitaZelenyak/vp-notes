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
      {/* Title / Header Area */}
      <div className="p-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Editing Subpage: {title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Content Title:
              </p>
              <div className="mt-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="w-full text-lg"
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddBlock("text")}
                  className="bg-violet-600 text-white"
                >
                  + Add Text Block
                </Button>
                <Button
                  onClick={() => {}}
                  className="bg-emerald-200 text-black"
                >
                  + Add Image via Paste (Ctrl+V)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blocks Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-gray-50 rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-violet-600">
            Page Content Blocks (Unlimited)
          </h3>
          <div className="mt-4">
            <BlockList
              blocks={blocks}
              onBlocksChange={setBlocks}
              userId={userId}
              selectedItem={selectedItem}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-3">
              <Button
                onClick={() => handleAddBlock("text")}
                className="bg-violet-100 text-violet-700"
              >
                + Add Text Block
              </Button>
              <Button
                onClick={() => {}}
                className="bg-violet-100 text-violet-700"
              >
                + Add Image via Paste (Ctrl+V)
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button className="bg-violet-600 text-white px-6 py-2">
                Save Subpage
              </Button>
              <button className="text-red-500">Delete Subpage</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
