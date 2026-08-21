-- LW VEÍCULOS — upgrade do painel completo
-- Execute UMA vez no Supabase > SQL Editor.

-- 1) Rascunho e ordem dos destaques
alter table public.vehicles
drop constraint if exists vehicles_status_check;

alter table public.vehicles
add constraint vehicles_status_check
check (status in ('draft','available','sold'));

alter table public.vehicles
add column if not exists featured_order integer not null default 0;

-- 2) Políticas para editar e excluir fotos pelo admin
drop policy if exists "admins update vehicle images" on public.vehicle_images;
create policy "admins update vehicle images"
on public.vehicle_images for update to authenticated
using (exists(select 1 from public.admins a where a.user_id=auth.uid()))
with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins delete vehicle images" on public.vehicle_images;
create policy "admins delete vehicle images"
on public.vehicle_images for delete to authenticated
using (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins delete vehicle storage" on storage.objects;
create policy "admins delete vehicle storage"
on storage.objects for delete to authenticated
using (
  bucket_id='vehicle-images'
  and exists(select 1 from public.admins a where a.user_id=auth.uid())
);

-- 3) Público anônimo não lê rascunhos.
drop policy if exists "public read vehicles" on public.vehicles;
drop policy if exists "anon read published vehicles" on public.vehicles;
create policy "anon read published vehicles"
on public.vehicles for select to anon
using (status in ('available','sold'));

drop policy if exists "authenticated read vehicles" on public.vehicles;
create policy "authenticated read vehicles"
on public.vehicles for select to authenticated
using (true);
