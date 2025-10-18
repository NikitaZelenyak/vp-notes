"use client";
import React, { useEffect, useState } from "react";
import PasteCatcher from "./PasteCatcher";

export default function UnifiedEditor({
  target,
}: {
  target: { page_id?: string; subpage_id?: string };
}) {
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (target.page_id) qs.set("page_id", target.page_id);
    if (target.subpage_id) qs.set("subpage_id", target.subpage_id);
    fetch("/api/blocks?" + qs.toString())
      .then((r) => r.json())
      .then(async (rows) => {
        // For any row missing content.url but with asset_path, request a signed URL
        const rowsWithUrls = await Promise.all(
          rows.map(async (row: any) => {
            if ((row.content && row.content.url) || !row.asset_path) return row;
            try {
              const res = await fetch(
                `/api/storage/signed?bucket=study-notes-assets&path=${encodeURIComponent(
                  row.asset_path
                )}`
              );
              if (res.ok) {
                const j = await res.json();
                row.content = row.content || {};
                row.content.url = j.url;
              }
            } catch (e) {
              // ignore and leave row as-is
            }
            return row;
          })
        );
        setBlocks(rowsWithUrls);
      });
  }, [target.page_id, target.subpage_id]);

  async function addText() {
    const res = await fetch("/api/blocks", {
      method: "POST",
      body: JSON.stringify({ ...target, type: "text", text_content: "" }),
    });
    if (res.ok) {
      const d = await res.json();
      setBlocks((b) => [...b, d]);
    }
  }

  async function handlePasteImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("page_id", target.page_id || "");
    fd.append("subpage_id", target.subpage_id || "");
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      setBlocks((b) => [...b, d]);
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <div key={block.id} className="p-2 rounded">
          {block.type === "text" ? (
            <textarea defaultValue={block.text_content} className="w-full" />
          ) : block.content?.url ? (
            <img
              src={block.content.url}
              alt={block.content?.name || "asset"}
              className="max-w-full"
            />
          ) : block.asset_path ? (
            <div className="text-sm text-muted-foreground">
              Resolving asset...
            </div>
          ) : null}
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <button
          onClick={addText}
          className="px-3 py-1 rounded bg-violet-600 text-white"
        >
          Add Text
        </button>
        <button
          onClick={() => {}}
          className="px-3 py-1 rounded bg-emerald-200 text-black"
        >
          Paste Image
        </button>
      </div>

      <PasteCatcher onImage={handlePasteImage} />
    </div>
  );
}
