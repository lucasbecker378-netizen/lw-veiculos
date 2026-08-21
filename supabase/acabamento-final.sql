-- LW VEÍCULOS — acabamento final
-- Execute uma única vez no Supabase SQL Editor.

alter table public.vehicles
add column if not exists internal_notes text;

alter table public.vehicles
add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_vehicle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_vehicle_updated_at on public.vehicles;
create trigger trigger_vehicle_updated_at
before update on public.vehicles
for each row
execute function public.set_vehicle_updated_at();

update public.vehicles
set updated_at = coalesce(updated_at, created_at, now());
