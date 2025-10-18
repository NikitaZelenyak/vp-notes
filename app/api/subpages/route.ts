import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripUndefined } from "../../../lib/sanitize";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("page_id");
  const supabase = await createClient();
  let query = supabase
    .from("subpages")
    .select("*")
    .order("position", { ascending: true });
  if (pageId) query = query.eq("page_id", pageId as string);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const payload = stripUndefined({
    title: body.title,
    page_id: body.page_id,
    position: body.position ?? 0,
  });
  const { data, error } = await supabase
    .from("subpages")
    .insert([payload])
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
