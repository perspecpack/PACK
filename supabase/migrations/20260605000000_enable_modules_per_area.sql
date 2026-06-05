-- Adicionar a coluna technical_area_id referenciando technical_areas(id)
ALTER TABLE public.organization_modules ADD COLUMN technical_area_id uuid REFERENCES public.technical_areas(id) ON DELETE CASCADE;

-- Remover a constraint antiga
ALTER TABLE public.organization_modules DROP CONSTRAINT IF EXISTS organization_modules_organization_id_module_type_key;

-- Replicar os módulos existentes para cada uma das áreas técnicas da mesma organização
INSERT INTO public.organization_modules (organization_id, technical_area_id, module_type, enabled)
SELECT om.organization_id, ta.id AS technical_area_id, om.module_type, om.enabled
FROM public.organization_modules om
JOIN public.technical_areas ta ON ta.organization_id = om.organization_id
WHERE om.technical_area_id IS NULL;

-- Remover os registros antigos onde technical_area_id é nulo
DELETE FROM public.organization_modules WHERE technical_area_id IS NULL;

-- Definir a coluna technical_area_id como NOT NULL
ALTER TABLE public.organization_modules ALTER COLUMN technical_area_id SET NOT NULL;

-- Adicionar a nova constraint de unicidade por área e tipo de módulo
ALTER TABLE public.organization_modules ADD CONSTRAINT organization_modules_org_area_module_unique UNIQUE (organization_id, technical_area_id, module_type);
