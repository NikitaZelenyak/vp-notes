import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripUndefined } from "../../../lib/sanitize";
import { uploadToStorage, getSignedUrl } from "../../../lib/storage";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const page_id = form.get("page_id") as string | null;
  const subpage_id = form.get("subpage_id") as string | null;
  const positionValue = form.get("position");
  const parsedPosition =
    typeof positionValue === "string" && positionValue.trim().length > 0
      ? Number(positionValue)
      : 0;
  const position = Number.isFinite(parsedPosition)
    ? Math.max(0, Math.floor(parsedPosition))
    : 0;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const blockId = crypto.randomUUID();
  const userId = user.id;

  // Store assets under the user's folder in the configured bucket
  const bucket = `study-notes-assets`;
  const objectPath = `${userId}/${blockId}.png`;
  const path = objectPath; // asset_path stores the path within the bucket (no bucket prefix)
  const blob = await file.arrayBuffer();
  await uploadToStorage(
    `${bucket}/${objectPath}`,
    Buffer.from(blob as any),
    file.type || "image/png"
  );

  const payload = stripUndefined({
    user_id: userId,
    page_id: page_id || null,
    subpage_id: subpage_id || null,
    type: "image",
    asset_path: objectPath,
    // For private buckets, generate a short-lived signed URL so the client can fetch the image
    content: { url: await getSignedUrl(bucket, objectPath, 60 * 60) },
    asset_width: null,
    asset_height: null,
    position,
    meta: {},
  });

  const { data, error } = await supabase
    .from("blocks")
    .insert([payload])
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
