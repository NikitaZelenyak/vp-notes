import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudyNotesLayout } from "@/components/study-notes-layout";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: modules, error } = await supabase
    .from("modules")
    .select(
      `
      *,
      pages (
        *,
        subpages (*)
      )
    `
    )
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (error && error.message.includes("Could not find the table")) {
    redirect("/setup");
  }

  return <StudyNotesLayout modules={modules || []} userId={user.id} />;
}
