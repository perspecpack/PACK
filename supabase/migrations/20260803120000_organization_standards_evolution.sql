-- Migration: Evolução do Módulo Padrões das Organizações (Fase 1)
-- Created At: 2026-08-03

-- 1. Create document_categories table
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.document_categories(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create document_tags table
CREATE TABLE IF NOT EXISTS public.document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add columns to public.documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS extension TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_revision_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS complementary_files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS document_code TEXT,
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- 4. Add columns to public.standards
ALTER TABLE public.standards 
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS extension TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_revision_id UUID REFERENCES public.standards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS complementary_files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS document_code TEXT,
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- 5. Add columns to public.components
ALTER TABLE public.components 
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS extension TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parent_revision_id UUID REFERENCES public.components(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS complementary_files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'Componente homologado',
ADD COLUMN IF NOT EXISTS document_code TEXT,
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revision_notes TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_code TEXT,
ADD COLUMN IF NOT EXISTS homologating_organizations TEXT[] DEFAULT '{}';

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies for new tables consistent with other modules
CREATE POLICY "Allow all actions on document_categories" ON public.document_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions on document_tags" ON public.document_tags FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. Seed the default taxonomy for document_categories
INSERT INTO public.document_categories (name, slug, sort_order) VALUES
('Estrutura', 'estrutura', 1),
('Movimentação', 'movimentacao', 2),
('Rodízios', 'rodizios', 3),
('Empilhamento', 'empilhamento', 4),
('Soldagem', 'soldagem', 5),
('Pintura', 'pintura', 6),
('Segurança', 'seguranca', 7),
('Ergonomia', 'ergonomia', 8),
('Identificação', 'identificacao', 9),
('Transporte', 'transporte', 10),
('Armazenagem', 'armazenagem', 11),
('Componentes homologados', 'componentes-homologados', 12),
('Modelos 3D', 'modelos-3d', 13),
('Documentação geral', 'documentacao-geral', 14)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
