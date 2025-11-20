-- Fix orcamentos SELECT policy to restrict access to user's own quotations
DROP POLICY "Usuários podem ver seus orçamentos" ON public.orcamentos;

CREATE POLICY "Usuários podem ver seus orçamentos" ON public.orcamentos
  FOR SELECT
  USING (auth.uid() = created_by_user_id);