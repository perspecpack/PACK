-- Enable UUID generation extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Organizations Table
create table if not exists public.organizations (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    organization_type text not null,
    logo_url text,
    description text,
    status text not null default 'active',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 2. Organization Modules Table
create table if not exists public.organization_modules (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    module_type text not null,
    enabled boolean not null default false,
    created_at timestamptz default now() not null,
    unique(organization_id, module_type)
);

-- 3. Components Table
create table if not exists public.components (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    description text,
    application text,
    revision text not null default 'A',
    status text not null default 'active',
    step_file_url text,
    pdf_file_url text,
    dwg_file_url text,
    image_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 4. Documents Table
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    title text not null,
    description text,
    document_type text not null,
    revision text not null default 'A',
    status text not null default 'active',
    file_url text,
    file_name text,
    file_type text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 5. Standards Table
create table if not exists public.standards (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    title text not null,
    description text,
    revision text not null default 'A',
    status text not null default 'active',
    reference_document text,
    file_url text,
    file_name text,
    file_type text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 6. Checklists Table
create table if not exists public.checklists (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    revision text not null default '01',
    status text not null default 'active',
    file_url text,
    file_name text,
    file_type text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 7. Checklist Items Table
create table if not exists public.checklist_items (
    id uuid default gen_random_uuid() primary key,
    checklist_id uuid references public.checklists(id) on delete cascade not null,
    category text not null,
    description text not null,
    required boolean not null default true,
    reference text,
    sort_order integer not null default 0,
    created_at timestamptz default now() not null
);

-- 8. Reference Projects Table
create table if not exists public.reference_projects (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    description text,
    application text,
    image_url text,
    attachment_url text,
    attachment_name text,
    attachment_type text,
    status text not null default 'active',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS (Optional, can be modified as needed, keeping them accessible for development)
alter table public.organizations enable row level security;
alter table public.organization_modules enable row level security;
alter table public.components enable row level security;
alter table public.documents enable row level security;
alter table public.standards enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.reference_projects enable row level security;

-- Create basic permissive policies for dev
create policy "Allow all actions on organizations" on public.organizations for all using (true) with check (true);
create policy "Allow all actions on organization_modules" on public.organization_modules for all using (true) with check (true);
create policy "Allow all actions on components" on public.components for all using (true) with check (true);
create policy "Allow all actions on documents" on public.documents for all using (true) with check (true);
create policy "Allow all actions on standards" on public.standards for all using (true) with check (true);
create policy "Allow all actions on checklists" on public.checklists for all using (true) with check (true);
create policy "Allow all actions on checklist_items" on public.checklist_items for all using (true) with check (true);
create policy "Allow all actions on reference_projects" on public.reference_projects for all using (true) with check (true);

-- Create Storage Buckets (inserts into storage.buckets table)
insert into storage.buckets (id, name, public) values ('organization-logos', 'organization-logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('components', 'components', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('standards', 'standards', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('checklists', 'checklists', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('reference-projects', 'reference-projects', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;

