-- Allow upsert (overwrite) on book-covers and progress-photos

create policy "book_covers_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "progress_photos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
