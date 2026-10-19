import { supabase } from "@/lib/supabase/client";
import SauronTabs from "./SauronTabs";

export const metadata = {
  title: "Sauron is watching! 👁️",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: poll } = await supabase
    .from("polls")
    .select("id, title, description, slug")
    .eq("slug", "morningmeeples")
    .single();

  const { data: heavyPoll } = await supabase
    .from("heavy_polls")
    .select("id, title, start_date, end_date")
    .eq("slug", "heavy-games-poll")
    .maybeSingle();

  const { count: heavyVoteCount } = heavyPoll
    ? await supabase
        .from("heavy_votes")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", heavyPoll.id)
    : { count: 0 };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-4xl font-bold text-center">Admin Panel</h1>
        <SauronTabs poll={poll} heavyPoll={heavyPoll} heavyVoteCount={heavyVoteCount ?? 0} />
      </div>
    </main>
  );
}
