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
}

export function BlockList({
  blocks,
  onBlocksChange,
  userId,
}: BlockListProps) {
  // Keep logic simple: inline update/delete handlers and minimal drag UI

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

    // Persist new positions
    for (const block of updatedBlocks) {
      await createClient()
        .from("blocks")
        .update({ position: block.position })
        .eq("id", block.id);
    }

    onBlocksChange(updatedBlocks);
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
        No content yet — add a text, image, or canvas block to begin.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block) => (
        <div key={block.id} className="">
          {block.type === "text" ? (
            <TextBlock
              block={block}
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onDelete={() => handleBlockDelete(block.id)}
            />
          ) : (
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
