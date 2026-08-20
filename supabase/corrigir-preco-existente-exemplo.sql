-- EXEMPLO para corrigir um veículo que foi salvo como 39,9 em vez de 39.900,00.
-- Troque LW-0002 pelo código desejado, se necessário.
-- Execute somente após conferir o veículo.

update public.vehicles
set price = 39900.00
where vehicle_code = 'LW-0002';
