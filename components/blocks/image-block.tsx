"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Clipboard, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface ImageBlockProps {
  block: {
    id: string;
    content: { url: string; name?: string };
  };
  onUpdate: (content: { url: string; name?: string }) => void;
  onDelete: () => void;
  userId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
}

export function ImageBlock({
  block,
  onUpdate,
  onDelete,
  userId,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
}: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const focusTargetRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${block.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("study-notes-assets")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setIsUploading(false);
      return;
    }

    // For private buckets, request a short-lived signed URL from the server
    const signedRes = await fetch(
      `/api/storage/signed?bucket=study-notes-assets&path=${encodeURIComponent(
        fileName
      )}`
    );
    if (!signedRes.ok) {
      console.error("Failed to obtain signed URL for uploaded file");
      setIsUploading(false);
      return;
    }
    const signedJson = await signedRes.json();
    const signedUrl =
      signedJson.url || signedJson.signedUrl || signedJson.signed_url;

    // Persist to server-side block row so asset_path exists for deletion later.
    try {
      // Update block with content and asset_path
      await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { url: signedUrl, name: file.name },
          asset_path: fileName,
        }),
      });
    } catch (e) {
      console.warn("Failed to PATCH block after upload", e);
    }

    onUpdate({ url: signedUrl, name: file.name });
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          uploadImage(file);
        }
      }
    }
  };

  

  return (
    <Card className="group overflow-hidden border border-border/70 bg-background/80 shadow-sm transition hover:border-primary/30 focus-within:border-primary/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Image block
        </span>
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
              await fetch(`/api/blocks/${block.id}`, { method: "DELETE" });
              onDelete();
            }}
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={focusTargetRef}
        className="space-y-4 px-3 py-4"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {block.content?.url ? (
          <>
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/40">
              <Image
                src={block.content.url || "/placeholder.svg"}
                alt={block.content.name || "Uploaded image"}
                width={1200}
                height={800}
                className="h-auto w-full object-cover"
              />
            </div>
            {block.content.name && (
              <p className="text-xs font-medium text-muted-foreground">
                {block.content.name}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace image
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => focusTargetRef.current?.focus()}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Paste image
              </Button> */}
              <span className="text-xs text-muted-foreground">
                {isUploading
                  ? "Uploading…"
                  : "Paste an image "}
              </span>
            </div>
          </>
        ) : (
          <div
            ref={dropZoneRef}
            className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/40 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-primary"
            onPaste={handlePaste}
            tabIndex={0}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isUploading ? "Uploading…" : "Drop an image or upload a file"}
              </p>
              <p className="text-xs text-muted-foreground">
                Paste directly from your clipboard to add it faster.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload image
              </Button>
              {/* <Button
                variant="outline"
                disabled={isUploading}
                onClick={() => {
                  dropZoneRef.current?.focus();
                  focusTargetRef.current?.focus();
                }}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Paste (⌘/Ctrl + V)
              </Button> */}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
