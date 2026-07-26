-- Corrige a validação de blocos obrigatórios na função RPC submit_validation_response
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
                if (v_ans.answer is null or trim(v_ans.answer) = '') and (v_ans.selected_option_labels is null or jsonb_array_length(v_ans.selected_option_labels) = 0) then
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
