"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-xs font-bold text-white">
          AI
        </div>
      )}

      <div className={`group relative max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-100"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:rounded-lg prose-pre:bg-gray-900 prose-code:rounded prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:text-gray-300">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 right-0 rounded px-2 py-0.5 text-xs text-gray-500 opacity-0 transition-opacity hover:text-gray-300 group-hover:opacity-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-gray-300">
          You
        </div>
      )}
    </div>
  );
}
