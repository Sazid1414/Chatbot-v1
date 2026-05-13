export interface Session {
  id: string;
  user_id: string;
  title: string | null;
  model_id: string | null;
  knowledge_base_id: string | null;
  chat_mode: string | null;
  created_at: string;
  last_active_at: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  token_count: number | null;
  created_at: string;
}

export interface ChatStreamToken {
  token?: string;
  done?: boolean;
  error?: string;
}

export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ModelRegistry {
  chat_models: string[];
  finetuned_models: string[];
  embedding_model: string;
  chat_modes: string[];
  default_model: string;
}
