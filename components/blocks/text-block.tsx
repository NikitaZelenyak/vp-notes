"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TextBlockProps {
  block: {
    id: string;
    content: { text: string };
  };
  onUpdate: (content: { text: string }) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
}

export function TextBlock({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
}: TextBlockProps) {
  const [text, setText] = useState(block.content?.text || "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = (element?: HTMLTextAreaElement | null) => {
    const textarea = element ?? textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, []);

  useEffect(() => {
    const nextValue = block.content?.text || "";
    setText((prev) => {
      if (prev === nextValue) return prev;
      return nextValue;
    });
    autoResize();
  }, [block.content?.text]);

  const handleBlur = () => {
    if (text !== block.content?.text) {
      // persist to server
      fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: { text } }),
        headers: { "Content-Type": "application/json" },
      }).then(() => onUpdate({ text }));
    }
  };

  return (
    <Card className="group overflow-hidden border border-border/70 bg-background/80 shadow-sm transition hover:border-primary/30 focus-within:border-primary/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Text block</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground transition hover:text-foreground disabled:opacity-40"
            onClick={onMoveUp}
            disabled={disableMoveUp}
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground transition hover:text-foreground disabled:opacity-40"
            onClick={onMoveDown}
            disabled={disableMoveDown}
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground transition hover:text-destructive"
            onClick={async () => {
              // call API delete then propagate
              await fetch(`/api/blocks/${block.id}`, { method: "DELETE" });
              onDelete();
            }}
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          autoResize(e.currentTarget);
        }}
        onBlur={handleBlur}
        placeholder="Type your notes here..."
        className="min-h-[140px] resize-none border-0 bg-transparent px-3 py-3 text-sm leading-relaxed focus-visible:ring-0 overflow-hidden"
      />
    </Card>
  );
}
