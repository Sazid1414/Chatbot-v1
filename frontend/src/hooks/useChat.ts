"use client";

import { useState, useCallback, useRef } from "react";
import type { Message } from "@/types";
import { fetchMessages, chatStream } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";

export function useChat(getAccessToken: () => Promise<string | null>) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const data = await fetchMessages(token, sessionId);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    },
    [getAccessToken]
  );

  const sendMessage = useCallback(
    async (sessionId: string, content: string) => {
      const token = await getAccessToken();
      if (!token) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content,
        token_count: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setStreaming(true);
      setStreamingContent("");

      try {
        const { response: responsePromise } = chatStream(
          token,
          sessionId,
          content
        );
        const response = await responsePromise;

        if (!response.ok) {
          throw new Error(`Chat failed: ${response.status}`);
        }

        let fullContent = "";
        for await (const chunk of parseSSEStream(response)) {
          if (chunk.error) {
            throw new Error(chunk.error);
          }
          if (chunk.token) {
            fullContent += chunk.token;
            setStreamingContent(fullContent);
          }
          if (chunk.done) {
            break;
          }
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: fullContent,
          token_count: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Chat error:", err);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          token_count: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setStreaming(false);
        setStreamingContent("");
      }
    },
    [getAccessToken]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
  }, []);

  return {
    messages,
    streaming,
    streamingContent,
    loadMessages,
    sendMessage,
    clearMessages,
  };
}
