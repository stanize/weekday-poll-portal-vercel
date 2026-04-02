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

function formatPollDate(dateString: string) {
  const date = new Date(dateString);

  const dayNumber = date.getDate();

  const monthName = date.toLocaleDateString("en-GB", {
    month: "long",
  });

  let suffix = "th";

  if (dayNumber % 10 === 1 && dayNumber !== 11) suffix = "st";
  else if (dayNumber % 10 === 2 && dayNumber !== 12) suffix = "nd";
  else if (dayNumber % 10 === 3 && dayNumber !== 13) suffix = "rd";

  return `${dayNumber}${suffix} ${monthName}`;
}

export default async function Home() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, title, description")
    .eq("slug", "board-game-afternoon")
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
      pollDates = data;
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

      if (!voterNamesMap[row.poll_date_id]) {
        voterNamesMap[row.poll_date_id] = [];
      }

      if (row.voter_name) {
        voterNamesMap[row.poll_date_id].push(row.voter_name);
      }
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
          The Morning Meeples
        </h1>

        {pollError && (
          <p className="text-red-500 text-center">
            Error loading poll: {pollError.message}
          </p>
        )}

        {poll && (
          <div className="border rounded-xl p-6 space-y-4">
            <div>
            
              
              <h3 className="text-xl font-semibold mb-3">{poll.description}</h3>
            </div>

            <div>
              

              {pollDatesError && (
                <p className="text-red-500">
                  Error loading dates: {pollDatesError}
                </p>
              )}

              {!pollDatesError && pollDatesWithCounts.length > 0 && (
                <PollVotingForm
                  pollId={poll.id}
                  pollDates={pollDatesWithCounts}
                  />
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