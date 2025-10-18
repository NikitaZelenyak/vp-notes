import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripUndefined } from "../../../lib/sanitize";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const moduleId = url.searchParams.get("module_id");
  const supabase = await createClient();
  let query = supabase
    .from("pages")
    .select("*")
    .order("position", { ascending: true });
  if (moduleId) query = query.eq("module_id", moduleId as string);
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
    module_id: body.module_id,
    position: body.position ?? 0,
  });
  const { data, error } = await supabase
    .from("pages")
    .insert([payload])
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
