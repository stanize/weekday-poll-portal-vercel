import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Morning Meeples Polls</h1>
          <p className="text-gray-400">Create polls, share them, vote on dates.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* New: Create a Poll */}
          <Link
            href="/auth?next=/create"
            className="flex flex-col gap-1 rounded-xl border px-6 py-5 text-left hover:bg-white hover:text-black transition group"
          >
            <span className="text-lg font-semibold">Create a Poll →</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-600">
              Set dates, times, and share a voting link.
            </span>
          </Link>

          {/* New: Manage My Polls */}
          <Link
            href="/auth?next=/manage"
            className="flex flex-col gap-1 rounded-xl border px-6 py-5 text-left hover:bg-white hover:text-black transition group"
          >
            <span className="text-lg font-semibold">Manage My Polls →</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-600">
              View and manage polls linked to your email.
            </span>
          </Link>
        </div>

        {/* Existing: Morning Meeples poll */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-widest">Existing poll</p>
          <ul>
            <li>
              <Link
                href="/morningmeeples"
                className="inline-block rounded-lg border px-6 py-3 font-medium hover:bg-white hover:text-black transition"
              >
                Morning Meeples Weekday Poll →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
