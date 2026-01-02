-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'medico');

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabela de médicos autorizados (pré-cadastro pelo admin)
CREATE TABLE public.authorized_doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    nome text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    registered_at timestamp with time zone DEFAULT NULL -- quando o médico se registrou
);

-- Enable RLS
ALTER TABLE public.authorized_doctors ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (security definer para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se email está autorizado
CREATE OR REPLACE FUNCTION public.is_email_authorized(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorized_doctors
    WHERE email = lower(_email)
      AND is_active = true
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para authorized_doctors
CREATE POLICY "Admins can view all authorized doctors"
ON public.authorized_doctors
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert authorized doctors"
ON public.authorized_doctors
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update authorized doctors"
ON public.authorized_doctors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete authorized doctors"
ON public.authorized_doctors
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que usuários anônimos verifiquem se email está autorizado (para primeiro acesso)
CREATE POLICY "Anyone can check if email is authorized"
ON public.authorized_doctors
FOR SELECT
TO anon
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_authorized_doctors_updated_at
BEFORE UPDATE ON public.authorized_doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir belisa@teste.com como admin
INSERT INTO public.authorized_doctors (email, nome, is_active, registered_at)
VALUES ('belisa@teste.com', 'BELISA BARRETO GOMES DA SILVA', true, now());