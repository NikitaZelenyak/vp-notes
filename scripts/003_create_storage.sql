-- Create storage bucket for images and canvas exports
insert into storage.buckets (id, name, public)
values ('study-notes-assets', 'study-notes-assets', false)
on conflict (id) do nothing;

-- Storage policies for study-notes-assets bucket
create policy "Users can view their own assets"
  on storage.objects for select
  using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own assets"
  on storage.objects for insert
  with check (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own assets"
  on storage.objects for update
  using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own assets"
  on storage.objects for delete
  using (bucket_id = 'study-notes-assets' and auth.uid()::text = (storage.foldername(name))[1]);
