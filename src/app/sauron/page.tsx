import { supabase } from "@/lib/supabase/client";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const { data: poll } = await supabase
    .from("polls")
    .select("id, title, description, slug")
    .eq("slug", "morningmeeples")
    .single();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-4xl font-bold text-center">Admin Panel</h1>
        <AdminPanel poll={poll} />
      </div>
    </main>
  );
}
