-- Adiciona a coluna faltante na tabela de publicações
alter table public.process_publications 
add column if not exists primary_result_type text;

-- Cria índices úteis de performance
create index if not exists idx_process_publications_status on public.process_publications(status);
create index if not exists idx_process_publications_token on public.process_publications(public_token);
create index if not exists idx_process_validation_responses_pub_id on public.process_validation_responses(publication_id);

-- Atualiza a função get_public_publication para retornar primary_result_type
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
                'validated_at', v_pub.validated_at,
                'primary_result_type', v_pub.primary_result_type
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
                'validated_at', null,
                'primary_result_type', null
            ),
            'response', null
        );
    end if;
    
    return v_result;
end;
$$;

-- Função auxiliar com 'security definer' para contornar RLS no Storage para uploads públicos
create or replace function public.check_upload_token(p_token text)
returns boolean
language plpgsql
security definer
as $$
begin
    return exists (
        select 1 from public.process_publications
        where public_token::text = p_token
        and status = 'awaiting_validation'
    );
end;
$$;

-- Atualiza a política de upload no storage bucket
drop policy if exists "Allow public uploads to validation-attachments by token" on storage.objects;

create policy "Allow public uploads to validation-attachments by token"
on storage.objects for insert
with check (
    bucket_id = 'validation-attachments'
    and public.check_upload_token(split_part(name, '/', 1))
);
