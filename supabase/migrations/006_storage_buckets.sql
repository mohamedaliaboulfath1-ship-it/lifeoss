-- LifeOS Pro — Storage buckets for progress photos & book covers

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "progress_photos_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress_photos_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "book_covers_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "book_covers_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "book_covers_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);
