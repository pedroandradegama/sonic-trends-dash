import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UltrasoundArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publication_date: string | null;
  subgroup: string;
  tags: string[];
  is_highlighted: boolean;
  is_active: boolean;
  click_count: number;
  created_at: string;
}

interface ArticleFilters {
  subgroup?: string;
  source?: string;
  days?: number;
  tags?: string[];
  search?: string;
}

export function useUltrasoundArticles(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: ['ultrasound-articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('ultrasound_articles')
        .select('*')
        .eq('is_active', true)
        .order('is_highlighted', { ascending: false })
        .order('publication_date', { ascending: false, nullsFirst: false });

      if (filters.subgroup && filters.subgroup !== 'todos') {
        query = query.eq('subgroup', filters.subgroup);
      }

      if (filters.source && filters.source !== 'todos') {
        query = query.eq('source', filters.source);
      }

      if (filters.days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.days);
        query = query.gte('publication_date', cutoffDate.toISOString().split('T')[0]);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by tags client-side if needed
      let articles = (data || []) as UltrasoundArticle[];
      
      if (filters.tags && filters.tags.length > 0) {
        articles = articles.filter(article => 
          filters.tags!.some(tag => article.tags.includes(tag))
        );
      }

      return articles;
    },
  });
}

export function useArticleSources() {
  return useQuery({
    queryKey: ['article-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultrasound_articles')
        .select('source')
        .eq('is_active', true);

      if (error) throw error;

      const sources = [...new Set((data || []).map(d => d.source))].sort();
      return sources;
    },
  });
}

export function useArticleTags() {
  return useQuery({
    queryKey: ['article-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultrasound_articles')
        .select('tags')
        .eq('is_active', true);

      if (error) throw error;

      const allTags = (data || []).flatMap(d => d.tags || []);
      const uniqueTags = [...new Set(allTags)].sort();
      return uniqueTags;
    },
  });
}

export function useTrackArticleClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record the click
      await supabase
        .from('article_clicks')
        .insert({ article_id: articleId, user_id: user.id });

      // Increment click count
      await supabase.rpc('increment_article_clicks', { article_id: articleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
    },
  });
}

export function useFetchPubMedArticles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ searchTerm, maxResults }: { searchTerm?: string; maxResults?: number }) => {
      const { data, error } = await supabase.functions.invoke('fetch-pubmed-articles', {
        body: { action: 'fetch', searchTerm, maxResults }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Artigos atualizados',
        description: `${data.fetched} artigos encontrados, ${data.inserted} novos adicionados.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
      queryClient.invalidateQueries({ queryKey: ['article-sources'] });
      queryClient.invalidateQueries({ queryKey: ['article-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao buscar artigos',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Admin functions
export function useUpdateArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UltrasoundArticle> }) => {
      const { error } = await supabase
        .from('ultrasound_articles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Artigo atualizado' });
      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Omit<UltrasoundArticle, 'id' | 'click_count' | 'created_at'>) => {
      const { error } = await supabase
        .from('ultrasound_articles')
        .insert(article);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Artigo adicionado' });
      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteArticle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ultrasound_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Artigo removido' });
      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}