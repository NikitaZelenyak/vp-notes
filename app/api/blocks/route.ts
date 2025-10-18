import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripUndefined } from "../../../lib/sanitize";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("page_id");
  const subpageId = url.searchParams.get("subpage_id");
  const supabase = await createClient();
  let query = supabase
    .from("blocks")
    .select("*")
    .order("position", { ascending: true });
  if (pageId) query = query.eq("page_id", pageId as string);
  if (subpageId) query = query.eq("subpage_id", subpageId as string);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const payload = stripUndefined({
    user_id: body.user_id,
    page_id: body.page_id,
    subpage_id: body.subpage_id,
    type: body.type,
    text_content: body.text_content,
    asset_path: body.asset_path,
    asset_width: body.asset_width,
    asset_height: body.asset_height,
    position: body.position ?? 0,
    meta: body.meta ?? {},
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
