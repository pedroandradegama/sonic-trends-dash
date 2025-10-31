-- Remover política antiga que permite todos usuários autenticados verem todos os dados
DROP POLICY IF EXISTS "Authenticated users can view NPS data" ON public."NPS";

-- Criar política para que médicos vejam apenas seu próprio NPS
CREATE POLICY "Users can only view their own NPS data" 
ON public."NPS"
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.user_id = auth.uid() 
  AND profiles.medico_nome = "NPS"."prestador_nome"
));