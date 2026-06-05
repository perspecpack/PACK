-- Adicionar a coluna technical_area_id referenciando technical_areas(id)
ALTER TABLE public.standards ADD COLUMN technical_area_id uuid REFERENCES public.technical_areas(id) ON DELETE CASCADE;
