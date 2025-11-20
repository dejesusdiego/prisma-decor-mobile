-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS policy: All users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on materiais
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar materiais" ON public.materiais;
DROP POLICY IF EXISTS "Usuários autenticados podem ver materiais" ON public.materiais;

-- Create new restrictive policies for materiais
CREATE POLICY "All authenticated users can view materials"
ON public.materiais
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify materials"
ON public.materiais
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on servicos_confeccao
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar serviços confecção" ON public.servicos_confeccao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços confecção" ON public.servicos_confeccao;

-- Create new restrictive policies for servicos_confeccao
CREATE POLICY "All authenticated users can view sewing services"
ON public.servicos_confeccao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify sewing services"
ON public.servicos_confeccao
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on servicos_instalacao
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar serviços instalação" ON public.servicos_instalacao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços instalação" ON public.servicos_instalacao;

-- Create new restrictive policies for servicos_instalacao
CREATE POLICY "All authenticated users can view installation services"
ON public.servicos_instalacao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify installation services"
ON public.servicos_instalacao
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));