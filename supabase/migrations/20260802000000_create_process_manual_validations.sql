-- 1. Cria sequence para protocolos de validação manual
create sequence if not exists public.manual_validation_protocol_seq start with 1;

-- 2. Cria tabela de validações manuais
create table if not exists public.process_manual_validations (
    id uuid default gen_random_uuid() primary key,
    publication_id uuid references public.process_publications(id) on delete cascade not null unique,
    user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
    protocol text not null unique default ('MAN-' || lpad(nextval('public.manual_validation_protocol_seq')::text, 6, '0')),
    result text not null check (result in ('Aprovado', 'Aprovado com Ressalvas', 'Reprovado')),
    respondent_name text not null,
    respondent_role text not null,
    response_date date not null,
    validation_method text not null default 'E-mail' check (validation_method in ('E-mail', 'Portal', 'Reunião', 'Documento Assinado', 'Telefone', 'Outro')),
    email_subject text,
    notes text,
    declared boolean not null check (declared = true),
    pdf_hash text,
    created_at timestamptz default now() not null
);

-- 3. Habilita RLS na tabela
alter table public.process_manual_validations enable row level security;

-- 4. Cria política de acesso para owners/admins
create policy "Owners/admins can manage manual validations"
on public.process_manual_validations
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

-- 5. Cria RPC para registro atômico e seguro da validação manual
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

-- 6. Cria RPC para atualizar pdf_hash da validação manual
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
end;
$$;
