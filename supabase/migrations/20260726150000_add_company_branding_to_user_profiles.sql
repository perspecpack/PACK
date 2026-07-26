-- Add company branding columns to user_profiles table if they don't exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS trade_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS footer_text text;

-- Recreate publish_request function to capture branding details in the snapshot at publication time
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
    v_profile record;
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
    
    -- Recupera dados de branding do usuário/empresa
    select * into v_profile from public.user_profiles where user_id = v_req.user_id;
    
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
    
    -- Monta o snapshot completo para preservação (incluindo branding)
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
        'name', v_req.title, -- retrocompatibilidade de exibições que buscam pub.snapshot.name
        'company_name', coalesce(v_profile.company_name, v_req.client, 'PERSPECPACK'),
        'trade_name', v_profile.trade_name,
        'company_logo_url', v_profile.company_logo_url,
        'company_website', v_profile.company_website,
        'corporate_email', v_profile.corporate_email,
        'phone', v_profile.phone,
        'short_description', v_profile.short_description,
        'footer_text', v_profile.footer_text
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
        coalesce(v_profile.company_name, v_req.client, 'PERSPECPACK'),
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
