-- ============================================================
-- PERSPECPACK Knowledge Base — Tabela knowledge_units
-- Migration: 20260804000000
-- Estratégia: adição não-destrutiva. Tabelas existentes intactas.
-- ============================================================

-- 1. Tabela principal de Unidades de Conhecimento
CREATE TABLE IF NOT EXISTS public.knowledge_units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  technical_area_id   UUID REFERENCES public.technical_areas(id) ON DELETE SET NULL,

  -- Classificação
  unit_type           TEXT NOT NULL CHECK (unit_type IN (
                        'document', 'standard', 'component', 'project'
                      )),
  subtype             TEXT,

  -- Identificação e conteúdo
  title               TEXT NOT NULL,
  description         TEXT,
  revision            TEXT NOT NULL DEFAULT 'A',
  document_code       TEXT,
  reference_norm      TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),

  -- Arquivo principal (ponteiros apenas — sem conteúdo)
  storage_folder      TEXT,
  primary_file_url    TEXT,
  primary_file_name   TEXT,
  primary_mime_type   TEXT,
  primary_file_size   BIGINT,
  primary_file_hash   TEXT,

  -- Arquivo de conhecimento estruturado (knowledge.json no Storage)
  knowledge_file_url  TEXT,
  knowledge_status    TEXT NOT NULL DEFAULT 'pending'
                        CHECK (knowledge_status IN (
                          'pending', 'processing', 'ready', 'failed', 'skipped'
                        )),

  -- Miniatura
  thumbnail_url       TEXT,

  -- Arquivos secundários (JSONB mínimo: apenas metadados, sem conteúdo)
  -- Estrutura de cada item:
  -- { "role": "step|dwg|dxf|image|annex|pdf", "url", "name", "size", "mime", "hash" }
  secondary_files     JSONB NOT NULL DEFAULT '[]',

  -- Rastreabilidade
  uploaded_by         UUID REFERENCES auth.users(id),
  published_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_ku_org_id
  ON public.knowledge_units (organization_id);

CREATE INDEX IF NOT EXISTS idx_ku_tech_area
  ON public.knowledge_units (technical_area_id);

CREATE INDEX IF NOT EXISTS idx_ku_type_org
  ON public.knowledge_units (unit_type, organization_id);

CREATE INDEX IF NOT EXISTS idx_ku_knowledge_status
  ON public.knowledge_units (knowledge_status);

CREATE INDEX IF NOT EXISTS idx_ku_hash
  ON public.knowledge_units (primary_file_hash)
  WHERE primary_file_hash IS NOT NULL;

-- Índice full-text para pesquisa por metadados (português)
CREATE INDEX IF NOT EXISTS idx_ku_fts
  ON public.knowledge_units
  USING GIN (
    to_tsvector('portuguese',
      title || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(document_code, '') || ' ' ||
      COALESCE(reference_norm, '') || ' ' ||
      COALESCE(subtype, '')
    )
  );

-- 3. Row Level Security
ALTER TABLE public.knowledge_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on knowledge_units"
  ON public.knowledge_units
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. Novos buckets de storage
INSERT INTO storage.buckets (id, name, public)
  VALUES ('knowledge-primary', 'knowledge-primary', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('knowledge-assets', 'knowledge-assets', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('knowledge-thumbnails', 'knowledge-thumbnails', true)
  ON CONFLICT (id) DO NOTHING;
