"use client";

import type { Session } from "@/types";

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionItemProps) {
  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isActive
          ? "bg-gray-700 text-white"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <svg
        className="h-4 w-4 shrink-0 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
      <span className="flex-1 truncate">
        {session.title || "New chat"}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        className="shrink-0 rounded p-1 text-gray-500 opacity-0 transition-opacity hover:bg-gray-600 hover:text-red-400 group-hover:opacity-100"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </button>
  );
}
