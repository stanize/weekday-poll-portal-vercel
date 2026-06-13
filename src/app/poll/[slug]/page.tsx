import type { Metadata } from "next";
import Link from "next/link";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: poll } = await supabase
    .from("user_polls")
    .select("title, description")
    .eq("slug", slug)
    .single<{ title: string; description: string | null }>();

  if (!poll) {
    return { title: "Boardgames Meeples Poll" };
  }

  return {
    title: poll.title,
    description: poll.description ?? undefined,
  };
}

function ManageLink() {
  return (
    <Link
      href="/auth?next=/manage"
      className="fixed top-4 right-4 p-2 text-gray-600 hover:text-white transition rounded-lg hover:bg-white/10"
      title="Manage my polls"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Link>
  );
}

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
      <>
        <ManageLink />
        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl w-full text-center space-y-2">
            <h1 className="text-4xl font-bold">Poll not found</h1>
            <p className="text-gray-400">
              This link may have expired or the poll doesn&apos;t exist.
            </p>
          </div>
        </main>
      </>
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
    <>
      <ManageLink />
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
    </>
  );
}
