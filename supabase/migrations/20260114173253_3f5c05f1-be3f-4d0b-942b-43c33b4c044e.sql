-- Create table for ultrasound articles (Radar de Artigos)
CREATE TABLE public.ultrasound_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  publication_date DATE,
  subgroup TEXT NOT NULL DEFAULT 'outros',
  tags TEXT[] DEFAULT '{}',
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX idx_ultrasound_articles_source ON public.ultrasound_articles(source);
CREATE INDEX idx_ultrasound_articles_subgroup ON public.ultrasound_articles(subgroup);
CREATE INDEX idx_ultrasound_articles_publication_date ON public.ultrasound_articles(publication_date DESC);
CREATE INDEX idx_ultrasound_articles_is_active ON public.ultrasound_articles(is_active);

-- Enable Row Level Security
ALTER TABLE public.ultrasound_articles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- All authenticated users can view active articles
CREATE POLICY "Authenticated users can view active articles"
ON public.ultrasound_articles
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

-- Admins can view all articles (including inactive)
CREATE POLICY "Admins can view all articles"
ON public.ultrasound_articles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert articles
CREATE POLICY "Admins can insert articles"
ON public.ultrasound_articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update articles
CREATE POLICY "Admins can update articles"
ON public.ultrasound_articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
ON public.ultrasound_articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates (reuse existing function)
CREATE TRIGGER update_ultrasound_articles_updated_at
BEFORE UPDATE ON public.ultrasound_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for article click tracking
CREATE TABLE public.article_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.ultrasound_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_clicks_article_id ON public.article_clicks(article_id);
CREATE INDEX idx_article_clicks_user_id ON public.article_clicks(user_id);

-- Enable RLS on article_clicks
ALTER TABLE public.article_clicks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own clicks
CREATE POLICY "Users can insert their own clicks"
ON public.article_clicks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all clicks (for analytics)
CREATE POLICY "Admins can view all clicks"
ON public.article_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));