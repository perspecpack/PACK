-- Create processes table
create table if not exists public.processes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    category text,
    organization text,
    blocks jsonb default '[]'::jsonb not null,
    status text not null default 'draft',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.processes enable row level security;

-- Create policies for processes
create policy "Users can view their own processes or master can view all" 
on public.processes for select 
using (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
);

create policy "Users can insert their own processes" 
on public.processes for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own processes or master can update all" 
on public.processes for update 
using (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
)
with check (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
);

create policy "Users can delete their own processes or master can delete all" 
on public.processes for delete 
using (
    (auth.uid() = user_id) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%master%'::text) 
    or ((auth.jwt() ->> 'email'::text) ~~ '%admin%'::text) 
    or ((auth.jwt() ->> 'email'::text) = 'perspec03d@gmail.com'::text)
);
