"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";

interface MessageFeedProps {
  messages: Message[];
  streaming: boolean;
  streamingContent: string;
}

export default function MessageFeed({
  messages,
  streaming,
  streamingContent,
}: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        <p className="text-lg font-medium">Start a conversation</p>
        <p className="text-sm">Type a message below to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streaming && streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-xs font-bold text-white">
              AI
            </div>
            <div className="max-w-[80%] rounded-2xl bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-100">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block h-4 w-1 animate-pulse bg-gray-400" />
            </div>
          </div>
        )}

        {streaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-xs font-bold text-white">
              AI
            </div>
            <div className="rounded-2xl bg-gray-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
