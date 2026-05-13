import type { Session, Message, KnowledgeBase, ModelRegistry } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(accessToken: string): Promise<HeadersInit> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchModelRegistry(
  accessToken: string
): Promise<ModelRegistry> {
  const res = await fetch(`${API_URL}/api/models`, {
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to load model registry");
  return res.json();
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
  modelId?: string,
  knowledgeBaseId?: string | null,
  chatMode?: string
): Promise<Session> {
  const body: Record<string, unknown> = { title, model_id: modelId };
  if (knowledgeBaseId !== undefined) {
    body.knowledge_base_id = knowledgeBaseId;
  }
  if (chatMode) body.chat_mode = chatMode;
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: await getAuthHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.detail === "string"
        ? err.detail
        : JSON.stringify(err?.detail ?? "Failed to create session")
    );
  }
  return res.json();
}

export async function patchSession(
  accessToken: string,
  sessionId: string,
  patch: {
    title?: string | null;
    model_id?: string | null;
    knowledge_base_id?: string | null;
    chat_mode?: string | null;
  }
): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: await getAuthHeaders(accessToken),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.detail === "string"
        ? err.detail
        : JSON.stringify(err?.detail ?? "Failed to update session")
    );
  }
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
  const response = fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  return { response };
}

export async function fetchKnowledgeBases(
  accessToken: string
): Promise<KnowledgeBase[]> {
  const res = await fetch(`${API_URL}/api/knowledge-bases`, {
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to fetch knowledge bases");
  return res.json();
}

export async function createKnowledgeBase(
  accessToken: string,
  name: string
): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/api/knowledge-bases`, {
    method: "POST",
    headers: await getAuthHeaders(accessToken),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.detail === "object" && err?.detail?.message
        ? String(err.detail.message)
        : "Failed to create knowledge base"
    );
  }
  return res.json();
}

export async function ingestKnowledgeBase(
  accessToken: string,
  kbId: string,
  text: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/knowledge-bases/${kbId}/ingest`, {
    method: "POST",
    headers: await getAuthHeaders(accessToken),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const d = err?.detail;
    const msg =
      typeof d === "object" && d?.message
        ? String(d.message)
        : typeof d === "string"
          ? d
          : "Ingest failed";
    throw new Error(msg);
  }
}

export async function deleteKnowledgeBase(
  accessToken: string,
  kbId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/knowledge-bases/${kbId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to delete knowledge base");
}
