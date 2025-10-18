"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TextBlockProps {
  block: {
    id: string;
    content: { text: string };
  };
  onUpdate: (content: { text: string }) => void;
  onDelete: () => void;
}

export function TextBlock({ block, onUpdate, onDelete }: TextBlockProps) {
  const [text, setText] = useState(block.content?.text || "");

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
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Text block
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground transition hover:text-destructive"
          onClick={async () => {
            // call API delete then propagate
            await fetch(`/api/blocks/${block.id}`, { method: "DELETE" });
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type your notes here..."
        className="min-h-[140px] resize-none border-0 bg-transparent px-3 py-3 text-sm leading-relaxed focus-visible:ring-0"
      />
    </Card>
  );
}
