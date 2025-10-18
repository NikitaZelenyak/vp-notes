-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to automatically update updated_at
create trigger update_modules_updated_at
  before update on public.modules
  for each row
  execute function public.update_updated_at_column();

create trigger update_pages_updated_at
  before update on public.pages
  for each row
  execute function public.update_updated_at_column();

create trigger update_subpages_updated_at
  before update on public.subpages
  for each row
  execute function public.update_updated_at_column();

create trigger update_blocks_updated_at
  before update on public.blocks
  for each row
  execute function public.update_updated_at_column();
