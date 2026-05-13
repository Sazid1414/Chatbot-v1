-- Phase 6: RAG tables, pgvector, session columns, similarity RPC
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).
-- Prerequisites: `ollama pull nomic-embed-text` (or match embedding_model in model_registry.yaml / dimensions below).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(768) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS knowledge_base_id uuid REFERENCES public.knowledge_bases (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chat_mode text NOT NULL DEFAULT 'base';

ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kb_own" ON public.knowledge_bases;
CREATE POLICY "kb_own" ON public.knowledge_bases
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chunks_own" ON public.chunks;
CREATE POLICY "chunks_own" ON public.chunks
  FOR ALL USING (
    knowledge_base_id IN (SELECT id FROM public.knowledge_bases WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON public.chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_count int,
  filter_kb_id uuid
)
RETURNS TABLE (id uuid, content text, similarity double precision)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.content,
    (1 - (c.embedding <=> query_embedding))::double precision AS similarity
  FROM public.chunks c
  WHERE c.knowledge_base_id = filter_kb_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_chunks(vector(768), int, uuid) TO anon, authenticated, service_role;

-- Fine-tuning (Phase 6): train LoRA → export merged weights → convert to GGUF (e.g. llama.cpp convert)
-- → create Ollama Modelfile FROM ./model.gguf → `ollama create my-ft -f Modelfile` → register under
-- `finetuned_models` in backend/app/model_registry.yaml.
