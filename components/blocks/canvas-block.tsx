"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, Save, Trash2 } from "lucide-react";

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
    <Card className="group overflow-hidden border border-border/70 bg-background/80 shadow-sm transition hover:border-primary/30 focus-within:border-primary/40">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Canvas block
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground transition hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 px-3 py-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            <span>Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-border/60 bg-transparent"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Brush</span>
            <input
              type="range"
              min={1}
              max={40}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="h-1.5 w-32 accent-primary"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={clear}
              className="gap-2"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={exportAndUpload}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
          <canvas
            ref={canvasRef}
            className="h-[400px] w-full touch-none"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
      </div>
    </Card>
  );
}
