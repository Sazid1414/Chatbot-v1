"use client";

import { useState, useCallback } from "react";
import type { Session } from "@/types";
import {
  fetchSessions,
  createSession,
  deleteSession as apiDeleteSession,
} from "@/lib/api";

export function useSessions(getAccessToken: () => Promise<string | null>) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchSessions(token);
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const addSession = useCallback(
    async (title?: string, modelId?: string): Promise<Session | null> => {
      const token = await getAccessToken();
      if (!token) return null;
      try {
        const session = await createSession(token, title, modelId);
        setSessions((prev) => [session, ...prev]);
        return session;
      } catch (err) {
        console.error("Failed to create session:", err);
        return null;
      }
    },
    [getAccessToken]
  );

  const removeSession = useCallback(
    async (sessionId: string) => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        await apiDeleteSession(token, sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [getAccessToken]
  );

  return { sessions, loading, loadSessions, addSession, removeSession };
}
