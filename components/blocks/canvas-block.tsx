"use client";

import { useRef, useState, useEffect } from "react";

interface CanvasBlockProps {
  block?: any;
  onUpdate: (content: any) => void;
  onDelete: () => void;
}

export default function CanvasBlock({
  block,
  onUpdate,
  onDelete,
}: CanvasBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineCap = "round";
    context.lineJoin = "round";
    setCtx(context);
    if (
      block?.asset_path &&
      typeof block.asset_path === "string" &&
      block.asset_path.startsWith("http")
    ) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => context.drawImage(img, 0, 0);
      img.src = block.asset_path;
    }
  }, [block?.asset_path]);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const exportAndUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/png")
    );
    if (!blob) return;
    const fd = new FormData();
    fd.append("file", blob, "drawing.png");
    if (block?.page_id) fd.append("page_id", block.page_id);
    if (block?.subpage_id) fd.append("subpage_id", block.subpage_id);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) {
      console.error("upload failed");
      return;
    }
    const data = await res.json();
    onUpdate(data);
  };

  return (
    <div className="border rounded-md p-2">
      <div className="flex gap-2 mb-2 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm">Size</span>
          <input
            type="range"
            min={1}
            max={40}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
        <button className="btn" onClick={clear} type="button">
          Clear
        </button>
        <button
          className="btn btn-primary"
          onClick={exportAndUpload}
          type="button"
        >
          Save
        </button>
        <button
          className="btn btn-destructive"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[400px] bg-white touch-none"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
    </div>
  );
}
