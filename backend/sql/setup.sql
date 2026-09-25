-- Laboratorio 04: pgvector + knowledge_chunks
-- embedding: vector(3072) para gemini-embedding-001
-- No crear índice HNSW: pgvector lo rechaza sobre más de 2000 dimensiones.

create extension if not exists vector;

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(3072) not null,
  created_at timestamptz not null default now(),
  unique (source, chunk_index)
);

create or replace function match_knowledge_chunks(
  query_embedding vector(3072),
  match_source text,
  match_count integer default 4
)
returns table (
  source text,
  chunk_index integer,
  content text,
  score double precision
)
language sql
stable
as $$
  select
    kc.source,
    kc.chunk_index,
    kc.content,
    (1 - (kc.embedding <=> query_embedding))::double precision as score
  from knowledge_chunks kc
  where kc.source = match_source
  order by kc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
