"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import MessageFeed from "@/components/MessageFeed";
import ChatInput from "@/components/ChatInput";
import ModelSelector from "@/components/ModelSelector";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";
import { isAuthDisabled } from "@/lib/authMode";

function ChatContent() {
  const { signOut, getAccessToken } = useAuth();
  const router = useRouter();
  const {
    sessions,
    loadSessions,
    addSession,
    removeSession,
  } = useSessions(getAccessToken);
  const {
    messages,
    streaming,
    streamingContent,
    loadMessages,
    sendMessage,
    clearMessages,
  } = useChat(getAccessToken);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3");

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      loadMessages(id);
      setSidebarOpen(false);
    },
    [loadMessages]
  );

  const handleNewChat = useCallback(async () => {
    const session = await addSession(undefined, selectedModel);
    if (session) {
      setActiveSessionId(session.id);
      clearMessages();
      setSidebarOpen(false);
    }
  }, [addSession, selectedModel, clearMessages]);

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

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeSessionId) {
        const session = await addSession(undefined, selectedModel);
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
    [activeSessionId, selectedModel, addSession, sendMessage, loadSessions]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push(isAuthDisabled() ? "/chat" : "/login");
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
              onClick={() => setSidebarOpen(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-gray-300">
              {sessions.find((s) => s.id === activeSessionId)?.title || "New Chat"}
            </h2>
          </div>
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        </header>

        <MessageFeed
          messages={messages}
          streaming={streaming}
          streamingContent={streamingContent}
        />

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
