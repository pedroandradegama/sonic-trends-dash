-- Confirmar o email da usuária gabriela@teste.com para permitir acesso ao dashboard
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'gabriela@teste.com' AND email_confirmed_at IS NULL;