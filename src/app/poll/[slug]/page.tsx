import { createSupabaseServerClient } from "@/lib/supabase/server";
import UserPollVotingForm from "./UserPollVotingForm";

type UserPoll = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
};

type UserPollDate = {
  id: string;
  weekday_name: string;
  poll_date: string;
  time_slot: string | null;
  vote_count: number;
  voter_names: string[];
};

type VoteRow = {
  poll_date_id: string;
  voter_name: string | null;
};

export default async function UserPollPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: poll, error: pollError } = await supabase
    .from("user_polls")
    .select("id, title, description, is_active")
    .eq("slug", slug)
    .single<UserPoll>();

  if (pollError || !poll) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-2">
          <h1 className="text-4xl font-bold">Poll not found</h1>
          <p className="text-gray-400">
            This link may have expired or the poll doesn&apos;t exist.
          </p>
        </div>
      </main>
    );
  }

  let pollDates: UserPollDate[] = [];
  let pollDatesError: string | null = null;
  const voteCountsMap: Record<string, number> = {};
  const voterNamesMap: Record<string, string[]> = {};

  const { data: datesData, error: datesErr } = await supabase
    .from("user_poll_dates")
    .select("id, weekday_name, poll_date, time_slot")
    .eq("poll_id", poll.id)
    .order("poll_date", { ascending: true });

  if (datesErr) {
    pollDatesError = datesErr.message;
  } else if (datesData) {
    pollDates = datesData as UserPollDate[];
  }

  if (pollDates.length > 0) {
    const pollDateIds = pollDates.map((d) => d.id);

    const { data: votesData, error: votesError } = await supabase
      .from("user_votes")
      .select("poll_date_id, voter_name")
      .in("poll_date_id", pollDateIds);

    if (!votesError && votesData) {
      votesData.forEach((vote) => {
        const row = vote as VoteRow;
        voteCountsMap[row.poll_date_id] = (voteCountsMap[row.poll_date_id] || 0) + 1;
        if (!voterNamesMap[row.poll_date_id]) voterNamesMap[row.poll_date_id] = [];
        if (row.voter_name) voterNamesMap[row.poll_date_id].push(row.voter_name);
      });
    }
  }

  const pollDatesWithCounts = pollDates.map((date) => ({
    ...date,
    vote_count: voteCountsMap[date.id] || 0,
    voter_names: voterNamesMap[date.id] || [],
  }));

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-4xl font-bold">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-400">{poll.description}</p>
          )}
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          {pollDatesError && (
            <p className="text-red-500">Error loading dates: {pollDatesError}</p>
          )}

          {!pollDatesError && pollDatesWithCounts.length > 0 && (
            <UserPollVotingForm pollId={poll.id} pollDates={pollDatesWithCounts} />
          )}

          {!pollDatesError && pollDatesWithCounts.length === 0 && (
            <p className="text-gray-400">No dates available for this poll.</p>
          )}
        </div>
      </div>
    </main>
  );
}
