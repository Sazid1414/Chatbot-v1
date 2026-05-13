"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import MessageFeed from "@/components/MessageFeed";
import ChatInput from "@/components/ChatInput";
import ModelSelector from "@/components/ModelSelector";
import RagToolbar from "@/components/RagToolbar";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";
import type { KnowledgeBase } from "@/types";
import {
  fetchKnowledgeBases,
  createKnowledgeBase,
  ingestKnowledgeBase,
  patchSession,
} from "@/lib/api";

function ChatContent() {
  const { signOut, getAccessToken } = useAuth();
  const router = useRouter();
  const {
    sessions,
    loadSessions,
    addSession,
    removeSession,
    updateSessionLocal,
  } = useSessions(getAccessToken);
  const {
    messages,
    streaming,
    streamingContent,
    loadMessages,
    sendMessage,
    retryLast,
    canRetry,
    clearMessages,
  } = useChat(getAccessToken);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [chatMode, setChatMode] = useState("base");
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const refreshKnowledgeBases = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const list = await fetchKnowledgeBases(token);
      setKnowledgeBases(list);
    } catch {
      setKnowledgeBases([]);
    }
  }, [getAccessToken]);

  useEffect(() => {
    refreshKnowledgeBases();
  }, [refreshKnowledgeBases]);

  useEffect(() => {
    if (!activeSessionId) return;
    const s = sessions.find((x) => x.id === activeSessionId);
    if (!s) return;
    setSelectedModel(s.model_id || "llama3");
    setChatMode(s.chat_mode || "base");
    setSelectedKbId(s.knowledge_base_id ?? null);
  }, [activeSessionId, sessions]);

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      loadMessages(id);
      setSidebarOpen(false);
    },
    [loadMessages]
  );

  const handleNewChat = useCallback(async () => {
    const session = await addSession(
      undefined,
      selectedModel,
      selectedKbId,
      chatMode
    );
    if (session) {
      setActiveSessionId(session.id);
      clearMessages();
      setSidebarOpen(false);
    }
  }, [addSession, selectedModel, selectedKbId, chatMode, clearMessages]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await removeSession(id);
      if (activeSessionId === id) {
        setActiveSessionId(null);
        clearMessages();
      }
    },
    [removeSession, activeSessionId, clearMessages]
  );

  const patchActiveSession = useCallback(
    async (patch: Parameters<typeof patchSession>[2]) => {
      if (!activeSessionId) return;
      const token = await getAccessToken();
      if (!token) return;
      try {
        const updated = await patchSession(token, activeSessionId, patch);
        updateSessionLocal(updated);
      } catch (e) {
        console.error(e);
      }
    },
    [activeSessionId, getAccessToken, updateSessionLocal]
  );

  const handleModelChange = useCallback(
    async (m: string) => {
      setSelectedModel(m);
      await patchActiveSession({ model_id: m });
    },
    [patchActiveSession]
  );

  const handleChatModeChange = useCallback(
    async (mode: string) => {
      setChatMode(mode);
      await patchActiveSession({ chat_mode: mode });
    },
    [patchActiveSession]
  );

  const handleKbChange = useCallback(
    async (id: string | null) => {
      setSelectedKbId(id);
      await patchActiveSession({ knowledge_base_id: id });
    },
    [patchActiveSession]
  );

  const handleCreateKb = useCallback(
    async (name: string) => {
      const token = await getAccessToken();
      if (!token) return;
      const kb = await createKnowledgeBase(token, name);
      setKnowledgeBases((prev) => [kb, ...prev]);
    },
    [getAccessToken]
  );

  const handleIngest = useCallback(
    async (kbId: string, text: string) => {
      const token = await getAccessToken();
      if (!token) return;
      await ingestKnowledgeBase(token, kbId, text);
    },
    [getAccessToken]
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeSessionId) {
        const session = await addSession(
          undefined,
          selectedModel,
          selectedKbId,
          chatMode
        );
        if (session) {
          setActiveSessionId(session.id);
          await sendMessage(session.id, content);
          loadSessions();
        }
      } else {
        await sendMessage(activeSessionId, content);
        loadSessions();
      }
    },
    [
      activeSessionId,
      selectedModel,
      selectedKbId,
      chatMode,
      addSession,
      sendMessage,
      loadSessions,
    ]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/login");
  }, [signOut, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-gray-300">
              {sessions.find((s) => s.id === activeSessionId)?.title ||
                "New Chat"}
            </h2>
          </div>
          <ModelSelector value={selectedModel} onChange={handleModelChange} />
        </header>

        <RagToolbar
          knowledgeBases={knowledgeBases}
          selectedKbId={selectedKbId}
          onKbChange={(id) => void handleKbChange(id)}
          chatMode={chatMode}
          onChatModeChange={(m) => void handleChatModeChange(m)}
          onCreateKb={handleCreateKb}
          onIngest={handleIngest}
          disabled={streaming}
        />

        <MessageFeed
          messages={messages}
          streaming={streaming}
          streamingContent={streamingContent}
        />

        {canRetry && (
          <div className="flex justify-center border-t border-amber-900/30 bg-amber-950/20 py-2">
            <button
              type="button"
              onClick={() => void retryLast()}
              className="text-sm font-medium text-amber-200 underline decoration-amber-400/60 hover:text-amber-100"
            >
              Retry last message
            </button>
          </div>
        )}

        <ChatInput onSend={handleSend} disabled={streaming} />
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}
