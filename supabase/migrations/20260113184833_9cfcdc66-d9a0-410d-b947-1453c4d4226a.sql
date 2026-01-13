-- Create table for schedule opening communications
CREATE TABLE public.agenda_comunicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medico_nome TEXT NOT NULL,
  data_agenda DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agenda_comunicacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (doctors can see their own entries)
CREATE POLICY "Users can view their own agenda communications" 
ON public.agenda_comunicacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agenda communications" 
ON public.agenda_comunicacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agenda communications" 
ON public.agenda_comunicacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agenda communications" 
ON public.agenda_comunicacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Master admin can view all entries
CREATE POLICY "Master admin can view all agenda communications"
ON public.agenda_comunicacoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'master_admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agenda_comunicacoes_updated_at
BEFORE UPDATE ON public.agenda_comunicacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();