import { supabase } from "@/lib/supabase/client";

function getUpcomingMonday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7; // always the *next* Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday;
}

function getWeekdays(monday: Date) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const poll_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { weekday_name: name, poll_date };
  });
}

export async function resetWeeklyPoll() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id")
    .eq("slug", "morningmeeples")
    .single();

  if (pollError || !poll) throw new Error("morningmeeples poll not found");

  const { data: existingDates } = await supabase
    .from("poll_dates")
    .select("id")
    .eq("poll_id", poll.id);

  const existingIds = (existingDates ?? []).map((d) => d.id);

  if (existingIds.length > 0) {
    const { error: votesError } = await supabase
      .from("votes")
      .delete()
      .in("poll_date_id", existingIds);
    if (votesError) throw new Error(`Error deleting votes: ${votesError.message}`);

    const { error: datesError } = await supabase
      .from("poll_dates")
      .delete()
      .eq("poll_id", poll.id);
    if (datesError) throw new Error(`Error deleting dates: ${datesError.message}`);
  }

  const monday = getUpcomingMonday();
  const rows = getWeekdays(monday).map((d) => ({ poll_id: poll.id, ...d }));

  const { error: insertError } = await supabase.from("poll_dates").insert(rows);
  if (insertError) throw new Error(`Error inserting dates: ${insertError.message}`);

  return { weekOf: monday.toISOString().slice(0, 10) };
}
