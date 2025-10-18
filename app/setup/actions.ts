"use server";

import { Pool } from "pg";

export async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_POSTGRES_URL!,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("[v0] Starting database initialization...");

    // SQL script 1: Create tables
    await pool.query(`
      create table if not exists public.modules (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        title text not null,
        position integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists public.pages (
        id uuid primary key default gen_random_uuid(),
        module_id uuid not null references public.modules(id) on delete cascade,
        user_id uuid not null references auth.users(id) on delete cascade,
        title text not null,
        position integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists public.subpages (
        id uuid primary key default gen_random_uuid(),
        page_id uuid not null references public.pages(id) on delete cascade,
        user_id uuid not null references auth.users(id) on delete cascade,
        title text not null,
        position integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

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

      create index if not exists idx_modules_user_id on public.modules(user_id);
      create index if not exists idx_pages_module_id on public.pages(module_id);
      create index if not exists idx_pages_user_id on public.pages(user_id);
      create index if not exists idx_subpages_page_id on public.subpages(page_id);
      create index if not exists idx_subpages_user_id on public.subpages(user_id);
      create index if not exists idx_blocks_page_id on public.blocks(page_id);
      create index if not exists idx_blocks_subpage_id on public.blocks(subpage_id);
      create index if not exists idx_blocks_user_id on public.blocks(user_id);
    `);

    console.log("[v0] Tables created successfully");

    // SQL script 2: Enable RLS
    await pool.query(`
      alter table public.modules enable row level security;
      alter table public.pages enable row level security;
      alter table public.subpages enable row level security;
      alter table public.blocks enable row level security;
    `);

    console.log("[v0] RLS enabled");

    // Create RLS policies for modules
    await pool.query(`
      drop policy if exists "Users can view their own modules" on public.modules;
      create policy "Users can view their own modules" on public.modules for select using (auth.uid() = user_id);
      
      drop policy if exists "Users can insert their own modules" on public.modules;
      create policy "Users can insert their own modules" on public.modules for insert with check (auth.uid() = user_id);
      
      drop policy if exists "Users can update their own modules" on public.modules;
      create policy "Users can update their own modules" on public.modules for update using (auth.uid() = user_id);
      
      drop policy if exists "Users can delete their own modules" on public.modules;
      create policy "Users can delete their own modules" on public.modules for delete using (auth.uid() = user_id);
    `);

    // Create RLS policies for pages
    await pool.query(`
      drop policy if exists "Users can view their own pages" on public.pages;
      create policy "Users can view their own pages" on public.pages for select using (auth.uid() = user_id);
      
      drop policy if exists "Users can insert their own pages" on public.pages;
      create policy "Users can insert their own pages" on public.pages for insert with check (auth.uid() = user_id);
      
      drop policy if exists "Users can update their own pages" on public.pages;
      create policy "Users can update their own pages" on public.pages for update using (auth.uid() = user_id);
      
      drop policy if exists "Users can delete their own pages" on public.pages;
      create policy "Users can delete their own pages" on public.pages for delete using (auth.uid() = user_id);
    `);

    // Create RLS policies for subpages
    await pool.query(`
      drop policy if exists "Users can view their own subpages" on public.subpages;
      create policy "Users can view their own subpages" on public.subpages for select using (auth.uid() = user_id);
      
      drop policy if exists "Users can insert their own subpages" on public.subpages;
      create policy "Users can insert their own subpages" on public.subpages for insert with check (auth.uid() = user_id);
      
      drop policy if exists "Users can update their own subpages" on public.subpages;
      create policy "Users can update their own subpages" on public.subpages for update using (auth.uid() = user_id);
      
      drop policy if exists "Users can delete their own subpages" on public.subpages;
      create policy "Users can delete their own subpages" on public.subpages for delete using (auth.uid() = user_id);
    `);

    // Create RLS policies for blocks
    await pool.query(`
      drop policy if exists "Users can view their own blocks" on public.blocks;
      create policy "Users can view their own blocks" on public.blocks for select using (auth.uid() = user_id);
      
      drop policy if exists "Users can insert their own blocks" on public.blocks;
      create policy "Users can insert their own blocks" on public.blocks for insert with check (auth.uid() = user_id);
      
      drop policy if exists "Users can update their own blocks" on public.blocks;
      create policy "Users can update their own blocks" on public.blocks for update using (auth.uid() = user_id);
      
      drop policy if exists "Users can delete their own blocks" on public.blocks;
      create policy "Users can delete their own blocks" on public.blocks for delete using (auth.uid() = user_id);
    `);

    console.log("[v0] RLS policies created");

    // SQL script 3: Create storage bucket
    await pool.query(`
      insert into storage.buckets (id, name, public)
      values ('study-notes-assets', 'study-notes-assets', false)
      on conflict (id) do nothing;
    `);

    // Create storage policies
    await pool.query(`
      drop policy if exists "Users can view their own assets" on storage.objects;
      create policy "Users can view their own assets" on storage.objects for select
        using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);
      
      drop policy if exists "Users can upload their own assets" on storage.objects;
      create policy "Users can upload their own assets" on storage.objects for insert
        with check (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);
      
      drop policy if exists "Users can update their own assets" on storage.objects;
      create policy "Users can update their own assets" on storage.objects for update
        using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);
      
      drop policy if exists "Users can delete their own assets" on storage.objects;
      create policy "Users can delete their own assets" on storage.objects for delete
        using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);
    `);

    console.log("[v0] Storage bucket and policies created");

    // SQL script 4: Create functions and triggers
    await pool.query(`
      create or replace function public.update_updated_at_column()
      returns trigger as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$ language plpgsql;
    `);

    await pool.query(`
      drop trigger if exists update_modules_updated_at on public.modules;
      create trigger update_modules_updated_at before update on public.modules
        for each row execute function public.update_updated_at_column();
      
      drop trigger if exists update_pages_updated_at on public.pages;
      create trigger update_pages_updated_at before update on public.pages
        for each row execute function public.update_updated_at_column();
      
      drop trigger if exists update_subpages_updated_at on public.subpages;
      create trigger update_subpages_updated_at before update on public.subpages
        for each row execute function public.update_updated_at_column();
      
      drop trigger if exists update_blocks_updated_at on public.blocks;
      create trigger update_blocks_updated_at before update on public.blocks
        for each row execute function public.update_updated_at_column();
    `);

    console.log("[v0] Functions and triggers created");
    console.log("[v0] Database initialized successfully!");

    return { success: true };
  } catch (error) {
    console.error("[v0] Database initialization error:", error);
    return { success: false, error: (error as any)?.message || String(error) };
  } finally {
    await pool.end();
  }
}
