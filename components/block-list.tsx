"use client";

import { TextBlock } from "@/components/blocks/text-block";
import { ImageBlock } from "@/components/blocks/image-block";
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
  // Persist the latest ordering to the database
  const persistPositions = async (orderedBlocks: Block[]) => {
    const supabase = createClient();
    await Promise.all(
      orderedBlocks.map((block, index) =>
        supabase
          .from("blocks")
          .update({ position: index })
          .eq("id", block.id)
      )
    );
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

    const ordered = blocks
      .filter((block) => block.id !== blockId)
      .map((block, idx) => ({
        ...block,
        position: idx,
      }));

    onBlocksChange(ordered);
    await persistPositions(ordered);
  };

  const handleBlockMove = async (blockId: string, direction: "up" | "down") => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;

    const reordered = [...blocks];
    [reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ];
    const ordered = reordered.map((block, idx) => ({
      ...block,
      position: idx,
    }));

    onBlocksChange(ordered);
    await persistPositions(ordered);
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
              onMoveUp={() => handleBlockMove(block.id, "up")}
              onMoveDown={() => handleBlockMove(block.id, "down")}
              disableMoveUp={block.position === 0}
              disableMoveDown={block.position === blocks.length - 1}
            />
          ) : (
            <ImageBlock
              block={block}
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onDelete={() => handleBlockDelete(block.id)}
              userId={userId}
              onMoveUp={() => handleBlockMove(block.id, "up")}
              onMoveDown={() => handleBlockMove(block.id, "down")}
              disableMoveUp={block.position === 0}
              disableMoveDown={block.position === blocks.length - 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}
