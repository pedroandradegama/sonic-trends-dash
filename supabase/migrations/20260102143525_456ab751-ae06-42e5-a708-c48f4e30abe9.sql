-- Adicionar role de admin para belisa@teste.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('38a7e70b-8c86-4590-86e9-d8e0443f1d6a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;