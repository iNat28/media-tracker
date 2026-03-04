"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
              Unified Tracker
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              Track what you are watching
            </h1>
          </div>
          {session && (
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900">{session.user.name}</p>
            </div>
          )}
        </div>
        
        <p className="mt-4 text-base text-slate-600">
          Start with movies and TV. Search a sample catalog and add titles to
          your personal list.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/movies"
            className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open Movie Tracker
          </Link>
          
          {isPending ? (
            <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-100"></div>
          ) : session ? (
            <button
              onClick={handleLogout}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign In
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
