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
  const [isFocused, setIsFocused] = useState(false);

  const handleBlur = () => {
    setIsFocused(false);
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
    <Card className="relative p-4">
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            // call API delete then propagate
            await fetch(`/api/blocks/${block.id}`, { method: "DELETE" });
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder="Type your notes here..."
        className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0"
      />
    </Card>
  );
}
