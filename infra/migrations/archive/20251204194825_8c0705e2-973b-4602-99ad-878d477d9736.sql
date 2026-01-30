-- Drop overly permissive policies on solicitacoes_visita
DROP POLICY IF EXISTS "Authenticated users can view visit requests" ON public.solicitacoes_visita;
DROP POLICY IF EXISTS "Authenticated users can update visit requests" ON public.solicitacoes_visita;

-- Create admin-only SELECT policy
CREATE POLICY "Admins can view visit requests" 
ON public.solicitacoes_visita 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin-only UPDATE policy
CREATE POLICY "Admins can update visit requests" 
ON public.solicitacoes_visita 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));