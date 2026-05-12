"use client";

import type { Session } from "@/types";
import SessionItem from "./SessionItem";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onSignOut: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onSignOut,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-72 flex-col bg-gray-900 transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h1 className="text-lg font-semibold text-white">Chatbot</h1>
          <button
            onClick={onToggle}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
          ))}
          {sessions.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-gray-500">
              No conversations yet
            </p>
          )}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
