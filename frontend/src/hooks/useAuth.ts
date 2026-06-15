"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { isAuthDisabled } from "@/lib/authMode";
import type { User, Session } from "@supabase/supabase-js";

const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  email: "demo@local",
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
} as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (isAuthDisabled()) {
      setUser(DEMO_USER);
      setSession(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (isAuthDisabled()) {
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isAuthDisabled()) {
      return "unused";
    }
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  return { user, session, loading, signOut, getAccessToken };
}
