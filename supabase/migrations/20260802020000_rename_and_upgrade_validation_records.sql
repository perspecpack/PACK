-- 1. Create public.validation_records table
create table if not exists public.validation_records (
    id uuid primary key default gen_random_uuid(),
    approval_id uuid references public.process_requests(id) on delete cascade not null,
    publication_id uuid references public.process_publications(id) on delete cascade not null,
    organization_id text not null,
    publication_code text not null,
    response_origin text not null check (response_origin in ('portal', 'manual_email')),
    final_result text not null,
    responder_name text not null,
    responder_role text not null,
    responded_at timestamptz not null,
    registered_by_user_id uuid, -- foreign key to user_profiles(user_id)
    registered_by_name text,
    registered_at timestamptz,
    email_subject text,
    notes text,
    fidelity_confirmed boolean not null default false,
    answers_snapshot jsonb not null default '[]'::jsonb,
    final_pdf_path text,
    pdf_hash text,
    cleanup_status text not null default 'pending' check (cleanup_status in ('pending', 'processing', 'completed', 'failed')),
    cleanup_notes text,
    cleanup_completed_at timestamptz,
    completed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    protocol text not null
);

-- Add foreign key constraint to public.user_profiles(user_id) for PostgREST joins
alter table public.validation_records 
  drop constraint if exists fk_validation_records_user_profiles;

alter table public.validation_records 
  add constraint fk_validation_records_user_profiles 
  foreign key (registered_by_user_id) 
  references public.user_profiles(user_id) 
  on delete set null;

-- 2. Migrate existing data from process_validation_records
do $$
begin
    if exists (select 1 from pg_tables where tablename = 'process_validation_records') then
        insert into public.validation_records (
            id,
            approval_id,
            publication_id,
            organization_id,
            publication_code,
            response_origin,
            final_result,
            responder_name,
            responder_role,
            responded_at,
            registered_by_user_id,
            registered_by_name,
            registered_at,
            email_subject,
            notes,
            fidelity_confirmed,
            answers_snapshot,
            final_pdf_path,
            pdf_hash,
            cleanup_status,
            cleanup_completed_at,
            completed_at,
            created_at,
            protocol
        )
        select 
            id,
            request_id,
            publication_id,
            organization,
            publication_code,
            case when origin = 'Portal' then 'portal' else 'manual_email' end,
            result,
            respondent_name,
            respondent_role,
            response_date,
            registered_by,
            (select full_name from public.user_profiles where user_id = registered_by limit 1),
            case when origin = 'E-mail' then completed_at else null end,
            email_subject,
            notes,
            declared,
            answers_snapshot,
            pdf_path,
            pdf_hash,
            case 
                when cleanup_status = 'Concluída' then 'completed'
                when cleanup_status = 'Falha na limpeza' then 'failed'
                else 'pending'
            end,
            case when cleanup_status = 'Concluída' then completed_at else null end,
            completed_at,
            created_at,
            protocol
        from public.process_validation_records
        on conflict (id) do nothing;
    end if;
end;
$$;

-- 3. Drop public.process_validation_records
drop table if exists public.process_validation_records cascade;

-- 4. Enable RLS and setup policies for validation_records
alter table public.validation_records enable row level security;

drop policy if exists "Users can view validation records of their organization" on public.validation_records;
drop policy if exists "Users can manage validation records of their organization" on public.validation_records;

create policy "Users can view validation records of their organization"
    on public.validation_records for select
    using (
        organization_id = (
            select company_name 
            from public.user_profiles 
            where user_id = auth.uid()
            limit 1
        )
        or ((auth.jwt() ->> 'email') ~~ '%master%')
        or ((auth.jwt() ->> 'email') ~~ '%admin%')
        or ((auth.jwt() ->> 'email') = 'perspec03d@gmail.com')
    );

create policy "Users can manage validation records of their organization"
    on public.validation_records for all
    using (
        organization_id = (
            select company_name 
            from public.user_profiles 
            where user_id = auth.uid()
            limit 1
        )
        or ((auth.jwt() ->> 'email') ~~ '%master%')
        or ((auth.jwt() ->> 'email') ~~ '%admin%')
        or ((auth.jwt() ->> 'email') = 'perspec03d@gmail.com')
    );

-- 5. Re-implement validation RPCs for validation_records

-- submit_validation_response RPC
create or replace function public.submit_validation_response(
    p_token uuid,
    p_respondent_name text,
    p_respondent_role text,
    p_respondent_email text,
    p_answers jsonb,
    p_primary_decision jsonb,
    p_attachments jsonb,
    p_pdf_hash text default null,
    p_materials_hashes jsonb default null,
    p_client_attachments_count integer default 0,
    p_client_attachments_names text[] default null,
    p_validation_source text default 'web',
    p_metadata jsonb default '{}'::jsonb
)
returns json
language plpgsql
security definer
as $$
declare
    v_pub record;
    v_resp_id uuid;
    v_protocol text;
    v_att record;
    v_block record;
    v_ans record;
    v_dec_opt record;
    v_sel_count integer;
begin
    select * into v_pub from public.process_publications 
    where public_token = p_token 
    for update;
    
    if not found then
        raise exception 'Publication not found.';
    end if;
    
    if v_pub.status = 'validated' then
        raise exception 'This validation is already completed.';
    end if;
    
    if v_pub.status = 'revoked' then
        raise exception 'This validation link has been revoked.';
    end if;
    
    -- basic validation
    if length(trim(p_respondent_name)) < 3 then
        raise exception 'Nome do responsável inválido (mínimo 3 caracteres).';
    end if;
    if length(trim(p_respondent_role)) < 2 then
        raise exception 'Cargo ou função inválido (mínimo 2 caracteres).';
    end if;
    
    -- Generate unique protocol
    v_protocol := 'VAL-' || lpad(nextval('public.validation_protocol_seq')::text, 6, '0');
    
    -- Insert response
    insert into public.process_validation_responses (
        publication_id, protocol, respondent_name, respondent_role, respondent_email,
        answers, primary_decision, pdf_hash, materials_hashes, client_attachments_count,
        client_attachments_names, validation_source, metadata
    ) values (
        v_pub.id, v_protocol, p_respondent_name, p_respondent_role, p_respondent_email,
        p_answers, p_primary_decision, p_pdf_hash, p_materials_hashes, p_client_attachments_count,
        p_client_attachments_names, p_validation_source, p_metadata
    ) returning id into v_resp_id;
    
    -- Insert consolidated validation record
    insert into public.validation_records (
        approval_id, publication_id, organization_id, publication_code, response_origin,
        final_result, responder_name, responder_role, responded_at, notes,
        email_subject, fidelity_confirmed, answers_snapshot, final_pdf_path, pdf_hash,
        cleanup_status, protocol
    ) values (
        v_pub.request_id, v_pub.id, v_pub.organization, v_pub.publication_code, 'portal',
        p_primary_decision->>'text', p_respondent_name, p_respondent_role, now(), null,
        null, true, p_answers, v_pub.public_token || '/report.pdf', p_pdf_hash,
        'pending', v_protocol
    );

    -- Insert completed audit event
    insert into public.process_validation_events (
        request_id, publication_id, event_type, event_description, metadata
    ) values (
        v_pub.request_id, v_pub.id, 'completed', 'Validação concluída pelo cliente via Portal PERSPECPACK.',
        jsonb_build_object('respondent_name', p_respondent_name, 'respondent_role', p_respondent_role, 'result', p_primary_decision->>'text', 'protocol', v_protocol)
    );

    update public.process_publications
    set status = 'validated',
        primary_result = p_primary_decision->>'text',
        primary_result_type = case 
            when p_primary_decision->>'semanticType' = 'attention' then 'warning'
            else p_primary_decision->>'semanticType'
        end,
        validated_at = now(),
        updated_at = now()
    where id = v_pub.id;
    
    return json_build_object(
        'protocol', v_protocol,
        'respondent_name', p_respondent_name,
        'respondent_role', p_respondent_role,
        'submitted_at', now()
    );
end;
$$;

-- register_manual_validation RPC
create or replace function public.register_manual_validation(
    p_publication_id uuid,
    p_result text,
    p_respondent_name text,
    p_respondent_role text,
    p_response_date date,
    p_validation_method text,
    p_email_subject text,
    p_notes text,
    p_declared boolean
)
returns json
language plpgsql
security definer
as $$
declare
    v_pub record;
    v_exist_online record;
    v_exist_manual record;
    v_protocol text;
    v_result_type text;
begin
    select * into v_pub from public.process_publications 
    where id = p_publication_id 
    for update;
    
    if not found then
        raise exception 'Publication not found.';
    end if;
    
    select * into v_exist_online from public.process_validation_responses where publication_id = p_publication_id;
    if found then
        raise exception 'Esta solicitação já foi respondida pelo portal e concluída automaticamente.';
    end if;
    
    select * into v_exist_manual from public.process_manual_validations where publication_id = p_publication_id;
    if found then
        raise exception 'Esta solicitação já possui um registro de validação manual.';
    end if;

    if v_pub.status = 'validated' then
        raise exception 'Esta solicitação já foi concluída.';
    end if;
    
    -- Generate protocol
    v_protocol := 'MAN-' || lpad(nextval('public.manual_validation_protocol_seq')::text, 6, '0');
    
    -- Insert manual validation registry
    insert into public.process_manual_validations (
        publication_id, user_id, protocol, result, respondent_name, respondent_role,
        response_date, validation_method, email_subject, notes, declared
    ) values (
        p_publication_id, auth.uid(), v_protocol, p_result, p_respondent_name, p_respondent_role,
        p_response_date, p_validation_method, p_email_subject, p_notes, p_declared
    );
    
    if p_result = 'Aprovado' then
        v_result_type := 'positive';
    elsif p_result = 'Aprovado com Ressalvas' then
        v_result_type := 'warning';
    else
        v_result_type := 'negative';
    end if;
    
    -- Insert consolidated validation record
    insert into public.validation_records (
        approval_id, publication_id, organization_id, publication_code, response_origin,
        final_result, responder_name, responder_role, responded_at, notes,
        email_subject, fidelity_confirmed, answers_snapshot, final_pdf_path, pdf_hash,
        cleanup_status, protocol, registered_by_user_id, registered_by_name, registered_at
    ) values (
        v_pub.request_id, v_pub.id, v_pub.organization, v_pub.publication_code, 'manual_email',
        p_result, p_respondent_name, p_respondent_role, p_response_date, p_notes,
        p_email_subject, p_declared, '[]'::jsonb, v_pub.public_token || '/report.pdf', null,
        'pending', v_protocol, auth.uid(), (select full_name from public.user_profiles where user_id = auth.uid() limit 1), now()
    );

    -- Insert completed audit event
    insert into public.process_validation_events (
        request_id, publication_id, event_type, event_description, triggered_by, metadata
    ) values (
        v_pub.request_id, v_pub.id, 'completed', 'Validação registrada manualmente pelo usuário interno.',
        auth.uid(), jsonb_build_object('respondent_name', p_respondent_name, 'respondent_role', p_respondent_role, 'validation_method', p_validation_method, 'result', p_result, 'protocol', v_protocol)
    );

    update public.process_publications
    set status = 'validated',
        primary_result = p_result,
        primary_result_type = v_result_type,
        validated_at = now(),
        updated_at = now()
    where id = p_publication_id;
    
    return json_build_object(
        'success', true,
        'protocol', v_protocol,
        'public_token', v_pub.public_token,
        'created_at', now()
    );
end;
$$;

-- update_validation_record_cleanup RPC
create or replace function public.update_validation_record_cleanup(
    p_publication_id uuid,
    p_cleanup_status text,
    p_cleanup_notes text default null
)
returns void
language plpgsql
security definer
as $$
declare
    v_pub record;
begin
    select * into v_pub from public.process_publications where id = p_publication_id;
    if found then
        update public.validation_records
        set cleanup_status = p_cleanup_status,
            cleanup_notes = p_cleanup_notes,
            cleanup_completed_at = case when p_cleanup_status = 'completed' then now() else null end,
            completed_at = now()
        where approval_id = v_pub.request_id;
    end if;
end;
$$;

-- update_pdf_hash RPC
create or replace function public.update_pdf_hash(
    p_token uuid,
    p_pdf_hash text
)
returns void
language plpgsql
security definer
as $$
declare
    v_pub record;
begin
    select * into v_pub from public.process_publications 
    where public_token = p_token;
    
    if found then
        update public.process_validation_responses
        set pdf_hash = p_pdf_hash
        where publication_id = v_pub.id;

        update public.validation_records
        set pdf_hash = p_pdf_hash
        where approval_id = v_pub.request_id;
    end if;
end;
$$;

-- update_manual_pdf_hash RPC
create or replace function public.update_manual_pdf_hash(
    p_publication_id uuid,
    p_pdf_hash text
)
returns void
language plpgsql
security definer
as $$
declare
    v_pub record;
begin
    select * into v_pub from public.process_publications 
    where id = p_publication_id;
    
    if found then
        update public.process_manual_validations
        set pdf_hash = p_pdf_hash
        where publication_id = p_publication_id;

        update public.validation_records
        set pdf_hash = p_pdf_hash
        where approval_id = v_pub.request_id;
    end if;
end;
$$;
