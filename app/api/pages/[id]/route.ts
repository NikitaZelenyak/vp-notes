import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripUndefined } from "../../../../lib/sanitize";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await req.json();
  const payload = stripUndefined(body);
  const { data, error } = await supabase
    .from("pages")
    .update(payload)
    .match({ id: params.id })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pages")
    .delete()
    .match({ id: params.id });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
