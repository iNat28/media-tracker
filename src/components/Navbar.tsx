"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/Spinner";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-5 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-xs">
            MT
          </div>
          <span className="hidden sm:inline">Media Tracker</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/movies" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Movies
          </Link>
          
          <div className="h-4 w-px bg-slate-200" />
          
          <div className="flex items-center">
            {isPending ? (
              <Spinner className="h-5 w-5" />
            ) : session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-2 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
                  id="user-menu-button"
                >
                  <span>{session.user.name}</span>
                  <svg className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link
                      href="/settings"
                      className="block rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
