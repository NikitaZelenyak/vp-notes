"use client";
import React, { useEffect, useRef } from "react";

export default function PasteCatcher({
  onImage,
}: {
  onImage: (file: File) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (file) onImage(file);
        }
      }
    }
    const el = ref.current ?? window;
    el.addEventListener("paste", handlePaste as any);
    return () => el.removeEventListener("paste", handlePaste as any);
  }, [onImage]);

  return <div ref={ref} tabIndex={-1} />;
}
