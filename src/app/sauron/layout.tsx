import { isAdmin } from "@/lib/adminAuth";
import { logout } from "./actions";
import LoginForm from "./LoginForm";

export default async function SauronLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-3xl font-bold text-center">Admin sign in</h1>
          <LoginForm />
        </div>
      </main>
    );
  }

  return (
    <>
      <form action={logout} className="fixed top-4 right-4">
        <button type="submit" className="text-sm text-gray-500 hover:text-[var(--foreground)] transition">
          Sign out
        </button>
      </form>
      {children}
    </>
  );
}
