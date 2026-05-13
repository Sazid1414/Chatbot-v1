export interface Session {
  id: string;
  user_id: string;
  title: string | null;
  model_id: string | null;
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
  full_response?: string;
}
