import { supabase } from "@/lib/supabase/client";
import PollVotingForm from "@/components/PollVotingForm";

type Poll = {
  id: string;
  title: string;
  description: string | null;
};

type PollDate = {
  id: string;
  weekday_name: string;
  poll_date: string;
  vote_count: number;
  voter_names: string[];
};

type VoteRow = {
  poll_date_id: string;
  voter_name: string | null;
};

export default async function PollPage({
  params,
}: {
  params: { slug: string };
}) {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, title, description")
    .eq("slug", params.slug)
    .single<Poll>();

  let pollDates: PollDate[] = [];
  let pollDatesError: string | null = null;
  let voteCountsMap: Record<string, number> = {};
  let voterNamesMap: Record<string, string[]> = {};

  if (poll) {
    const { data, error } = await supabase
      .from("poll_dates")
      .select("id, weekday_name, poll_date")
      .eq("poll_id", poll.id)
      .order("poll_date", { ascending: true });

    if (error) {
      pollDatesError = error.message;
    } else if (data) {
      pollDates = data as any[];
    }

    const pollDateIds = pollDates.map((d) => d.id);

    const { data: votesData, error: votesError } = await supabase
      .from("votes")
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
        <h1 className="text-4xl font-bold mb-8 text-center">
          Weekday Poll Portal
        </h1>

        {pollError && (
          <p className="text-red-500 text-center">Poll not found.</p>
        )}

        {poll && (
          <div className="border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">{poll.title}</h2>
              <p className="text-gray-300 mt-2">{poll.description}</p>
            </div>

            <div>
              {pollDatesError && (
                <p className="text-red-500">Error loading dates: {pollDatesError}</p>
              )}

              {!pollDatesError && pollDatesWithCounts.length > 0 && (
                <PollVotingForm pollId={poll.id} pollDates={pollDatesWithCounts} />
              )}

              {!pollDatesError && pollDatesWithCounts.length === 0 && (
                <p>No dates found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
