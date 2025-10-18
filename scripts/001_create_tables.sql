-- Create modules table
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create pages table
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create subpages table
create table if not exists public.subpages (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create blocks table
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  subpage_id uuid references public.subpages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('text', 'canvas', 'image')),
  content jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint block_parent_check check (
    (page_id is not null and subpage_id is null) or
    (page_id is null and subpage_id is not null)
  )
);

-- Create indexes for better query performance
create index if not exists idx_modules_user_id on public.modules(user_id);
create index if not exists idx_pages_module_id on public.pages(module_id);
create index if not exists idx_pages_user_id on public.pages(user_id);
create index if not exists idx_subpages_page_id on public.subpages(page_id);
create index if not exists idx_subpages_user_id on public.subpages(user_id);
create index if not exists idx_blocks_page_id on public.blocks(page_id);
create index if not exists idx_blocks_subpage_id on public.blocks(subpage_id);
create index if not exists idx_blocks_user_id on public.blocks(user_id);
