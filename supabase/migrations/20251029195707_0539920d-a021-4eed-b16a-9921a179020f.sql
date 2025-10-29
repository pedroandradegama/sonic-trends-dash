-- Criar política RLS para permitir usuários autenticados visualizarem dados de NPS
CREATE POLICY "Authenticated users can view NPS data" 
ON public."NPS"
FOR SELECT 
USING (auth.role() = 'authenticated');
