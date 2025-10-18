"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockList } from "@/components/block-list";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EditorProps {
  selectedItem:
    | { type: "module" | "page" | "subpage"; id: string; title: string }
    | null;
  userId: string;
}

interface Block {
  id: string;
  type: "text" | "image";
  content: any;
  position: number;
}

export function Editor({ selectedItem, userId }: EditorProps) {
  const [title, setTitle] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const trimmedTitle = title.trim();
  const titleHasChanged = trimmedTitle !== savedTitle;

  useEffect(() => {
    if (selectedItem) {
      setTitle(selectedItem.title);
      setSavedTitle(selectedItem.title);
      if (selectedItem.type === "page" || selectedItem.type === "subpage") {
        loadBlocks();
      } else {
        setBlocks([]);
      }
    } else {
      setBlocks([]);
      setTitle("");
      setSavedTitle("");
    }
  }, [selectedItem]);

  const loadBlocks = async () => {
    if (!selectedItem) return;
    if (selectedItem.type === "module") return;

    const supabase = createClient();
    const query = supabase
      .from("blocks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (selectedItem.type === "page") {
      query.eq("page_id", selectedItem.id).is("subpage_id", null);
    } else {
      query.eq("subpage_id", selectedItem.id).is("page_id", null);
    }

    const { data } = await query;
    setBlocks(data || []);
  };

  const handleUpdateTitle = async () => {
    if (!selectedItem) return;
    const nextTitle = trimmedTitle;
    if (!nextTitle || !titleHasChanged) return;

    setIsSavingTitle(true);
    const supabase = createClient();
    const table =
      selectedItem.type === "module"
        ? "modules"
        : selectedItem.type === "page"
          ? "pages"
          : "subpages";

    const { error } = await supabase
      .from(table)
      .update({ title: nextTitle })
      .eq("id", selectedItem.id);

    if (error) {
      console.error("Failed to update title", error);
    } else {
      setSavedTitle(nextTitle);
      setTitle(nextTitle);
      router.refresh();
    }
    setIsSavingTitle(false);
  };

  const handleAddTextBlock = async () => {
    if (!selectedItem || selectedItem.type === "module") return;

    const supabase = createClient();
    const newBlock = {
      type: "text" as const,
      user_id: userId,
      position: blocks.length,
      content: { text: "" },
      ...(selectedItem.type === "page"
        ? { page_id: selectedItem.id, subpage_id: null }
        : { subpage_id: selectedItem.id, page_id: null }),
    };

    const { data, error } = await supabase
      .from("blocks")
      .insert(newBlock)
      .select()
      .single();

    if (error) {
      console.error("Failed to create text block", error);
      return;
    }

    if (data) {
      setBlocks((prev) => [...prev, data]);
    }
  };

  const handleImageFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImageUpload(file);
    event.target.value = "";
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedItem || selectedItem.type === "module") return;
    setIsUploadingImage(true);
    const supabase = createClient();

    try {
      const baseInsert = {
        type: "image" as const,
        user_id: userId,
        position: blocks.length,
        content: { url: "" },
        ...(selectedItem.type === "page"
          ? { page_id: selectedItem.id, subpage_id: null }
          : { subpage_id: selectedItem.id, page_id: null }),
      };

      const { data: newBlock, error: blockError } = await supabase
        .from("blocks")
        .insert(baseInsert)
        .select()
        .single();

      if (blockError || !newBlock) {
        console.error("Failed to create image block", blockError);
        return;
      }

      const fileExt = file.name.split(".").pop() || "png";
      const storagePath = `${userId}/${newBlock.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("study-notes-assets")
        .upload(storagePath, file, {
          contentType: file.type || "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Failed to upload image to storage", uploadError);
        await supabase.from("blocks").delete().eq("id", newBlock.id);
        return;
      }

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from("study-notes-assets")
        .createSignedUrl(storagePath, 60 * 60);

      if (signedError || !signedData?.signedUrl) {
        console.error("Failed to obtain signed URL after upload", signedError);
        await supabase.from("blocks").delete().eq("id", newBlock.id);
        return;
      }
      const signedUrl = signedData.signedUrl;

      await fetch(`/api/blocks/${newBlock.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { url: signedUrl, name: file.name },
          asset_path: storagePath,
        }),
      });

      setBlocks((prev) => [
        ...prev,
        {
          ...newBlock,
          content: { url: signedUrl, name: file.name },
          asset_path: storagePath,
        },
      ]);
      router.refresh();
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!selectedItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Select a page or subpage to start editing</p>
          <p className="mt-2 text-sm">
            Create a new module from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  if (selectedItem.type === "module") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-muted/30">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Module
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateTitle();
                    if (e.key === "Escape") setTitle(savedTitle);
                  }}
                  className="w-full max-w-xl text-base"
                  placeholder="Rename module"
                />
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleUpdateTitle}
                  disabled={!trimmedTitle || !titleHasChanged || isSavingTitle}
                >
                  {isSavingTitle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save title
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add pages for this module from the sidebar. You can also rename or
              delete individual pages directly in the list.
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-muted-foreground">
          <div className="max-w-md space-y-2">
            <p className="text-base font-medium">
              Select a page within this module to start writing notes.
            </p>
            <p className="text-sm">
              Use the sidebar to create pages and subpages, then return here to
              edit their content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      <div className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 py-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedItem.type === "page" ? "Page" : "Subpage"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateTitle();
                  if (e.key === "Escape") setTitle(savedTitle);
                }}
                className="w-full max-w-xl text-base"
                placeholder="Add a title"
              />
              <Button
                size="sm"
                className="gap-2"
                onClick={handleUpdateTitle}
                disabled={!trimmedTitle || !titleHasChanged || isSavingTitle}
              >
                {isSavingTitle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save title
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Content
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleAddTextBlock}
              >
                <Type className="h-4 w-4" />
                Add text
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                Upload image
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <BlockList
            blocks={blocks}
            onBlocksChange={setBlocks}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
