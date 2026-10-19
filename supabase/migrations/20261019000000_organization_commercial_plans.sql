-- ==============================================================================
-- PERSPECPACK — MIGRAÇÃO DO MODELO COMERCIAL FREE E PREMIUM POR ORGANIZAÇÃO
-- Data de Criação: 2026-10-19
-- Versão: 20261019000000_organization_commercial_plans.sql
-- 
-- OBJETIVO:
-- 1. Criação das tabelas de assinaturas por organização (organization_subscriptions)
--    e livro razão de emissões mensais (organization_emission_ledger).
-- 2. Preservação integral das contas existentes (grandfathering com emissões ilimitadas).
-- 3. Transacionalidade e concorrência com bloqueio FOR UPDATE.
-- 4. Idempotência por publicação com chave única em publication_id.
-- 5. Período mensal estrito reiniciado no dia 1º no fuso America/Sao_Paulo.
-- 6. Adição de classificação de download 3D (premium_download_required).
-- ==============================================================================

-- 1. TABELA DE ASSINATURAS POR ORGANIZAÇÃO
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'canceled')),
    monthly_limit INTEGER NOT NULL DEFAULT 20,
    enforce_limit BOOLEAN NOT NULL DEFAULT false, -- Trava de segurança: false durante implantação, true após ativação
    is_grandfathered BOOLEAN NOT NULL DEFAULT false, -- Identifica contas existentes preservadas
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice único case-insensitive para identificador da organização
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_subs_org_id_lower 
ON public.organization_subscriptions (lower(trim(organization_id)));

-- Habilitar RLS
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Usuários autenticados podem ver a assinatura da sua organização ou Masters/Admins
DROP POLICY IF EXISTS "Users can view subscription of their organization" ON public.organization_subscriptions;
CREATE POLICY "Users can view subscription of their organization"
ON public.organization_subscriptions FOR SELECT
USING (
    lower(trim(organization_id)) = (
        SELECT lower(trim(company_name)) 
        FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
    OR ((auth.jwt() ->> 'email') ~~ '%master%')
    OR ((auth.jwt() ->> 'email') ~~ '%admin%')
    OR ((auth.jwt() ->> 'email') = 'perspec03d@gmail.com')
);

-- Modificações diretas restritas a Masters/Admins
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Admins can manage subscriptions"
ON public.organization_subscriptions FOR ALL
USING (
    ((auth.jwt() ->> 'email') ~~ '%master%')
    OR ((auth.jwt() ->> 'email') ~~ '%admin%')
    OR ((auth.jwt() ->> 'email') = 'perspec03d@gmail.com')
);

-- 2. TABELA DE LIVRO RAZÃO DE EMISSÕES MENSAIS (EMISSION LEDGER)
CREATE TABLE IF NOT EXISTS public.organization_emission_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    publication_id UUID NOT NULL UNIQUE REFERENCES public.process_publications(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.process_requests(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    period_key TEXT NOT NULL, -- Exemplo: '2026-10'
    period_start TIMESTAMPTZ NOT NULL, -- 1º dia do mês no fuso America/Sao_Paulo convertido para UTC
    emitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para buscas rápidas de consumo
CREATE INDEX IF NOT EXISTS idx_org_emission_ledger_org_period 
ON public.organization_emission_ledger (lower(trim(organization_id)), period_key);

CREATE INDEX IF NOT EXISTS idx_org_emission_ledger_emitted_at 
ON public.organization_emission_ledger (emitted_at);

-- Habilitar RLS
ALTER TABLE public.organization_emission_ledger ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Usuários podem consultar as emissões de sua organização ou Masters
DROP POLICY IF EXISTS "Users can view emissions of their organization" ON public.organization_emission_ledger;
CREATE POLICY "Users can view emissions of their organization"
ON public.organization_emission_ledger FOR SELECT
USING (
    lower(trim(organization_id)) = (
        SELECT lower(trim(company_name)) 
        FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        LIMIT 1
    )
    OR ((auth.jwt() ->> 'email') ~~ '%master%')
    OR ((auth.jwt() ->> 'email') ~~ '%admin%')
    OR ((auth.jwt() ->> 'email') = 'perspec03d@gmail.com')
);

-- 3. ADICIONAR CLASSIFICAÇÃO COMERCIAL AOS COMPONENTES 3D
ALTER TABLE public.components 
ADD COLUMN IF NOT EXISTS premium_download_required BOOLEAN NOT NULL DEFAULT false;

-- 4. PRESERVAÇÃO DAS CONTAS EXISTENTES (GRANDFATHERING)
-- Garante que todas as empresas atualmente existentes iniciem preservadas sem bloqueio
INSERT INTO public.organization_subscriptions (
    organization_id, plan, status, monthly_limit, enforce_limit, is_grandfathered
)
SELECT DISTINCT 
    o.name, 
    'premium', 
    'active', 
    -1, 
    false, 
    true
FROM public.organizations o
ON CONFLICT (lower(trim(organization_id))) DO NOTHING;

INSERT INTO public.organization_subscriptions (
    organization_id, plan, status, monthly_limit, enforce_limit, is_grandfathered
)
SELECT DISTINCT 
    company_name, 
    'premium', 
    'active', 
    -1, 
    false, 
    true
FROM public.user_profiles
WHERE company_name IS NOT NULL AND trim(company_name) != ''
ON CONFLICT (lower(trim(organization_id))) DO NOTHING;

INSERT INTO public.organization_subscriptions (
    organization_id, plan, status, monthly_limit, enforce_limit, is_grandfathered
) VALUES (
    'PERSPECPACK', 'premium', 'active', -1, false, true
)
ON CONFLICT (lower(trim(organization_id))) DO NOTHING;

-- 5. FUNÇÃO AUXILIAR DE CÁLCULO DE PERÍODO (FUSO AMERICA/SAO_PAULO)
CREATE OR REPLACE FUNCTION public.get_sp_month_period(p_time TIMESTAMPTZ DEFAULT now())
RETURNS TABLE(
    period_key TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_sp_time TIMESTAMP;
    v_sp_month_start TIMESTAMP;
    v_sp_month_end TIMESTAMP;
BEGIN
    -- Converte o timestamp para o fuso America/Sao_Paulo (sem time zone)
    v_sp_time := p_time AT TIME ZONE 'America/Sao_Paulo';
    
    -- Início do mês às 00:00:00
    v_sp_month_start := date_trunc('month', v_sp_time);
    
    -- Início do próximo mês às 00:00:00
    v_sp_month_end := v_sp_month_start + INTERVAL '1 month';
    
    -- Retorna chave no formato YYYY-MM e os limites convertidos para UTC (com time zone)
    period_key := to_char(v_sp_month_start, 'YYYY-MM');
    period_start := v_sp_month_start AT TIME ZONE 'America/Sao_Paulo';
    period_end := v_sp_month_end AT TIME ZONE 'America/Sao_Paulo';
    
    RETURN NEXT;
END;
$$;

-- 6. RPC DE CONSULTA DE CONSUMO MENSAL DA ORGANIZAÇÃO
CREATE OR REPLACE FUNCTION public.get_organization_emission_usage(
    p_organization_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id TEXT;
    v_sub RECORD;
    v_period RECORD;
    v_usage_count INTEGER;
    v_limit INTEGER;
    v_is_unlimited BOOLEAN;
    v_remaining INTEGER;
    v_limit_reached BOOLEAN;
    v_user_profile RECORD;
BEGIN
    -- Se p_organization_id for nulo, busca a organização do usuário logado
    IF p_organization_id IS NULL OR trim(p_organization_id) = '' THEN
        SELECT * INTO v_user_profile FROM public.user_profiles WHERE user_id = auth.uid();
        v_org_id := coalesce(trim(v_user_profile.company_name), 'PERSPECPACK');
    ELSE
        v_org_id := trim(p_organization_id);
    END IF;

    -- Obtém o período comercial em America/Sao_Paulo
    SELECT * INTO v_period FROM public.get_sp_month_period(now());

    -- Busca a assinatura da organização
    SELECT * INTO v_sub 
    FROM public.organization_subscriptions 
    WHERE lower(trim(organization_id)) = lower(v_org_id);

    -- Se não encontrar assinatura, assume FREE como padrão
    IF NOT FOUND THEN
        v_sub.plan := 'free';
        v_sub.status := 'active';
        v_sub.monthly_limit := 20;
        v_sub.enforce_limit := false;
        v_sub.is_grandfathered := false;
        v_sub.started_at := now();
        v_sub.expires_at := NULL;
    END IF;

    -- Contabiliza o consumo registrado no período atual
    SELECT count(*)::INTEGER INTO v_usage_count
    FROM public.organization_emission_ledger
    WHERE lower(trim(organization_id)) = lower(v_org_id)
      AND period_key = v_period.period_key;

    -- Define limites
    IF v_sub.plan = 'premium' OR v_sub.monthly_limit < 0 THEN
        v_is_unlimited := true;
        v_limit := -1;
        v_remaining := -1;
        v_limit_reached := false;
    ELSE
        v_is_unlimited := false;
        v_limit := coalesce(v_sub.monthly_limit, 20);
        v_remaining := greatest(0, v_limit - v_usage_count);
        v_limit_reached := (v_usage_count >= v_limit);
    END IF;

    RETURN json_build_object(
        'organization_id', v_org_id,
        'plan', v_sub.plan,
        'status', v_sub.status,
        'period_key', v_period.period_key,
        'period_start', v_period.period_start,
        'period_end', v_period.period_end,
        'current_usage', v_usage_count,
        'monthly_limit', v_limit,
        'remaining', v_remaining,
        'is_unlimited', v_is_unlimited,
        'limit_reached', v_limit_reached,
        'enforce_limit', coalesce(v_sub.enforce_limit, false),
        'is_grandfathered', coalesce(v_sub.is_grandfathered, false)
    );
END;
$$;

-- 7. RPC ATÔMICA E TRANSACIONAL DE PUBLICAÇÃO COM CONTROLE DE FRANQUIA
CREATE OR REPLACE FUNCTION public.publish_request(
    p_request_id UUID,
    p_revoke_previous BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_req RECORD;
    v_version INTEGER;
    v_pub_code TEXT;
    v_pub_id UUID;
    v_token UUID;
    v_result JSON;
    v_snapshot JSONB;
    v_profile RECORD;
    v_org_id TEXT;
    v_sub RECORD;
    v_period RECORD;
    v_usage_count INTEGER;
    v_limit INTEGER;
    v_caller_is_admin BOOLEAN;
BEGIN
    -- 1. Recupera dados da solicitação
    SELECT * INTO v_req FROM public.process_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;
    
    -- 2. Verifica permissões do usuário
    v_caller_is_admin := (
        ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        OR ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        OR ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    );

    IF v_req.user_id != auth.uid() AND NOT v_caller_is_admin THEN
        RAISE EXCEPTION 'Permission denied.';
    END IF;
    
    -- 3. Recupera dados de branding do usuário/empresa
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = v_req.user_id;
    v_org_id := coalesce(trim(v_profile.company_name), trim(v_req.client), 'PERSPECPACK');
    
    -- 4. Garante que exista registro na tabela de assinaturas (auto-seed como Free se não existir)
    INSERT INTO public.organization_subscriptions (
        organization_id, plan, status, monthly_limit, enforce_limit, is_grandfathered
    ) VALUES (
        v_org_id, 'free', 'active', 20, false, false
    ) ON CONFLICT (lower(trim(organization_id))) DO NOTHING;

    -- 5. BLOQUEIO DE LINHA (FOR UPDATE) PARA CONCORRÊNCIA SEGURA
    SELECT * INTO v_sub 
    FROM public.organization_subscriptions 
    WHERE lower(trim(organization_id)) = lower(v_org_id)
    FOR UPDATE;

    -- 6. Calcula o período mensal em America/Sao_Paulo
    SELECT * INTO v_period FROM public.get_sp_month_period(now());

    -- 7. Contabiliza consumo atual do mês
    SELECT count(*)::INTEGER INTO v_usage_count
    FROM public.organization_emission_ledger
    WHERE lower(trim(organization_id)) = lower(v_org_id)
      AND period_key = v_period.period_key;

    -- 8. Valida limite comercial caso a organização seja Free e a trava esteja ativa
    v_limit := coalesce(v_sub.monthly_limit, 20);
    IF v_sub.plan = 'free' AND coalesce(v_sub.enforce_limit, false) = true AND v_usage_count >= v_limit THEN
        RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Você utilizou as % emissões gratuitas deste mês. Novas publicações estarão disponíveis no próximo período ou com a ativação do Premium.', v_limit
        USING ERRCODE = 'P0001';
    END IF;

    -- 9. Calcula a próxima versão para esta solicitação
    SELECT coalesce(max(version), 0) + 1 INTO v_version 
    FROM public.process_publications 
    WHERE request_id = p_request_id;
    
    -- 10. Gera o código da publicação
    v_pub_code := 'PUB-' || lpad(nextval('public.publication_code_seq')::text, 6, '0');
    
    -- 11. Revoga publicações anteriores se solicitado
    IF p_revoke_previous THEN
        UPDATE public.process_publications
        SET status = 'revoked',
            revoked_at = now(),
            updated_at = now()
        WHERE request_id = p_request_id
        AND status = 'awaiting_validation';
    END IF;
    
    -- 12. Gera token público único
    v_token := gen_random_uuid();
    
    -- 13. Monta o snapshot completo para preservação
    v_snapshot := jsonb_build_object(
        'request_id', v_req.id,
        'title', v_req.title,
        'client', v_req.client,
        'project', v_req.project,
        'code', v_req.code,
        'revision', v_req.revision,
        'responsible_internal', v_req.responsible_internal,
        'deadline', v_req.deadline,
        'description', v_req.description,
        'notes_for_client', v_req.notes_for_client,
        'materials', v_req.materials,
        'blocks', v_req.blocks,
        'name', v_req.title,
        'company_name', v_org_id,
        'trade_name', v_profile.trade_name,
        'company_logo_url', v_profile.company_logo_url,
        'company_website', v_profile.company_website,
        'corporate_email', v_profile.corporate_email,
        'phone', v_profile.phone,
        'short_description', v_profile.short_description,
        'footer_text', v_profile.footer_text
    );
    
    -- 14. Insere a publicação
    INSERT INTO public.process_publications (
        process_id,
        request_id,
        user_id,
        organization,
        publication_code,
        version,
        public_token,
        snapshot,
        status
    ) VALUES (
        v_req.process_id,
        v_req.id,
        v_req.user_id,
        v_org_id,
        v_pub_code,
        v_version,
        v_token,
        v_snapshot,
        'awaiting_validation'
    ) RETURNING id INTO v_pub_id;
    
    -- 15. Atualiza o status da solicitação de origem para publicado
    UPDATE public.process_requests
    SET status = 'published',
        updated_at = now()
    WHERE id = p_request_id;

    -- 16. REGISTRO NO LIVRO RAZÃO DE CONSUMO (IDEMPOTENTE VIA UNIQUE publication_id)
    INSERT INTO public.organization_emission_ledger (
        organization_id,
        publication_id,
        request_id,
        user_id,
        period_key,
        period_start,
        emitted_at
    ) VALUES (
        v_org_id,
        v_pub_id,
        v_req.id,
        v_req.user_id,
        v_period.period_key,
        v_period.period_start,
        now()
    ) ON CONFLICT (publication_id) DO NOTHING;

    -- 17. Monta o resultado de retorno enriquecido com informações de consumo
    v_result := json_build_object(
        'id', v_pub_id,
        'publication_code', v_pub_code,
        'version', v_version,
        'public_token', v_token,
        'status', 'awaiting_validation',
        'published_at', now(),
        'organization_id', v_org_id,
        'emission_count_month', v_usage_count + 1,
        'monthly_limit', v_limit,
        'plan', v_sub.plan
    );
    
    RETURN v_result;
END;
$$;

-- 8. RPC ADMINISTRATIVA PARA DEFINIR PLANO COMERCIAL POR ORGANIZAÇÃO
CREATE OR REPLACE FUNCTION public.set_organization_plan(
    p_organization_id TEXT,
    p_plan TEXT,
    p_monthly_limit INTEGER DEFAULT 20,
    p_enforce_limit BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_org_id TEXT;
    v_result RECORD;
BEGIN
    -- Valida permissão Master/Admin
    v_is_admin := (
        ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        OR ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        OR ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    );

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar planos comerciais.';
    END IF;

    IF p_plan NOT IN ('free', 'premium') THEN
        RAISE EXCEPTION 'Plano inválido: deve ser free ou premium.';
    END IF;

    v_org_id := trim(p_organization_id);

    INSERT INTO public.organization_subscriptions (
        organization_id, plan, status, monthly_limit, enforce_limit, updated_at
    ) VALUES (
        v_org_id, p_plan, 'active', p_monthly_limit, p_enforce_limit, now()
    )
    ON CONFLICT (lower(trim(organization_id))) DO UPDATE
    SET plan = EXCLUDED.plan,
        status = 'active',
        monthly_limit = EXCLUDED.monthly_limit,
        enforce_limit = EXCLUDED.enforce_limit,
        updated_at = now()
    RETURNING * INTO v_result;

    RETURN json_build_object(
        'success', true,
        'organization_id', v_result.organization_id,
        'plan', v_result.plan,
        'status', v_result.status,
        'monthly_limit', v_result.monthly_limit,
        'enforce_limit', v_result.enforce_limit,
        'updated_at', v_result.updated_at
    );
END;
$$;
