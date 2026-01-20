import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  ExternalLink, 
  Search, 
  Filter, 
  Star,
  Calendar,
  Tag,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  useUltrasoundArticles, 
  useArticleSources, 
  useArticleTags,
  useTrackArticleClick,
  UltrasoundArticle 
} from '@/hooks/useUltrasoundArticles';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SUBGROUPS = [
  { value: 'todos', label: 'Todos os Subgrupos' },
  { value: 'cabeca-pescoco', label: 'Cabeça e Pescoço' },
  { value: 'mamas', label: 'Mamas' },
  { value: 'medicina-interna', label: 'Medicina Interna' },
  { value: 'gineco-obst', label: 'Gineco-Obstetrícia' },
  { value: 'msk', label: 'MSK' },
  { value: 'vascular', label: 'Vascular' },
  { value: 'outros', label: 'Outros' },
];

const DATE_FILTERS = [
  { value: '0', label: 'Todas as datas' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 180 dias' },
];

function isNew(date: string | null): boolean {
  if (!date) return false;
  return differenceInDays(new Date(), new Date(date)) <= 14;
}

function getSubgroupLabel(subgroup: string): string {
  return SUBGROUPS.find(s => s.value === subgroup)?.label || subgroup;
}

function ArticleItem({ article, onTrackClick }: { article: UltrasoundArticle; onTrackClick: (id: string) => void }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTrackClick(article.id);
    // Use window.open with noopener for security
    const newWindow = window.open(article.url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Fallback: create and click a link if popup was blocked
      const link = document.createElement('a');
      link.href = article.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="group p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {article.is_highlighted && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
            {isNew(article.publication_date) && (
              <Badge variant="default" className="bg-green-500 text-white text-xs">
                Novo
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getSubgroupLabel(article.subgroup)}
            </Badge>
          </div>
          
          <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h4>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {article.source}
            </span>
            {article.publication_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(article.publication_date).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          
          {article.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {article.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{article.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}

export default function RadarArtigosCard() {
  const [subgroup, setSubgroup] = useState('todos');
  const [source, setSource] = useState('todos');
  const [days, setDays] = useState('0');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoadingPubmed, setIsLoadingPubmed] = useState(false);
  const { toast } = useToast();

  const { data: articles, isLoading, refetch } = useUltrasoundArticles({
    subgroup: subgroup !== 'todos' ? subgroup : undefined,
    source: source !== 'todos' ? source : undefined,
    days: days !== '0' ? parseInt(days) : undefined,
    search: searchTerm || undefined,
  });

  const { data: sources } = useArticleSources();
  const { data: tags } = useArticleTags();
  const trackClick = useTrackArticleClick();

  // Fetch articles from PubMed
  const handleFetchPubmed = async () => {
    setIsLoadingPubmed(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-pubmed-articles', {
        body: { 
          action: 'fetch',
          searchTerm: 'ultrasound radiology',
          maxResults: 20 
        },
      });

      if (error) throw error;

      toast({
        title: 'Artigos atualizados',
        description: `${data?.inserted || 0} novos artigos importados do PubMed.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      toast({
        title: 'Erro ao buscar artigos',
        description: 'Não foi possível buscar artigos do PubMed.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPubmed(false);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Radar de Artigos – Ultrassonografia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchPubmed}
              disabled={isLoadingPubmed}
              className="gap-1"
            >
              {isLoadingPubmed ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar PubMed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <Select value={subgroup} onValueChange={setSubgroup}>
              <SelectTrigger>
                <SelectValue placeholder="Subgrupo" />
              </SelectTrigger>
              <SelectContent>
                {SUBGROUPS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as fontes</SelectItem>
                {sources?.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tag chips */}
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Tags populares:</span>
            {tags.slice(0, 6).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => setSearchTerm(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Articles list */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : articles && articles.length > 0 ? (
            articles.map(article => (
              <ArticleItem 
                key={article.id} 
                article={article} 
                onTrackClick={(id) => trackClick.mutate(id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum artigo encontrado</p>
              <p className="text-sm mb-4">Clique em "Atualizar PubMed" para buscar artigos</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFetchPubmed}
                disabled={isLoadingPubmed}
              >
                {isLoadingPubmed ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Buscar Artigos
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {articles && articles.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Exibindo {articles.length} artigo{articles.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}