import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-4">
        <h1 className="text-4xl font-bold">Morning Meeples Polls</h1>
        <p className="text-gray-400">Select a poll to get started.</p>
        <ul className="space-y-2">
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
    </main>
  );
}
