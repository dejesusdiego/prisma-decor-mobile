-- Criar políticas para o bucket de comprovantes

-- Permitir que usuários autenticados visualizem seus próprios comprovantes
CREATE POLICY "Usuários podem ver comprovantes que enviaram"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados façam upload de comprovantes na própria pasta
CREATE POLICY "Usuários podem enviar comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que admins visualizem todos os comprovantes
CREATE POLICY "Admins podem ver todos comprovantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'comprovantes' AND 
  public.has_role(auth.uid(), 'admin')
);