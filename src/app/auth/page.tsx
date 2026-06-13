import MagicLinkForm from "@/components/MagicLinkForm";

export const metadata = {
  title: "Sign in — Morning Meeples Polls",
};

type AuthPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { next } = await searchParams;
  const destination = next ?? "/manage";

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-400">
            Enter your email and we'll send you a magic link.
          </p>
        </div>

        <div className="border rounded-xl p-6">
          <MagicLinkForm next={destination} />
        </div>
      </div>
    </main>
  );
}
