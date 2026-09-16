"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { LoginPage } from "@/components/login-page";

/**
 * Gates any data-backed page behind Supabase Auth. RLS policies on every
 * table (see supabase/schema.sql) key data off `auth.uid()`, so without a
 * signed-in session all reads/writes are rejected — this is what actually
 * gets the user to a session instead of a wall of "failed to load" errors.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : String(err));
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black dark:border-white border-t-transparent" />
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] px-4 dark:bg-[#0A0A0A]">
        <div className="max-w-md rounded-2xl border-2 border-black bg-white p-6 text-center dark:border-white dark:bg-[#121212]">
          <p className="text-sm font-bold text-black dark:text-white">Supabase isn&apos;t configured.</p>
          <p className="mt-2 text-xs text-black/60 dark:text-white/60">{configError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      {children}
      <button
        type="button"
        onClick={() => getSupabase().auth.signOut()}
        title="Sign out"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition hover:-translate-y-0.5 dark:border-white dark:bg-[#121212] dark:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </>
  );
}
