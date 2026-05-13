"use client";

import { useState } from "react";
import type { KnowledgeBase } from "@/types";

interface RagToolbarProps {
  knowledgeBases: KnowledgeBase[];
  selectedKbId: string | null;
  onKbChange: (id: string | null) => void;
  chatMode: string;
  onChatModeChange: (mode: string) => void;
  onCreateKb: (name: string) => Promise<void>;
  onIngest: (kbId: string, text: string) => Promise<void>;
  disabled?: boolean;
}

export default function RagToolbar({
  knowledgeBases,
  selectedKbId,
  onKbChange,
  chatMode,
  onChatModeChange,
  onCreateKb,
  onIngest,
  disabled,
}: RagToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [ingestText, setIngestText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    const n = newName.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      await onCreateKb(n);
      setNewName("");
    } finally {
      setBusy(false);
    }
  };

  const handleIngest = async () => {
    const t = ingestText.trim();
    if (!selectedKbId || !t || busy) return;
    setBusy(true);
    try {
      await onIngest(selectedKbId, t);
      setIngestText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-gray-800 bg-gray-900/80">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <label className="text-xs text-gray-500">Mode</label>
        <select
          value={chatMode}
          onChange={(e) => onChatModeChange(e.target.value)}
          disabled={disabled}
          className="rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
        >
          <option value="base">Base</option>
          <option value="rag">RAG</option>
          <option value="finetuned">Finetuned</option>
        </select>

        <label className="ml-2 text-xs text-gray-500">Knowledge</label>
        <select
          value={selectedKbId ?? ""}
          onChange={(e) =>
            onKbChange(e.target.value ? e.target.value : null)
          }
          disabled={disabled}
          className="max-w-[140px] rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
        >
          <option value="">None</option>
          {knowledgeBases.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="ml-auto text-xs text-blue-400 hover:text-blue-300"
        >
          {expanded ? "Hide KB tools" : "KB ingest"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-gray-800 px-4 py-3">
          <div className="flex flex-wrap items-end gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New knowledge base name"
              className="min-w-[160px] flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || !newName.trim()}
              className="rounded bg-gray-700 px-3 py-1.5 text-xs text-white hover:bg-gray-600 disabled:opacity-40"
            >
              Create
            </button>
          </div>
          <div>
            <textarea
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="Paste text to chunk, embed, and add to the selected knowledge base…"
              rows={4}
              className="w-full rounded border border-gray-700 bg-gray-950 px-2 py-2 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleIngest}
              disabled={busy || !selectedKbId || !ingestText.trim()}
              className="mt-2 rounded bg-purple-700 px-3 py-1.5 text-xs text-white hover:bg-purple-600 disabled:opacity-40"
            >
              Ingest to selected KB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
