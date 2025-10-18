"use client";

import type React from "react";

import { useState } from "react";
import { TextBlock } from "@/components/blocks/text-block";
import { ImageBlock } from "@/components/blocks/image-block";
import { GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Block {
  id: string;
  type: "text" | "image";
  content: any;
  position: number;
}

interface BlockListProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  userId: string;
  selectedItem: { type: "page" | "subpage"; id: string };
}

export function BlockList({
  blocks,
  onBlocksChange,
  userId,
  selectedItem,
}: BlockListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(index, 0, draggedBlock);

    // Update positions
    const updatedBlocks = newBlocks.map((block, idx) => ({
      ...block,
      position: idx,
    }));

    setDraggedIndex(index);
    onBlocksChange(updatedBlocks);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Save new positions to database
    const supabase = createClient();
    const updates = blocks.map((block) => ({
      id: block.id,
      position: block.position,
    }));

    for (const update of updates) {
      await supabase
        .from("blocks")
        .update({ position: update.position })
        .eq("id", update.id);
    }

    setDraggedIndex(null);
  };

  const handleBlockUpdate = async (blockId: string, content: any) => {
    const supabase = createClient();
    await supabase.from("blocks").update({ content }).eq("id", blockId);

    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, content } : block
    );
    onBlocksChange(updatedBlocks);
  };

  const handleBlockDelete = async (blockId: string) => {
    const supabase = createClient();
    await supabase.from("blocks").delete().eq("id", blockId);

    const updatedBlocks = blocks
      .filter((block) => block.id !== blockId)
      .map((block, idx) => ({
        ...block,
        position: idx,
      }));

    // Update positions in database
    for (const block of updatedBlocks) {
      await supabase
        .from("blocks")
        .update({ position: block.position })
        .eq("id", block.id);
    }

    onBlocksChange(updatedBlocks);
  };

  if (blocks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No blocks yet. Click "Add Block" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className="group relative"
        >
          <div className="absolute -left-8 top-2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {block.type === "text" && (
            <TextBlock
              block={block}
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onDelete={() => handleBlockDelete(block.id)}
            />
          )}

          {block.type === "image" && (
            <ImageBlock
              block={block}
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onDelete={() => handleBlockDelete(block.id)}
              userId={userId}
            />
          )}
        </div>
      ))}
    </div>
  );
}
