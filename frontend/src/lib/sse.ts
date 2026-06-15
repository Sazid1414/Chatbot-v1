import type { ChatStreamToken } from "@/types";

export async function* parseSSEStream(
  response: Response
): AsyncGenerator<ChatStreamToken> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const data: ChatStreamToken = JSON.parse(jsonStr);
        yield data;
      } catch {
        continue;
      }
    }
  }

  if (buffer.trim()) {
    const normalized = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (normalized.startsWith("data:")) {
      const jsonStr = normalized.slice(5).trim();
      if (jsonStr && jsonStr !== "[DONE]") {
        try {
          yield JSON.parse(jsonStr);
        } catch {
          // ignore
        }
      }
    }
  }
}
