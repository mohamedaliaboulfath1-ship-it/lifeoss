-- Allow authenticated users to create their own profile (e.g. legacy accounts before trigger)
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);
