import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripUndefined } from "../../../../lib/sanitize";
import { deleteFromStorage } from "../../../../lib/storage";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const payload = stripUndefined(body);
  const { data, error } = await supabase
    .from("blocks")
    .update(payload)
    .match({ id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: block } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", id)
    .single();
  if (block?.asset_path) {
    try {
      await deleteFromStorage(block.asset_path);
    } catch (e) {
      // ignore storage deletion errors
    }
  }
  const { error } = await supabase.from("blocks").delete().match({ id });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
