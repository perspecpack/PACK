-- Add template tracking columns to processes
alter table public.processes 
add column if not exists template_id text,
add column if not exists template_version integer;
