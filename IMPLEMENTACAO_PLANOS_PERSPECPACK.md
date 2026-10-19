# PERSPECPACK — IMPLEMENTAÇÃO DO MODELO COMERCIAL FREE E PREMIUM

**Data:** 19 de Outubro de 2026  
**Status da Versão:** Preparado com Segurança Operacional (Deploy Seguro & Grandfathering)  
**Ambiente:** Supabase PostgreSQL / React 19 / TypeScript / Vite  

---

## 1. RESUMO EXECUTIVO DO STATUS

| Componente / Recurso | Status de Implementação | Comentário Operacional |
| :--- | :--- | :--- |
| **Modelagem de Planos por Organização** | **Implementado** | Estrutura multitenant desacoplada de contas individuais, associada à organização compartilhada. |
| **Livro Razão de Emissões (`ledger`)** | **Implementado** | Idempotente por `publication_id`, contabilização mensal estrita. |
| **Fuso Horário Oficial (`America/Sao_Paulo`)** | **Implementado** | Cálculo de período com início às 00:00 do 1º dia de cada mês civil em Brasília. |
| **RPC Transacional de Publicação e Consumo** | **Implementado** | Concorrência controlada via `FOR UPDATE`, idempotência e consistência ACID. |
| **Interface do Cliente (Visão Geral e Aprovações)** | **Implementado** | Exibição discreta do progresso `X / 20` para Free e selo ilimitado para Premium. |
| **Interface de Detalhes do Plano (`Meu Plano`)** | **Implementado** | Detalhes reais de consumo, renovação, organização ativa e comparativo sem preços. |
| **Gerenciamento no Painel Master** | **Implementado** | Listagem do plano comercial por organização e modal de alteração administrativa. |
| **Classificação e Regras de Downloads 3D** | **Implementado** | Separação entre modelo de visualização (`three_d_model_url`) e CAD original (`step_file_url`). |
| **Preservação de Contas Existentes** | **Preparado e Protegido** | Grandfathering ativo: contas pré-existentes não sofrem bloqueio involuntário. |
| **Trava de Bloqueio Comercial em Produção** | **Preparado (Desativado por Padrão)** | `enforce_limit = false` como trava de segurança; ativação depende de aprovação explícita. |
| **Integração com Gateway de Pagamento / Checkout** | **Não Implementado (Conforme Escopo)** | Não previsto para esta fase de engenharia de arquitetura comercial. |

---

## 2. ARQUITETURA COMERCIAL IDENTIFICADA

Durante a auditoria da arquitetura real do PERSPECPACK, foram mapeadas as seguintes características:

1. **Entidades Organizacionais vs. Usuários:**
   - Na tabela `public.organizations`, existem as montadoras/fornecedores cadastrados (`id`, `name`, `slug`, `organization_type`).
   - Na tabela `public.user_profiles`, cada usuário possui seu registro (`user_id`, `company_name`, `trade_name`, `cnpj`). O campo `company_name` estabelece a organização corporativa emissora.
   - Na tabela `public.process_publications`, o campo `organization` preserva a entidade corporativa no momento do snapshot da publicação (`coalesce(v_profile.company_name, v_req.client, 'PERSPECPACK')`).
   - Na tabela `public.validation_records`, a política RLS isola os registros através do vínculo organizacional:
     `organization_id = (select company_name from public.user_profiles where user_id = auth.uid())`.
2. **Definição da Assinatura:**
   - A assinatura comercial pertence à **Organização** (pessoa jurídica/empresa), e não isoladamente ao usuário individual.
   - Todos os colaboradores com o mesmo vínculo empresarial compartilham a mesma cota e direitos de acesso.

---

## 3. ESTRUTURA DE DADOS: EXISTENTE E PROPOSTA

### 3.1. Nova Tabela: `public.organization_subscriptions`
Armazena a assinatura comercial e as diretrizes de cota de cada organização:

```sql
CREATE TABLE public.organization_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL, -- Suporta nome canônico, UUID ou slug
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'canceled')),
    monthly_limit INTEGER NOT NULL DEFAULT 20,
    enforce_limit BOOLEAN NOT NULL DEFAULT false, -- Trava de ativação comercial
    is_grandfathered BOOLEAN NOT NULL DEFAULT false, -- Identifica contas preservadas
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_org_subs_org_id_lower 
ON public.organization_subscriptions (lower(trim(organization_id)));
```

### 3.2. Nova Tabela: `public.organization_emission_ledger`
Registra cada emissão unitária efetiva, garantindo auditoria e integridade contábil:

```sql
CREATE TABLE public.organization_emission_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    publication_id UUID NOT NULL UNIQUE REFERENCES public.process_publications(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.process_requests(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    period_key TEXT NOT NULL, -- Ex: '2026-10'
    period_start TIMESTAMPTZ NOT NULL, -- Timestamp UTC correspondente às 00:00 SP
    emitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_org_emission_ledger_org_period 
ON public.organization_emission_ledger (lower(trim(organization_id)), period_key);
```

### 3.3. Evolução na Tabela `public.components`
Adicionada a coluna de classificação comercial para controle de downloads de arquivos 3D:

```sql
ALTER TABLE public.components 
ADD COLUMN IF NOT EXISTS premium_download_required BOOLEAN NOT NULL DEFAULT false;
```

---

## 4. REGRAS DE CONTABILIZAÇÃO E PERÍODO

### 4.1. Conceito Oficial de Emissão
- **Consome franquia:** Publicação efetiva de uma solicitação para validação externa (criação de registro em `process_publications`).
- **Nova versão publicada:** Consome nova emissão (cada versão publicada para cliente possui novo ciclo formal de aprovação).
- **Não consomem franquia:**
  - Criação ou edição de rascunhos;
  - Criação ou edição de modelos de processo;
  - Reenvio ou cópia de link já publicado;
  - Respostas preenchidas pelo destinatário;
  - Validações manuais e registros de eventos;
  - Consulta ao histórico de validações e comprovantes PDF;
  - Visualização de documentos, normas e modelos 3D.

### 4.2. Período Mensal de Brasília (`America/Sao_Paulo`)
A contagem segue rigorosamente o mês civil brasileiro:
- Início: Dia 1º às 00:00:00 no fuso `America/Sao_Paulo`.
- Fim: Primeiro instante do dia 1º do mês seguinte às 00:00:00.
- Armazenamento em banco: Valores UTC consistentes com conversão determinística através da função `get_sp_month_period(now())`.

---

## 5. GARANTIAS TRANSACIONAIS E CONCORRÊNCIA

### 5.1. Concorrência via Bloqueio de Linha (`FOR UPDATE`)
Para prevenir a violação de limite sob requisições simultâneas (ex.: dois colaboradores publicando quando restava apenas 1 emissão):
1. A RPC `publish_request` executa:
   ```sql
   SELECT * INTO v_sub 
   FROM public.organization_subscriptions 
   WHERE lower(trim(organization_id)) = lower(v_org_id)
   FOR UPDATE;
   ```
2. Isso obtém um lock exclusivo na linha da organização durante a transação.
3. Qualquer outra publicação da mesma empresa aguarda a conclusão da primeira.
4. Ao assumir o lock, a segunda requisição enxergará o consumo atualizado (20 emissões) e abortará com a exceção `PLAN_LIMIT_REACHED`.

### 5.2. Idempotência por Publicação
- A restrição `UNIQUE (publication_id)` na tabela `organization_emission_ledger` impede duplicidade contábil mesmo se ocorrer repetição da chamada por instabilidade de rede.

### 5.3. Atomicidade e Consistência ACID
- Caso a cota esteja esgotada (`v_usage_count >= v_limit` com `enforce_limit = true`), a RPC lança uma exceção.
- O PostgreSQL executa rollback automático: nenhum registro é inserido em `process_publications`, o status da solicitação permanece inalterado e nenhum consumo é computado.

---

## 6. SEGURANÇA E AUTORIZAÇÃO

1. **Funções com `SECURITY DEFINER` e `search_path` fixo:**
   As RPCs foram configuradas com:
   ```sql
   SECURITY DEFINER
   SET search_path = public, pg_temp
   ```
   Impedindo ataques de injeção de schema e garantindo que apenas a lógica interna valide direitos de acesso.
2. **Validação de Identidade no Backend:**
   O `organization_id` e o plano não são confiados a partir de parâmetros do navegador; são recuperados das tabelas autenticadas do banco (`user_profiles` e `organization_subscriptions`).
3. **RLS Restritivo:**
   Usuários comuns possuem apenas permissão de leitura sobre as tabelas de assinatura e ledger da sua respectiva empresa. Operações de mutação direta são proibidas, devendo ocorrer exclusivamente via RPC autorizada.

---

## 7. REGRAS DE ACESSO AOS ARQUIVOS 3D

### 7.1. Separação Arquitetural: Visualização vs. Download Original
No PERSPECPACK, identificou-se uma separação natural entre:
1. **Modelo 3D de Visualização (`three_d_model_url`):**
   - Arquivo leve em formato Web (GLB/GLTF) renderizado diretamente no navegador via `<model-viewer>`.
   - Permite inspeção visual de formas geométricas tanto para planos Free quanto Premium.
2. **Arquivos CAD de Engenharia Originais (`step_file_url`, `dwg_file_url`):**
   - Arquivos proprietários completos (sólidos paramétricos B-Rep, tolerâncias, curvas fabris).
   - Classificados como recursos de alto valor intelectual.

### 7.2. Matriz de Direitos de Acesso aos Componentes 3D

| Classificação do Componente | Plano FREE | Plano PREMIUM |
| :--- | :--- | :--- |
| **Componente Padrão / Gratuito** | Visualização 3D autorizada + Download liberado | Visualização 3D autorizada + Download liberado |
| **Componente Premium (`premium_download_required = true`)** | Visualização 3D autorizada / **Download CAD original bloqueado** | Visualização 3D autorizada + **Download CAD original liberado** |

> **Nota de Segurança Técnica:** Qualquer modelo transmitido ao WebGL do cliente pode ser recuperado da memória do navegador por usuários com conhecimentos avançados de depuração. A verdadeira proteção reside no fato de que o PERSPECPACK expõe para visualização apenas malhas poligonais (GLB), enquanto o modelo sólido de engenharia (STEP) permanece restrito ao plano Premium.

---

## 8. PLANO DE MIGRAÇÃO E PRESERVAÇÃO DE CONTAS EXISTENTES

### 8.1. Princípio de Não Interrupção Operacional
- Nenhuma organização existente pode perder acesso ou ter formulários interrompidos.
- O script de migração versionado (`20261019000000_organization_commercial_plans.sql`) inclui rotina de **Grandfathering**:
  1. Identifica todas as organizações cadastradas em `public.organizations`.
  2. Identifica todas as empresas registradas em `public.user_profiles`.
  3. Insere registros em `organization_subscriptions` com `plan = 'premium'`, `is_grandfathered = true` e `enforce_limit = false`.
  4. Garante que nenhuma operação atual seja bloqueada.

---

## 9. PLANO DE ATIVAÇÃO COMERCIAL EM PRODUÇÃO

A ativação dos limites comerciais para organizações Free deve seguir o seguinte protocolo de governança:

1. **Passo 1 (Deploy de Infraestrutura):** Aplicar a migração versionada `20261019000000_organization_commercial_plans.sql` no banco de produção.
2. **Passo 2 (Auditoria das Empresas):** Acessar o Painel Master (`/app/master/organizations`) e verificar os status e planos atribuídos.
3. **Passo 3 (Notificação aos Usuários):** Informar os clientes sobre o modelo de franquia gratuita de 20 emissões/mês e as vantagens do plano Premium.
4. **Passo 4 (Ativação da Trava):** Somente após o período de comunicação prévia, o Master ativa a trava de limite estrita (`enforce_limit = true`) para as empresas desejadas via interface administrativa ou chamada à RPC `set_organization_plan`.

---

## 10. ESTRATÉGIA DE ROLLBACK

Caso seja necessário reverter a migração em ambiente de homologação ou produção, execute o seguinte script:

```sql
-- SCRIPT DE ROLLBACK — MODELO COMERCIAL
BEGIN;

-- 1. Restaura a versão anterior da função publish_request (sem checagem de cota)
-- (Conforme arquivo 20260726150000_add_company_branding_to_user_profiles.sql)
CREATE OR REPLACE FUNCTION public.publish_request(
    p_request_id UUID,
    p_revoke_previous BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req record;
    v_version integer;
    v_pub_code text;
    v_pub_id uuid;
    v_token uuid;
    v_result json;
    v_snapshot jsonb;
    v_profile record;
BEGIN
    SELECT * INTO v_req FROM public.process_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;
    
    IF v_req.user_id != auth.uid() AND NOT (
        ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        OR ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        OR ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    ) THEN
        RAISE EXCEPTION 'Permission denied.';
    END IF;
    
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = v_req.user_id;
    
    SELECT coalesce(max(version), 0) + 1 INTO v_version 
    FROM public.process_publications 
    WHERE request_id = p_request_id;
    
    v_pub_code := 'PUB-' || lpad(nextval('public.publication_code_seq')::text, 6, '0');
    
    IF p_revoke_previous THEN
        UPDATE public.process_publications
        SET status = 'revoked',
            revoked_at = now(),
            updated_at = now()
        WHERE request_id = p_request_id
        AND status = 'awaiting_validation';
    END IF;
    
    v_token := gen_random_uuid();
    
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
        'company_name', coalesce(v_profile.company_name, v_req.client, 'PERSPECPACK'),
        'trade_name', v_profile.trade_name,
        'company_logo_url', v_profile.company_logo_url,
        'company_website', v_profile.company_website,
        'corporate_email', v_profile.corporate_email,
        'phone', v_profile.phone,
        'short_description', v_profile.short_description,
        'footer_text', v_profile.footer_text
    );
    
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
        coalesce(v_profile.company_name, v_req.client, 'PERSPECPACK'),
        v_pub_code,
        v_version,
        v_token,
        v_snapshot,
        'awaiting_validation'
    ) RETURNING id INTO v_pub_id;
    
    UPDATE public.process_requests
    SET status = 'published',
        updated_at = now()
    WHERE id = p_request_id;
    
    v_result := json_build_object(
        'id', v_pub_id,
        'publication_code', v_pub_code,
        'version', v_version,
        'public_token', v_token,
        'status', 'awaiting_validation',
        'published_at', now()
    );
    
    RETURN v_result;
END;
$$;

-- 2. Remove as funções auxiliares comerciais
DROP FUNCTION IF EXISTS public.set_organization_plan(TEXT, TEXT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_organization_emission_usage(TEXT);
DROP FUNCTION IF EXISTS public.get_sp_month_period(TIMESTAMPTZ);

-- 3. Remove coluna de classificação comercial em components
ALTER TABLE public.components DROP COLUMN IF EXISTS premium_download_required;

-- 4. Remove tabelas de livro razão e assinaturas
DROP TABLE IF EXISTS public.organization_emission_ledger CASCADE;
DROP TABLE IF EXISTS public.organization_subscriptions CASCADE;

COMMIT;
```

---

## 11. RESULTADOS DA VALIDAÇÃO TÉCNICA

- **Compilação TypeScript (`tsc`):** Aprovado com zero erros de tipo.
- **Build de Produção (`vite build`):** Aprovado com sucesso em 8.66s.
- **Convivência com Ambiente Sem Migration Aplicada:** Aprovado. O frontend implementa fallbacks lógicos para `process_publications`, garantindo que a aplicação não quebre caso seja executada antes da aplicação da migration no banco.
- **Preservação de Layout e Responsividade:** Aprovado em telas mobile, tablet e desktop.

---

## 12. PENDÊNCIAS E PRÓXIMOS PASSOS RECOMENDADOS

1. **Aprovação do Usuário:** Revisão deste documento e aprovação explícita para aplicação da migration `20261019000000_organization_commercial_plans.sql` no banco de dados.
2. **Definição Comercial:** Definir valores financeiros e modelo de faturamento antes de iniciar o desenvolvimento de gateway de pagamento/checkout.
3. **Storage Assinado:** Quando os buckets de componentes passarem para modo totalmente privado, criar uma RPC para geração de URLs assinadas que valide o status Premium em tempo real.
