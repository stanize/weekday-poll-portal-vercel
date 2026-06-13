import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CopyLinkButton from "./CopyLinkButton";

export const metadata = {
  title: "My Polls — Morning Meeples",
};

type UserPoll = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_active: boolean;
  created_at: string;
};

export default async function ManagePollsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/manage");
  }

  const { data: polls, error } = await supabase
    .from("user_polls")
    .select("id, title, description, slug, is_active, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold">My Polls</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <Link
            href="/create"
            className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition"
          >
            New poll →
          </Link>
        </div>

        {error && (
          <div className="border rounded-xl p-6">
            <p className="text-red-400 text-sm">
              Error loading polls: {error.message}
            </p>
          </div>
        )}

        {!error && (!polls || polls.length === 0) && (
          <div className="border rounded-xl p-6 text-center space-y-3">
            <p className="text-gray-400">You haven&apos;t created any polls yet.</p>
            <Link
              href="/create"
              className="inline-block rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition"
            >
              Create your first poll →
            </Link>
          </div>
        )}

        {!error && polls && polls.length > 0 && (
          <ul className="space-y-3">
            {(polls as UserPoll[]).map((poll) => {
              const votingUrl = `/poll/${poll.slug}`;
              const created = new Date(poll.created_at).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "long", year: "numeric" }
              );

              return (
                <li key={poll.id} className="border rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold truncate">{poll.title}</p>
                      {poll.description && (
                        <p className="text-sm text-gray-400 truncate">
                          {poll.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">Created {created}</p>
                    </div>
                    {!poll.is_active && (
                      <span className="shrink-0 text-xs border border-gray-700 text-gray-500 rounded px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={votingUrl}
                      className="text-sm rounded-lg border px-3 py-1.5 hover:bg-white hover:text-black transition"
                    >
                      View voting page →
                    </Link>
                    <CopyLinkButton url={votingUrl} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
