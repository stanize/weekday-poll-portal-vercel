"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import DateGeneratorForm from "@/components/DateGeneratorForm";
import { GeneratedDate } from "@/lib/generateDates";

type Step = "details" | "dates" | "preview" | "done";

type CreatePollClientProps = {
  ownerEmail: string;
  ownerId: string;
};

function generateSlug() {
  return Math.random().toString(36).substring(2, 10);
}

export default function CreatePollClient({ ownerEmail, ownerId }: CreatePollClientProps) {
  const [step, setStep] = useState<Step>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slugMode, setSlugMode] = useState<"auto" | "custom">("auto");
  const [customSlug, setCustomSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [generatedDates, setGeneratedDates] = useState<GeneratedDate[]>([]);
  const [finalDates, setFinalDates] = useState<GeneratedDate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pollUrl, setPollUrl] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function validateSlug(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_polls")
      .select("id")
      .eq("slug", slug)
      .single();
    return !data;
  }

  function handleDetailsNext() {
    if (!title.trim()) {
      setError("Please enter a poll title.");
      return;
    }
    if (slugMode === "custom" && !customSlug.trim()) {
      setError("Please enter a custom URL or switch to auto-generate.");
      return;
    }
    setError("");
    setStep("dates");
  }

  function handleDatesGenerated(dates: GeneratedDate[]) {
    setGeneratedDates(dates);
    setFinalDates(dates);
    setStep("preview");
  }

  function removeDate(pollDate: string) {
    setFinalDates((prev) => prev.filter((d) => d.poll_date !== pollDate));
  }

  function updateTimeSlot(pollDate: string, timeSlot: string) {
    setFinalDates((prev) =>
      prev.map((d) => (d.poll_date === pollDate ? { ...d, time_slot: timeSlot } : d))
    );
  }

  async function handleSubmit() {
    if (finalDates.length === 0) {
      setError("Please keep at least one date.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const slug =
        slugMode === "auto" ? generateSlug() : customSlug.trim().toLowerCase();

      const isAvailable = await validateSlug(slug);
      if (!isAvailable) {
        setSlugError("This URL is already taken. Please choose another.");
        setStep("details");
        setIsSubmitting(false);
        return;
      }

      const { data: poll, error: pollError } = await supabase
        .from("user_polls")
        .insert({
          owner_id: ownerId,
          owner_email: ownerEmail,
          title: title.trim(),
          description: description.trim() || null,
          slug,
          is_active: true,
        })
        .select("id")
        .single();

      if (pollError || !poll) throw new Error(pollError?.message ?? "Failed to create poll.");

      const rows = finalDates.map((d) => ({
        poll_id: poll.id,
        weekday_name: d.weekday_name,
        poll_date: d.poll_date,
        time_slot: d.time_slot ?? null,
      }));

      const { error: datesError } = await supabase
        .from("user_poll_dates")
        .insert(rows);

      if (datesError) {
        await supabase.from("user_polls").delete().eq("id", poll.id);
        throw new Error(datesError.message);
      }

      setPollUrl(`${window.location.origin}/poll/${slug}`);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step: Details ──────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="border rounded-xl p-6 space-y-5">
        <h2 className="text-xl font-semibold">Step 1 — Poll details</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Title (required)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            placeholder="e.g. June Boardgame Night"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-transparent"
            placeholder="Any extra info for voters"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Voting page URL</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSlugMode("auto")}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                slugMode === "auto" ? "bg-white text-black" : "hover:bg-white hover:text-black"
              }`}
            >
              Auto-generate
            </button>
            <button
              type="button"
              onClick={() => setSlugMode("custom")}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                slugMode === "custom" ? "bg-white text-black" : "hover:bg-white hover:text-black"
              }`}
            >
              Custom
            </button>
          </div>

          {slugMode === "custom" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/poll/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => {
                  setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setSlugError("");
                }}
                className="flex-1 rounded-lg border px-3 py-2 bg-transparent"
                placeholder="my-poll-name"
              />
            </div>
          )}
          {slugError && <p className="text-sm text-red-400">{slugError}</p>}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleDetailsNext}
          className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition"
        >
          Next: Set dates →
        </button>
      </div>
    );
  }

  // ── Step: Dates ────────────────────────────────────────────
  if (step === "dates") {
    return (
      <div className="border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold">Step 2 — Dates & times</h2>
        </div>
        <DateGeneratorForm onDatesGenerated={handleDatesGenerated} />
      </div>
    );
  }

  // ── Step: Preview ──────────────────────────────────────────
  if (step === "preview") {
    return (
      <div className="border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("dates")}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold">Step 3 — Preview & confirm</h2>
        </div>

        <p className="text-sm text-gray-400">
          {finalDates.length} date{finalDates.length === 1 ? "" : "s"} — remove
          any you don't want, adjust times if needed.
        </p>

        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {finalDates.map((d) => (
            <li
              key={d.poll_date}
              className="flex items-center gap-3 border rounded-lg px-4 py-2"
            >
              <span className="flex-1 text-sm">
                {d.weekday_name}, {d.poll_date}
              </span>
              <input
                type="time"
                value={d.time_slot ?? ""}
                onChange={(e) => updateTimeSlot(d.poll_date, e.target.value)}
                className="rounded border px-2 py-1 bg-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => removeDate(d.poll_date)}
                className="text-red-400 hover:text-red-300 text-sm transition"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || finalDates.length === 0}
          className="rounded-lg border px-4 py-2 font-medium hover:bg-white hover:text-black transition disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create poll →"}
        </button>
      </div>
    );
  }

  // ── Step: Done ─────────────────────────────────────────────
  return (
    <div className="border rounded-xl p-6 space-y-5 text-center">
      <h2 className="text-2xl font-semibold">Poll created!</h2>
      <p className="text-sm text-gray-400">Share this link with your group:</p>
      <div className="flex items-center gap-2 border rounded-lg px-4 py-3">
        <span className="flex-1 text-left text-sm break-all">{pollUrl}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(pollUrl)}
          className="text-sm text-gray-400 hover:text-white transition whitespace-nowrap"
        >
          Copy
        </button>
      </div>
      <div className="flex gap-3 justify-center pt-2">
        <a
          href={pollUrl}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white hover:text-black transition"
        >
          View voting page →
        </a>
        <a
          href="/manage"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white hover:text-black transition"
        >
          Manage my polls →
        </a>
      </div>
    </div>
  );
}
