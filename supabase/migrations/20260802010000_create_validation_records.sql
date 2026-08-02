-- 1. Create process_validation_records table
create table if not exists public.process_validation_records (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references public.process_requests(id) on delete cascade not null,
    publication_id uuid references public.process_publications(id) on delete cascade not null,
    organization text not null,
    publication_code text not null,
    result text not null,
    origin text not null check (origin in ('Portal', 'E-mail', 'Outro')),
    respondent_name text not null,
    respondent_role text not null,
    response_date timestamptz not null,
    completed_at timestamptz not null default now(),
    registered_by uuid references auth.users(id) on delete set null,
    notes text,
    email_subject text,
    declared boolean not null default false,
    answers_snapshot jsonb not null default '[]'::jsonb,
    pdf_path text,
    pdf_hash text,
    cleanup_status text not null default 'Pendente' check (cleanup_status in ('Concluída', 'Pendente', 'Falha na limpeza')),
    cleanup_notes text,
    protocol text,
    created_at timestamptz not null default now()
);

-- 2. Create process_validation_events table
create table if not exists public.process_validation_events (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references public.process_requests(id) on delete cascade not null,
    publication_id uuid references public.process_publications(id) on delete cascade,
    event_type text not null,
    event_description text not null,
    triggered_by uuid references auth.users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 3. Enable RLS and setup policies
alter table public.process_validation_records enable row level security;
alter table public.process_validation_events enable row level security;

-- Drop existing policies if any to avoid errors on reapplying
drop policy if exists "Owners and admins can view validation records" on public.process_validation_records;
drop policy if exists "Admins and owners can manage validation records" on public.process_validation_records;
drop policy if exists "Owners and admins can view validation events" on public.process_validation_events;

create policy "Owners and admins can view validation records"
    on public.process_validation_records for select
    using (
        exists (
            select 1 from public.process_requests r
            where r.id = request_id
              and (
                r.user_id = auth.uid()
                or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
                or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
                or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
              )
        )
    );

create policy "Admins and owners can manage validation records"
    on public.process_validation_records for all
    using (
        exists (
            select 1 from public.process_requests r
            where r.id = request_id
              and (
                r.user_id = auth.uid()
                or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
                or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
                or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
              )
        )
    );

create policy "Owners and admins can view validation events"
    on public.process_validation_events for select
    using (
        exists (
            select 1 from public.process_requests r
            where r.id = request_id
              and (
                r.user_id = auth.uid()
                or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
                or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
                or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
              )
        )
    );

-- 4. Create trigger functions for automatic event logging
create or replace function public.on_request_created()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.process_validation_events (
        request_id,
        event_type,
        event_description,
        metadata
    ) values (
        new.id,
        'request_created',
        'Solicitação de validação criada.',
        jsonb_build_object('title', new.title, 'client', new.client)
    );
    return new;
end;
$$;

drop trigger if exists trigger_on_request_created on public.process_requests;
create trigger trigger_on_request_created
    after insert on public.process_requests
    for each row
    execute function public.on_request_created();

create or replace function public.on_publication_created()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.process_validation_events (
        request_id,
        publication_id,
        event_type,
        event_description,
        metadata
    ) values (
        new.request_id,
        new.id,
        'published',
        'Solicitação publicada. Link de validação gerado.',
        jsonb_build_object('publication_code', new.publication_code, 'version', new.version)
    );
    return new;
end;
$$;

drop trigger if exists trigger_on_publication_created on public.process_publications;
create trigger trigger_on_publication_created
    after insert on public.process_publications
    for each row
    execute function public.on_publication_created();

-- 5. Helper RPC to register events from client-side
create or replace function public.register_validation_event(
    p_publication_id uuid,
    p_event_type text,
    p_event_description text,
    p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_pub record;
    v_event_id uuid;
begin
    select * into v_pub from public.process_publications where id = p_publication_id;
    if not found then
        raise exception 'Publication not found.';
    end if;

    insert into public.process_validation_events (
        request_id,
        publication_id,
        event_type,
        event_description,
        triggered_by,
        metadata
    ) values (
        v_pub.request_id,
        v_pub.id,
        p_event_type,
        p_event_description,
        auth.uid(),
        p_metadata
    ) returning id into v_event_id;

    return v_event_id;
end;
$$;

-- 6. Helper RPC to log cleanup status
create or replace function public.update_validation_record_cleanup(
    p_publication_id uuid,
    p_cleanup_status text,
    p_cleanup_notes text default null
)
returns void
language plpgsql
security definer
as $$
begin
    update public.process_validation_records
    set cleanup_status = p_cleanup_status,
        cleanup_notes = p_cleanup_notes,
        completed_at = now()
    where publication_id = p_publication_id;
end;
$$;

-- 7. Update submit_validation_response RPC function to atomically create consolidated validation record & completed event
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
    -- Select for update to prevent concurrent race conditions
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
    
    -- SERVER-SIDE VALIDATION
    if length(trim(p_respondent_name)) < 3 then
        raise exception 'Nome do responsável inválido (mínimo 3 caracteres).';
    end if;
    
    if length(trim(p_respondent_role)) < 2 then
        raise exception 'Cargo ou função inválido (mínimo 2 caracteres).';
    end if;
    
    if p_respondent_email is not null and p_respondent_email != '' then
        if p_respondent_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
            raise exception 'E-mail do responsável inválido.';
        end if;
    end if;
    
    for v_block in 
        select * from jsonb_to_recordset(v_pub.snapshot->'blocks') 
        as x(id text, type text, title text, required boolean, "filledBy" text, declarationText text, decisions jsonb, options jsonb, minSelections integer, maxSelections integer)
    loop
        select * into v_ans from jsonb_to_recordset(p_answers) 
        as y(block_id text, answer text, comment text, confirmed boolean, selected_option_labels jsonb, attached_files jsonb)
        where y.block_id = v_block.id;
        
        if v_block.type = 'heading_text' or v_block.type = 'request_information' or v_block.type = 'analysis_materials' or v_block."filledBy" = 'company' then
            continue;
        end if;
        
        if v_block.required then
            if v_block.type = 'acknowledgement' and (v_ans.confirmed is null or v_ans.confirmed = false) then
                raise exception 'O campo "%" é obrigatório e precisa ser aceito.', v_block.title;
            end if;
            
            if v_block.type = 'approval_decision' then
                if v_ans.answer is null or v_ans.answer = '' then
                    raise exception 'Uma decisão para o campo "%" deve ser selecionada.', v_block.title;
                end if;
                
                select * into v_dec_opt from jsonb_to_recordset(v_block.decisions) as d(id text, text text, requireComment boolean)
                where d.text = v_ans.answer;
                
                if found and v_dec_opt.requireComment and (v_ans.comment is null or trim(v_ans.comment) = '') then
                    raise exception 'Justificativa/Comentários é obrigatório para a decisão selecionada em "%".', v_block.title;
                end if;
            end if;
            
            if v_block.type = 'file_upload' and (v_ans.attached_files is null or jsonb_array_length(v_ans.attached_files) = 0) then
                raise exception 'O anexo para o campo "%" é obrigatório.', v_block.title;
            end if;
            
            if v_block.type != 'acknowledgement' and v_block.type != 'approval_decision' and v_block.type != 'file_upload' then
                if (v_ans.answer is null or trim(v_ans.answer) = '') and (v_ans.selected_option_labels is null or jsonb_array_length(v_ans.selected_option_labels) = 0) then
                    raise exception 'O campo "%" é obrigatório.', v_block.title;
                end if;
            end if;
        end if;
        
        if v_block.type = 'checkbox' and v_ans.selected_option_labels is not null and jsonb_array_length(v_ans.selected_option_labels) > 0 then
            v_sel_count := jsonb_array_length(v_ans.selected_option_labels);
            if v_block.minSelections is not null and v_sel_count < v_block.minSelections then
                raise exception 'O campo "%" exige no mínimo % seleções.', v_block.title, v_block.minSelections;
            end if;
            if v_block.maxSelections is not null and v_sel_count > v_block.maxSelections then
                raise exception 'O campo "%" permite no máximo % seleções.', v_block.title, v_block.maxSelections;
            end if;
        end if;
    end loop;

    -- Generate unique protocol
    v_protocol := 'VAL-' || lpad(nextval('public.validation_protocol_seq')::text, 6, '0');
    
    -- Insert response
    insert into public.process_validation_responses (
        publication_id,
        protocol,
        respondent_name,
        respondent_role,
        respondent_email,
        answers,
        primary_decision,
        pdf_hash,
        materials_hashes,
        client_attachments_count,
        client_attachments_names,
        validation_source,
        metadata
    ) values (
        v_pub.id,
        v_protocol,
        p_respondent_name,
        p_respondent_role,
        p_respondent_email,
        p_answers,
        p_primary_decision,
        p_pdf_hash,
        p_materials_hashes,
        p_client_attachments_count,
        p_client_attachments_names,
        p_validation_source,
        p_metadata
    ) returning id into v_resp_id;
    
    -- Insert attachments if provided
    if p_attachments is not null and jsonb_array_length(p_attachments) > 0 then
        for v_att in select * from jsonb_to_recordset(p_attachments) as x(block_id text, storage_path text, original_name text, mime_type text, size_bytes integer) loop
            insert into public.validation_attachments (
                response_id,
                block_id,
                storage_path,
                original_name,
                mime_type,
                size_bytes
            ) values (
                v_resp_id,
                v_att.block_id,
                v_att.storage_path,
                v_att.original_name,
                v_att.mime_type,
                v_att.size_bytes
            );
        end loop;
    end if;
    
    -- Insert consolidated validation record
    insert into public.process_validation_records (
        request_id,
        publication_id,
        organization,
        publication_code,
        result,
        origin,
        respondent_name,
        respondent_role,
        response_date,
        completed_at,
        registered_by,
        notes,
        email_subject,
        declared,
        answers_snapshot,
        pdf_path,
        pdf_hash,
        cleanup_status,
        protocol
    ) values (
        v_pub.request_id,
        v_pub.id,
        v_pub.organization,
        v_pub.publication_code,
        p_primary_decision->>'text',
        'Portal',
        p_respondent_name,
        p_respondent_role,
        now(),
        now(),
        null,
        null,
        null,
        true,
        p_answers,
        v_pub.public_token || '/report.pdf',
        p_pdf_hash,
        'Pendente',
        v_protocol
    );

    -- Insert completed audit event
    insert into public.process_validation_events (
        request_id,
        publication_id,
        event_type,
        event_description,
        metadata
    ) values (
        v_pub.request_id,
        v_pub.id,
        'completed',
        'Validação concluída pelo cliente via Portal PERSPECPACK.',
        jsonb_build_object(
            'respondent_name', p_respondent_name,
            'respondent_role', p_respondent_role,
            'result', p_primary_decision->>'text',
            'protocol', v_protocol
        )
    );

    -- Update publication
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
        'respondent_email', p_respondent_email,
        'primary_decision', p_primary_decision,
        'submitted_at', now()
    );
end;
$$;

-- 8. Update register_manual_validation RPC function to atomically create consolidated validation record & completed event
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
    -- Lock publication to prevent concurrent status updates
    select * into v_pub from public.process_publications 
    where id = p_publication_id 
    for update;
    
    if not found then
        raise exception 'Publication not found.';
    end if;
    
    -- Check if already validated online
    select * into v_exist_online from public.process_validation_responses 
    where publication_id = p_publication_id;
    if found then
        raise exception 'Esta solicitação já foi respondida pelo portal e concluída automaticamente.';
    end if;
    
    -- Check if already validated manually
    select * into v_exist_manual from public.process_manual_validations 
    where publication_id = p_publication_id;
    if found then
        raise exception 'Esta solicitação já possui um registro de validação manual.';
    end if;

    if v_pub.status = 'validated' then
        raise exception 'Esta solicitação já foi concluída.';
    end if;
    
    if v_pub.status = 'revoked' then
        raise exception 'Esta publicação foi revogada.';
    end if;
    
    if not p_declared then
        raise exception 'A declaração de conformidade é obrigatória.';
    end if;
    
    if length(trim(p_respondent_name)) < 3 then
        raise exception 'Nome do responsável inválido (mínimo 3 caracteres).';
    end if;
    
    if length(trim(p_respondent_role)) < 2 then
        raise exception 'Cargo ou função inválido (mínimo 2 caracteres).';
    end if;
    
    -- Generate protocol
    v_protocol := 'MAN-' || lpad(nextval('public.manual_validation_protocol_seq')::text, 6, '0');
    
    -- Insert manual validation registry
    insert into public.process_manual_validations (
        publication_id,
        user_id,
        protocol,
        result,
        respondent_name,
        respondent_role,
        response_date,
        validation_method,
        email_subject,
        notes,
        declared
    ) values (
        p_publication_id,
        auth.uid(),
        v_protocol,
        p_result,
        p_respondent_name,
        p_respondent_role,
        p_response_date,
        p_validation_method,
        p_email_subject,
        p_notes,
        p_declared
    );
    
    -- Map result
    if p_result = 'Aprovado' then
        v_result_type := 'positive';
    elsif p_result = 'Aprovado com Ressalvas' then
        v_result_type := 'warning';
    else
        v_result_type := 'negative';
    end if;
    
    -- Insert consolidated validation record
    insert into public.process_validation_records (
        request_id,
        publication_id,
        organization,
        publication_code,
        result,
        origin,
        respondent_name,
        respondent_role,
        response_date,
        completed_at,
        registered_by,
        notes,
        email_subject,
        declared,
        answers_snapshot,
        pdf_path,
        pdf_hash,
        cleanup_status,
        protocol
    ) values (
        v_pub.request_id,
        v_pub.id,
        v_pub.organization,
        v_pub.publication_code,
        p_result,
        'E-mail',
        p_respondent_name,
        p_respondent_role,
        p_response_date,
        now(),
        auth.uid(),
        p_notes,
        p_email_subject,
        p_declared,
        '[]'::jsonb,
        v_pub.public_token || '/report.pdf',
        null,
        'Pendente',
        v_protocol
    );

    -- Insert completed audit event
    insert into public.process_validation_events (
        request_id,
        publication_id,
        event_type,
        event_description,
        triggered_by,
        metadata
    ) values (
        v_pub.request_id,
        v_pub.id,
        'completed',
        'Validação registrada manualmente pelo usuário interno.',
        auth.uid(),
        jsonb_build_object(
            'respondent_name', p_respondent_name,
            'respondent_role', p_respondent_role,
            'validation_method', p_validation_method,
            'result', p_result,
            'protocol', v_protocol
        )
    );

    -- Update publication status
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

-- 9. Update update_pdf_hash RPC
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

        update public.process_validation_records
        set pdf_hash = p_pdf_hash
        where publication_id = v_pub.id;
    end if;
end;
$$;

-- 10. Update update_manual_pdf_hash RPC
create or replace function public.update_manual_pdf_hash(
    p_publication_id uuid,
    p_pdf_hash text
)
returns void
language plpgsql
security definer
as $$
begin
    update public.process_manual_validations
    set pdf_hash = p_pdf_hash
    where publication_id = p_publication_id;

    update public.process_validation_records
    set pdf_hash = p_pdf_hash
    where publication_id = p_publication_id;
end;
$$;

-- 11. Run backfill migration of existing requests, publications and responses to records and events tables
do $$
declare
    v_rec record;
begin
    -- A. Backfill events for all requests
    insert into public.process_validation_events (request_id, event_type, event_description, created_at)
    select id, 'request_created', 'Solicitação de validação criada.', created_at
    from public.process_requests
    on conflict do nothing;

    -- B. Backfill events for all publications
    insert into public.process_validation_events (request_id, publication_id, event_type, event_description, created_at)
    select request_id, id, 'published', 'Solicitação publicada. Link de validação gerado.', published_at
    from public.process_publications
    on conflict do nothing;

    -- C. Backfill events for validated online responses
    insert into public.process_validation_events (request_id, publication_id, event_type, event_description, created_at, metadata)
    select p.request_id, p.id, 'completed', 'Validação concluída pelo cliente via Portal PERSPECPACK.', r.submitted_at, 
           jsonb_build_object('respondent_name', r.respondent_name, 'respondent_role', r.respondent_role, 'result', p.primary_result, 'protocol', r.protocol)
    from public.process_publications p
    join public.process_validation_responses r on r.publication_id = p.id
    where p.status = 'validated'
    on conflict do nothing;

    -- D. Backfill events for validated manual responses
    insert into public.process_validation_events (request_id, publication_id, event_type, event_description, triggered_by, created_at, metadata)
    select p.request_id, p.id, 'completed', 'Validação registrada manualmente pelo usuário interno.', m.user_id, m.created_at, 
           jsonb_build_object('respondent_name', m.respondent_name, 'respondent_role', m.respondent_role, 'validation_method', m.validation_method, 'result', m.result, 'protocol', m.protocol)
    from public.process_publications p
    join public.process_manual_validations m on m.publication_id = p.id
    where p.status = 'validated'
    on conflict do nothing;

    -- E. Backfill cleanup events (assume completed for existing validated publications)
    insert into public.process_validation_events (request_id, publication_id, event_type, event_description, created_at)
    select request_id, id, 'cleanup_completed', 'Limpeza de arquivos temporários concluída.', validated_at
    from public.process_publications
    where status = 'validated'
    on conflict do nothing;

    -- F. Backfill records for online validation responses
    insert into public.process_validation_records (
        request_id, publication_id, organization, publication_code, result, origin,
        respondent_name, respondent_role, response_date, completed_at, notes,
        email_subject, declared, answers_snapshot, pdf_path, pdf_hash, cleanup_status, protocol
    )
    select 
        p.request_id, p.id, p.organization, p.publication_code, coalesce(p.primary_result, 'Aprovado'), 'Portal',
        r.respondent_name, r.respondent_role, r.submitted_at, p.validated_at, null,
        null, true, r.answers, p.public_token || '/report.pdf', r.pdf_hash, 'Concluída', r.protocol
    from public.process_publications p
    join public.process_validation_responses r on r.publication_id = p.id
    where p.status = 'validated'
    on conflict do nothing;

    -- G. Backfill records for manual validation responses
    insert into public.process_validation_records (
        request_id, publication_id, organization, publication_code, result, origin,
        respondent_name, respondent_role, response_date, completed_at, registered_by,
        notes, email_subject, declared, answers_snapshot, pdf_path, pdf_hash, cleanup_status, protocol
    )
    select 
        p.request_id, p.id, p.organization, p.publication_code, m.result, 'E-mail',
        m.respondent_name, m.respondent_role, m.response_date, m.created_at, m.user_id,
        m.notes, m.email_subject, m.declared, '[]'::jsonb, p.public_token || '/report.pdf', m.pdf_hash, 'Concluída', m.protocol
    from public.process_publications p
    join public.process_manual_validations m on m.publication_id = p.id
    where p.status = 'validated'
    on conflict do nothing;

    -- H. Backfill records for legacy validated publications with missing detailed responses
    insert into public.process_validation_records (
        request_id, publication_id, organization, publication_code, result, origin,
        respondent_name, respondent_role, response_date, completed_at, notes,
        declared, answers_snapshot, pdf_path, cleanup_status, protocol
    )
    select 
        p.request_id, p.id, p.organization, p.publication_code, coalesce(p.primary_result, 'Aprovado'), 'Portal',
        'Histórico parcial — dados detalhados não disponíveis para esta validação anterior.', 'N/A', 
        coalesce(p.validated_at, p.published_at), coalesce(p.validated_at, p.published_at), 
        'Histórico parcial — dados detalhados não disponíveis para esta validação anterior.',
        false, '[]'::jsonb, p.public_token || '/report.pdf', 'Concluída', 'VAL-000000'
    from public.process_publications p
    left join public.process_validation_responses r on r.publication_id = p.id
    left join public.process_manual_validations m on m.publication_id = p.id
    where p.status = 'validated'
      and r.id is null
      and m.id is null
    on conflict do nothing;
end;
$$;
