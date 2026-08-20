create extension if not exists pgcrypto;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  model text not null,
  version text,
  year integer not null check (year between 1900 and 2100),
  model_year integer check (model_year between 1900 and 2100),
  mileage integer not null default 0 check (mileage >= 0),
  price numeric(12,2) not null check (price >= 0),
  transmission text not null,
  fuel text not null,
  color text,
  description text,
  optional_items text[] default '{}',
  status text not null default 'available' check (status in ('available','sold')),
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.admins enable row level security;

drop policy if exists "public read vehicles" on public.vehicles;
create policy "public read vehicles" on public.vehicles for select to anon, authenticated using (true);

drop policy if exists "public read vehicle images" on public.vehicle_images;
create policy "public read vehicle images" on public.vehicle_images for select to anon, authenticated using (true);

drop policy if exists "admin can read own admin row" on public.admins;
create policy "admin can read own admin row" on public.admins for select to authenticated using (auth.uid()=user_id);

drop policy if exists "admins insert vehicles" on public.vehicles;
create policy "admins insert vehicles" on public.vehicles for insert to authenticated
with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins update vehicles" on public.vehicles;
create policy "admins update vehicles" on public.vehicles for update to authenticated
using (exists(select 1 from public.admins a where a.user_id=auth.uid()))
with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins delete vehicles" on public.vehicles;
create policy "admins delete vehicles" on public.vehicles for delete to authenticated
using (exists(select 1 from public.admins a where a.user_id=auth.uid()));

drop policy if exists "admins insert vehicle images" on public.vehicle_images;
create policy "admins insert vehicle images" on public.vehicle_images for insert to authenticated
with check (exists(select 1 from public.admins a where a.user_id=auth.uid()));

insert into storage.buckets(id,name,public) values('vehicle-images','vehicle-images',true)
on conflict(id) do update set public=true;

drop policy if exists "public read vehicle storage" on storage.objects;
create policy "public read vehicle storage" on storage.objects for select to public
using(bucket_id='vehicle-images');

drop policy if exists "admins upload vehicle storage" on storage.objects;
create policy "admins upload vehicle storage" on storage.objects for insert to authenticated
with check(bucket_id='vehicle-images' and exists(select 1 from public.admins a where a.user_id=auth.uid()));
