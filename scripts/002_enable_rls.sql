-- Enable Row Level Security on all tables
alter table public.modules enable row level security;
alter table public.pages enable row level security;
alter table public.subpages enable row level security;
alter table public.blocks enable row level security;

-- RLS Policies for modules table
create policy "Users can view their own modules"
  on public.modules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own modules"
  on public.modules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own modules"
  on public.modules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own modules"
  on public.modules for delete
  using (auth.uid() = user_id);

-- RLS Policies for pages table
create policy "Users can view their own pages"
  on public.pages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own pages"
  on public.pages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pages"
  on public.pages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own pages"
  on public.pages for delete
  using (auth.uid() = user_id);

-- RLS Policies for subpages table
create policy "Users can view their own subpages"
  on public.subpages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subpages"
  on public.subpages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subpages"
  on public.subpages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subpages"
  on public.subpages for delete
  using (auth.uid() = user_id);

-- RLS Policies for blocks table
create policy "Users can view their own blocks"
  on public.blocks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own blocks"
  on public.blocks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own blocks"
  on public.blocks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own blocks"
  on public.blocks for delete
  using (auth.uid() = user_id);
