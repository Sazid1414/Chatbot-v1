"use client";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

const MODELS = [
  { id: "llama3", label: "Llama 3" },
  { id: "llama3.2", label: "Llama 3.2" },
  { id: "mistral", label: "Mistral" },
  { id: "gemma2", label: "Gemma 2" },
  { id: "phi3", label: "Phi-3" },
];

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
    >
      {MODELS.map((model) => (
        <option key={model.id} value={model.id}>
          {model.label}
        </option>
      ))}
    </select>
  );
}
