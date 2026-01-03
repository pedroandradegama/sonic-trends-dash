-- Add last_login_at column to authorized_doctors table
ALTER TABLE public.authorized_doctors 
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;