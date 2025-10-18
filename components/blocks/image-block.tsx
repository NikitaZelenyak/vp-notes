"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Clipboard } from "lucide-react";
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
}

export function ImageBlock({
  block,
  onUpdate,
  onDelete,
  userId,
}: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <Card className="relative p-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {block.content?.url ? (
        <div className="relative">
          <Image
            src={block.content.url || "/placeholder.svg"}
            alt={block.content.name || "Uploaded image"}
            width={800}
            height={600}
            className="h-auto w-full rounded"
          />
          {block.content.name && (
            <p className="mt-2 text-sm text-muted-foreground">
              {block.content.name}
            </p>
          )}
        </div>
      ) : (
        <div
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded border-2 border-dashed"
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

          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {isUploading ? "Uploading..." : "Add an image to this block"}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button variant="outline" disabled={isUploading}>
                <Clipboard className="mr-2 h-4 w-4" />
                Paste (Ctrl+V)
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
