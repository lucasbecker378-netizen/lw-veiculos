-- LW VEÍCULOS — código identificador automático
-- Execute este arquivo uma única vez no SQL Editor do Supabase.

create sequence if not exists public.vehicle_code_seq start 1;

alter table public.vehicles
add column if not exists vehicle_code text unique;

create or replace function public.generate_vehicle_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vehicle_code is null or btrim(new.vehicle_code) = '' then
    new.vehicle_code := 'LW-' || lpad(nextval('public.vehicle_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_vehicle_code on public.vehicles;

create trigger set_vehicle_code
before insert on public.vehicles
for each row
execute function public.generate_vehicle_code();

-- Preenche códigos em veículos antigos que ainda não tenham código.
update public.vehicles
set vehicle_code = 'LW-' || lpad(nextval('public.vehicle_code_seq')::text, 4, '0')
where vehicle_code is null or btrim(vehicle_code) = '';
