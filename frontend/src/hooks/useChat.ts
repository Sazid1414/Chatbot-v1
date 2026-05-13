"use client";

import { useState, useCallback, useRef } from "react";
import type { Message } from "@/types";
import { fetchMessages, chatStream } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";

const ERROR_PREFIX = "Sorry, something went wrong";

export function useChat(getAccessToken: () => Promise<string | null>) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const lastSendRef = useRef<{ sessionId: string; content: string } | null>(
    null
  );

  const loadMessages = useCallback(
    async (sessionId: string) => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const data = await fetchMessages(token, sessionId);
        setMessages(data);
        setCanRetry(false);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    },
    [getAccessToken]
  );

  const runStream = useCallback(
    async (
      sessionId: string,
      content: string,
      options: { appendUserBubble: boolean }
    ) => {
      const token = await getAccessToken();
      if (!token) return;

      lastSendRef.current = { sessionId, content };
      setCanRetry(false);

      if (options.appendUserBubble) {
        const userMessage: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "user",
          content,
          token_count: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

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
          let msg = `Chat failed: ${response.status}`;
          try {
            const body = await response.json();
            if (body?.detail?.message) msg = String(body.detail.message);
            else if (typeof body?.detail === "string") msg = body.detail;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
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
        const text =
          err instanceof Error ? err.message : "Something went wrong.";
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: `${ERROR_PREFIX}. ${text}`,
          token_count: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setCanRetry(true);
      } finally {
        setStreaming(false);
        setStreamingContent("");
      }
    },
    [getAccessToken]
  );

  const sendMessage = useCallback(
    async (sessionId: string, content: string) => {
      await runStream(sessionId, content, { appendUserBubble: true });
    },
    [runStream]
  );

  const retryLast = useCallback(async () => {
    const r = lastSendRef.current;
    if (!r) return;
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (
        last.role === "assistant" &&
        last.content.startsWith(ERROR_PREFIX)
      ) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    await runStream(r.sessionId, r.content, { appendUserBubble: false });
  }, [runStream]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    setCanRetry(false);
    lastSendRef.current = null;
  }, []);

  return {
    messages,
    streaming,
    streamingContent,
    loadMessages,
    sendMessage,
    retryLast,
    canRetry,
    clearMessages,
  };
}
