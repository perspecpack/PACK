-- Disable direct publishing of templates via publish_process RPC
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
begin
    raise exception 'Modelos não podem ser publicados diretamente. Utilize o modelo para criar uma nova aprovação.';
end;
$$;
