-- Crie primeiro o usuário em Authentication > Users > Add user.
-- Depois substitua UUID_DO_USUARIO pelo ID/UUID do usuário:
insert into public.admins(user_id) values('fbed29e6-e4ec-47d3-bc95-8b38d8698e93') on conflict(user_id) do nothing;
