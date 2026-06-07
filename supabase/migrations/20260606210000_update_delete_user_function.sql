CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  caller_email TEXT;
  target_email TEXT;
BEGIN
  -- Get the email of the current authenticated user calling the function
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the caller is the master admin (case-insensitive check)
  IF LOWER(caller_email) != 'perspec03d@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas o administrador master pode excluir usuários.';
  END IF;

  -- Get target user's email
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  
  -- 1. Delete execution items
  DELETE FROM public.checklist_execution_items 
  WHERE execution_id IN (
    SELECT id FROM public.checklist_executions 
    WHERE user_id = target_email OR user_id = target_user_id::text
  );

  -- 2. Delete checklist executions
  DELETE FROM public.checklist_executions 
  WHERE user_id = target_email OR user_id = target_user_id::text;

  -- 3. Delete downloads log
  DELETE FROM public.downloads_log 
  WHERE user_id = target_email OR user_id = target_user_id::text;

  -- 4. Delete uploads log
  DELETE FROM public.uploads_log 
  WHERE user_id = target_email OR user_id = target_user_id::text;

  -- 5. Delete page access log
  DELETE FROM public.page_access_log 
  WHERE user_id = target_email OR user_id = target_user_id::text;

  -- 6. Delete support requests
  DELETE FROM public.support_requests 
  WHERE user_id = target_user_id;

  -- 7. Delete upgrade requests
  DELETE FROM public.upgrade_requests 
  WHERE user_id = target_user_id;

  -- 8. Delete password reset requests
  DELETE FROM public.password_reset_requests 
  WHERE user_id = target_user_id;

  -- 9. Delete user profile
  DELETE FROM public.user_profiles 
  WHERE user_id = target_user_id;

  -- 10. Delete from auth.users (remover do Supabase Auth)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN TRUE;
END;
$function$;
