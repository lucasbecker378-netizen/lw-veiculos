-- Crie primeiro o usuário em Authentication > Users > Add user.
-- Depois substitua UUID_DO_USUARIO pelo ID/UUID do usuário:
insert into public.admins(user_id) values('UUID_DO_USUARIO') on conflict(user_id) do nothing;
