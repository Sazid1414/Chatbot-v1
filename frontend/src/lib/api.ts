import type { Session, Message } from "@/types";
import { isAuthDisabled } from "@/lib/authMode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(accessToken: string): Promise<HeadersInit> {
  if (isAuthDisabled()) {
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchSessions(accessToken: string): Promise<Session[]> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function createSession(
  accessToken: string,
  title?: string,
  modelId?: string
): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: await getAuthHeaders(accessToken),
    body: JSON.stringify({ title, model_id: modelId }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function deleteSession(
  accessToken: string,
  sessionId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to delete session");
}

export async function fetchMessages(
  accessToken: string,
  sessionId: string
): Promise<Message[]> {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, {
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export function chatStream(
  accessToken: string,
  sessionId: string,
  message: string
): { response: Promise<Response> } {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!isAuthDisabled()) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  return { response };
}
