-- LW VEÍCULOS — permitir reordenação de fotos já salvas
-- Execute uma única vez no SQL Editor do Supabase.

drop policy if exists "admins update vehicle images" on public.vehicle_images;

create policy "admins update vehicle images"
on public.vehicle_images
for update
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
  )
);
