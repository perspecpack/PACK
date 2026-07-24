-- Create sequences
create sequence if not exists public.publication_code_seq start with 1;
create sequence if not exists public.validation_protocol_seq start with 1;

-- Create tables
create table if not exists public.process_publications (
    id uuid default gen_random_uuid() primary key,
    process_id uuid references public.processes(id) on delete cascade not null,
    user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
    organization text,
    publication_code text not null,
    version integer not null,
    public_token uuid default gen_random_uuid() not null unique,
    snapshot jsonb not null,
    status text not null default 'awaiting_validation' check (status in ('awaiting_validation', 'validated', 'revoked')),
    primary_result text,
    published_at timestamptz default now() not null,
    validated_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create table if not exists public.process_validation_responses (
    id uuid default gen_random_uuid() primary key,
    publication_id uuid references public.process_publications(id) on delete cascade not null unique,
    protocol text not null unique,
    respondent_name text not null,
    respondent_role text not null,
    respondent_email text,
    answers jsonb not null,
    primary_decision jsonb,
    submitted_at timestamptz default now() not null,
    created_at timestamptz default now() not null
);

create table if not exists public.validation_attachments (
    id uuid default gen_random_uuid() primary key,
    response_id uuid references public.process_validation_responses(id) on delete cascade not null,
    block_id text not null,
    storage_path text not null,
    original_name text not null,
    mime_type text,
    size_bytes integer,
    created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.process_publications enable row level security;
alter table public.process_validation_responses enable row level security;
alter table public.validation_attachments enable row level security;

-- Policies for process_publications
create policy "Owners/admins can manage publications"
on public.process_publications
using (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
);

-- Policies for process_validation_responses
create policy "Owners/admins can manage validation responses"
on public.process_validation_responses
using (
    exists (
        select 1 from public.process_publications p
        where p.id = publication_id
        and (
            p.user_id = auth.uid()
            or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
            or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
            or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
        )
    )
);

-- Policies for validation_attachments
create policy "Owners/admins can manage validation attachments"
on public.validation_attachments
using (
    exists (
        select 1 from public.process_validation_responses r
        join public.process_publications p on p.id = r.publication_id
        where r.id = response_id
        and (
            p.user_id = auth.uid()
            or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
            or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
            or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
        )
    )
);

-- Create private bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('validation-attachments', 'validation-attachments', false, 52428800, null)
on conflict (id) do nothing;

-- Create storage insert policy for public users
create policy "Allow public uploads to validation-attachments by token"
on storage.objects for insert
with check (
    bucket_id = 'validation-attachments'
    and (
        exists (
            select 1 from public.process_publications
            where public_token::text = split_part(name, '/', 1)
            and status = 'awaiting_validation'
        )
    )
);

-- Create storage select policy for owners/admins
create policy "Allow owners and admins to select validation-attachments"
on storage.objects for select
using (
    bucket_id = 'validation-attachments'
    and (
        exists (
            select 1 from public.process_publications p
            where p.public_token::text = split_part(name, '/', 1)
            and (
                p.user_id = auth.uid()
                or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
                or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
                or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
            )
        )
    )
);

-- RPC Functions
create or replace function public.get_public_publication(p_token uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_pub record;
    v_resp record;
    v_result json;
begin
    select * into v_pub from public.process_publications where public_token = p_token and status != 'revoked';
    if not found then
        return null;
    end if;
    
    if v_pub.status = 'validated' then
        select * into v_resp from public.process_validation_responses where publication_id = v_pub.id;
        v_result := json_build_object(
            'publication', json_build_object(
                'id', v_pub.id,
                'name', v_pub.snapshot->>'name',
                'description', v_pub.snapshot->>'description',
                'category', v_pub.snapshot->>'category',
                'organization', v_pub.organization,
                'publication_code', v_pub.publication_code,
                'version', v_pub.version,
                'status', v_pub.status,
                'snapshot', v_pub.snapshot,
                'published_at', v_pub.published_at,
                'validated_at', v_pub.validated_at
            ),
            'response', json_build_object(
                'protocol', v_resp.protocol,
                'respondent_name', v_resp.respondent_name,
                'respondent_role', v_resp.respondent_role,
                'respondent_email', v_resp.respondent_email,
                'primary_decision', v_resp.primary_decision,
                'submitted_at', v_resp.submitted_at
            )
        );
    else
        v_result := json_build_object(
            'publication', json_build_object(
                'id', v_pub.id,
                'name', v_pub.snapshot->>'name',
                'description', v_pub.snapshot->>'description',
                'category', v_pub.snapshot->>'category',
                'organization', v_pub.organization,
                'publication_code', v_pub.publication_code,
                'version', v_pub.version,
                'status', v_pub.status,
                'snapshot', v_pub.snapshot,
                'published_at', v_pub.published_at,
                'validated_at', null
            ),
            'response', null
        );
    end if;
    
    return v_result;
end;
$$;

create or replace function public.submit_validation_response(
    p_token uuid,
    p_respondent_name text,
    p_respondent_role text,
    p_respondent_email text,
    p_answers jsonb,
    p_primary_decision jsonb,
    p_attachments jsonb
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
    -- 1. Validate respondent metadata
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
    
    -- 2. Validate individual blocks against snapshot configuration
    for v_block in 
        select * from jsonb_to_recordset(v_pub.snapshot->'blocks') 
        as x(id text, type text, title text, required boolean, declarationText text, decisions jsonb, options jsonb, minSelections integer, maxSelections integer)
    loop
        -- Fetch respondent answer record for this block
        select * into v_ans from jsonb_to_recordset(p_answers) 
        as y(block_id text, answer text, comment text, confirmed boolean, selected_option_labels jsonb, attached_files jsonb)
        where y.block_id = v_block.id;
        
        if v_block.type = 'heading_text' then
            continue;
        end if;
        
        -- Check required constraints
        if v_block.required then
            if v_block.type = 'acknowledgement' and (v_ans.confirmed is null or v_ans.confirmed = false) then
                raise exception 'O campo "%" é obrigatório e precisa ser aceito.', v_block.title;
            end if;
            
            if v_block.type = 'approval_decision' then
                if v_ans.answer is null or v_ans.answer = '' then
                    raise exception 'Uma decisão para o campo "%" deve ser selecionada.', v_block.title;
                end if;
                
                -- Check comment validation on selected decision
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
                if v_ans.answer is null or trim(v_ans.answer) = '' then
                    raise exception 'O campo "%" é obrigatório.', v_block.title;
                end if;
            end if;
        end if;
        
        -- Check selections limit for checkbox block
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
        primary_decision
    ) values (
        v_pub.id,
        v_protocol,
        p_respondent_name,
        p_respondent_role,
        p_respondent_email,
        p_answers,
        p_primary_decision
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

create or replace function public.publish_process(
    p_process_id uuid,
    p_organization text,
    p_snapshot jsonb,
    p_revoke_previous boolean
)
returns json
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_version integer;
    v_pub_code text;
    v_pub_id uuid;
    v_token uuid;
    v_result json;
begin
    -- Verify ownership
    select user_id into v_user_id from public.processes where id = p_process_id;
    if not found then
        raise exception 'Process not found.';
    end if;
    
    if v_user_id != auth.uid() and not (
        ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
        or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
        or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
    ) then
        raise exception 'Permission denied.';
    end if;
    
    -- Calculate next version
    select coalesce(max(version), 0) + 1 into v_version 
    from public.process_publications 
    where process_id = p_process_id;
    
    -- Generate PUB code
    v_pub_code := 'PUB-' || lpad(nextval('public.publication_code_seq')::text, 6, '0');
    
    -- Revoke previous awaiting validation if requested
    if p_revoke_previous then
        update public.process_publications
        set status = 'revoked',
            revoked_at = now(),
            updated_at = now()
        where process_id = p_process_id
        and status = 'awaiting_validation';
    end if;
    
    -- Generate random token
    v_token := gen_random_uuid();
    
    -- Insert publication
    insert into public.process_publications (
        process_id,
        user_id,
        organization,
        publication_code,
        version,
        public_token,
        snapshot,
        status
    ) values (
        p_process_id,
        v_user_id,
        p_organization,
        v_pub_code,
        v_version,
        v_token,
        p_snapshot,
        'awaiting_validation'
    ) returning id into v_pub_id;
    
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

