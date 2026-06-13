import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CreatePollClient from "./CreatePollClient";

export const metadata = {
  title: "Create a Poll — Morning Meeples",
};

export default async function CreatePollPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/create");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold">Create a Poll</h1>
          <p className="text-sm text-gray-400">
            Set your dates and share the voting link.
          </p>
        </div>
        <CreatePollClient ownerEmail={user.email!} ownerId={user.id} />
      </div>
    </main>
  );
}
