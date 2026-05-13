"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FALLBACK = [
  { id: "llama3", label: "Llama 3" },
  { id: "llama3.2", label: "Llama 3.2" },
  { id: "mistral", label: "Mistral" },
  { id: "gemma2", label: "Gemma 2" },
  { id: "phi3", label: "Phi-3" },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/models`);
        if (!res.ok) return;
        const data = await res.json();
        const ids: string[] = data.chat_models || [];
        if (cancelled || !ids.length) return;
        setModels(
          ids.map((id) => ({
            id,
            label: id.replace(/[-_]/g, " "),
          }))
        );
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.label}
        </option>
      ))}
    </select>
  );
}
