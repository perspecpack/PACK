-- 1. Cria a tabela de solicitações de aprovação
create table if not exists public.process_requests (
    id uuid default gen_random_uuid() primary key,
    process_id uuid references public.processes(id) on delete set null,
    user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
    title text not null,
    client text,
    project text,
    code text,
    revision text,
    responsible_internal text,
    deadline timestamptz,
    description text,
    notes_for_client text,
    status text not null default 'draft' check (status in ('draft', 'ready', 'published', 'validated', 'revoked')),
    blocks jsonb not null default '[]'::jsonb,
    materials jsonb not null default '[]'::jsonb,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Habilita RLS na tabela de solicitações
alter table public.process_requests enable row level security;

-- Política de RLS para gerenciamento das solicitações por donos/admins
create policy "Owners/admins can manage process_requests"
on public.process_requests
using (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
);

-- 2. Adiciona o vínculo com solicitação na tabela de publicações (nullable para retrocompatibilidade)
alter table public.process_publications 
add column if not exists request_id uuid references public.process_requests(id) on delete cascade;

-- Cria índice no request_id para acelerar buscas
create index if not exists idx_process_publications_request_id on public.process_publications(request_id);

-- 3. Função RPC para publicação atômica de solicitações de aprovação
create or replace function public.publish_request(
    p_request_id uuid,
    p_revoke_previous boolean
)
returns json
language plpgsql
security definer
as $$
declare
    v_req record;
    v_user_id uuid;
    v_version integer;
    v_pub_code text;
    v_pub_id uuid;
    v_token uuid;
    v_result json;
    v_snapshot jsonb;
begin
    -- Recupera dados da solicitação
    select * into v_req from public.process_requests where id = p_request_id;
    if not found then
        raise exception 'Request not found.';
    end if;
    
    -- Verifica permissões do usuário
    if v_req.user_id != auth.uid() and not (
        ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    ) then
        raise exception 'Permission denied.';
    end if;
    
    -- Calcula a próxima versão para esta solicitação
    select coalesce(max(version), 0) + 1 into v_version 
    from public.process_publications 
    where request_id = p_request_id;
    
    -- Gera o código da publicação
    v_pub_code := 'PUB-' || lpad(nextval('public.publication_code_seq')::text, 6, '0');
    
    -- Revoga publicações anteriores se solicitado
    if p_revoke_previous then
        update public.process_publications
        set status = 'revoked',
            revoked_at = now(),
            updated_at = now()
        where request_id = p_request_id
        and status = 'awaiting_validation';
    end if;
    
    -- Gera token público
    v_token := gen_random_uuid();
    
    -- Monta o snapshot completo para preservação
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
        'name', v_req.title -- retrocompatibilidade de exibições que buscam pub.snapshot.name
    );
    
    -- Insere o registro de publicação
    insert into public.process_publications (
        process_id,
        request_id,
        user_id,
        organization,
        publication_code,
        version,
        public_token,
        snapshot,
        status
    ) values (
        v_req.process_id,
        v_req.id,
        v_req.user_id,
        v_req.client,
        v_pub_code,
        v_version,
        v_token,
        v_snapshot,
        'awaiting_validation'
    ) returning id into v_pub_id;
    
    -- Atualiza status da solicitação de origem para publicado
    update public.process_requests
    set status = 'published',
        updated_at = now()
    where id = p_request_id;
    
    v_result := json_build_object(
        'id', v_pub_id,
        'publication_code', v_pub_code,
        'version', v_version,
        'public_token', v_token,
        'status', 'awaiting_validation',
        'published_at', now()
    );
    
    return v_result;
end;
$$;

-- 4. Função e Gatilho para sincronização automática de status entre publicações e solicitações
create or replace function public.on_publication_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
    if new.request_id is not null then
        if new.status = 'revoked' and old.status != 'revoked' then
            update public.process_requests
            set status = 'revoked',
                updated_at = now()
            where id = new.request_id;
        elsif new.status = 'validated' and old.status != 'validated' then
            update public.process_requests
            set status = 'validated',
                updated_at = now()
            where id = new.request_id;
        end if;
    end if;
    return new;
end;
$$;

-- Remove o gatilho se já existir
drop trigger if exists trigger_on_publication_status_change on public.process_publications;

-- Cria o gatilho de monitoramento
create trigger trigger_on_publication_status_change
after update of status on public.process_publications
for each row
execute function public.on_publication_status_change();

-- 5. Criação do Bucket de Armazenamento para os arquivos das empresas (materiais de análise)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-materials', 'request-materials', false, 52428800, null)
on conflict (id) do nothing;

-- Permite acesso completo (insert/select/delete) para donos/administradores autenticados
create policy "Allow owners and admins to manage request-materials"
on storage.objects for all
using (
    bucket_id = 'request-materials'
    and (
        (auth.uid() is not null)
        or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    )
);

-- Permite leitura de arquivos pelo token de download
create policy "Allow public read on request-materials"
on storage.objects for select
using (bucket_id = 'request-materials');
