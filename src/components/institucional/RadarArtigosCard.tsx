import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  ExternalLink as ExternalLinkIcon, 
  Search, 
  Filter, 
  Star,
  Calendar,
  Tag,
  Loader2,
  RefreshCw,
  Copy
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
import { ExternalLink } from '@/components/ExternalLink';
import { useQueryClient } from '@tanstack/react-query';

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
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 180 dias' },
  { value: '0', label: 'Todas as datas' },
];

const JOURNAL_SOURCES = [
  { key: 'radiographics', label: 'Radiographics' },
  { key: 'radiology', label: 'Radiology' },
  { key: 'ajr', label: 'AJR' },
  { key: 'jum', label: 'J Ultrasound Med' },
  { key: 'european_radiology', label: 'European Radiology' },
  { key: 'jcu', label: 'J Clinical Ultrasound' },
];

function isNew(date: string | null): boolean {
  if (!date) return false;
  return differenceInDays(new Date(), new Date(date)) <= 14;
}

function getSubgroupLabel(subgroup: string): string {
  return SUBGROUPS.find(s => s.value === subgroup)?.label || subgroup;
}

function ArticleItem({ article, onTrackClick }: { article: UltrasoundArticle; onTrackClick: (id: string) => void }) {
  const { toast } = useToast();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(article.url);
    toast({
      title: 'Link copiado',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const handleTrackClick = () => {
    try { onTrackClick(article.id); } catch { /* ignore */ }
  };

  return (
    <div className="group p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {article.is_highlighted && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
            {isNew(article.publication_date) && (
              <Badge variant="default" className="bg-success text-success-foreground text-xs">
                Novo
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getSubgroupLabel(article.subgroup)}
            </Badge>
          </div>
          
          <ExternalLink
            href={article.url}
            onClick={handleTrackClick}
            className="font-medium text-sm leading-snug hover:text-primary hover:underline transition-colors line-clamp-2 !inline text-left"
          >
            {article.title}
          </ExternalLink>
          
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
          
          {article.tags && article.tags.length > 0 && (
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
        
        <div className="flex flex-col gap-1">
          <ExternalLink
            href={article.url}
            onClick={handleTrackClick}
            className="p-2 rounded hover:bg-primary/10 transition-colors"
            title="Abrir artigo"
          >
            <ExternalLinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </ExternalLink>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded hover:bg-primary/10 transition-colors"
            title="Copiar link"
          >
            <Copy className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RadarArtigosCard() {
  const [subgroup, setSubgroup] = useState('todos');
  const [source, setSource] = useState('todos');
  const [days, setDays] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles, isLoading, refetch } = useUltrasoundArticles({
    subgroup: subgroup !== 'todos' ? subgroup : undefined,
    source: source !== 'todos' ? source : undefined,
    days: days !== '0' ? parseInt(days) : undefined,
    search: searchTerm || undefined,
  });

  const { data: sources } = useArticleSources();
  const { data: tags } = useArticleTags();
  const trackClick = useTrackArticleClick();

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    let totalInserted = 0;

    try {
      for (const journal of JOURNAL_SOURCES) {
        setScrapeProgress(`Buscando ${journal.label}...`);
        
        try {
          const { data, error } = await supabase.functions.invoke('scrape-journal-articles', {
            body: { sourceKey: journal.key, maxArticles: 30 },
          });

          if (error) {
            console.error(`Erro ao buscar ${journal.label}:`, error);
            continue;
          }

          if (data?.success) {
            totalInserted += data.inserted || 0;
          }
        } catch (err) {
          console.error(`Erro ao buscar ${journal.label}:`, err);
        }
      }

      toast({
        title: 'Artigos atualizados',
        description: `${totalInserted} novos artigos importados de ${JOURNAL_SOURCES.length} fontes.`,
      });

      queryClient.invalidateQueries({ queryKey: ['ultrasound-articles'] });
      queryClient.invalidateQueries({ queryKey: ['article-sources'] });
      queryClient.invalidateQueries({ queryKey: ['article-tags'] });
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      toast({
        title: 'Erro ao buscar artigos',
        description: 'Não foi possível completar a varredura.',
        variant: 'destructive',
      });
    } finally {
      setIsScrapingAll(false);
      setScrapeProgress('');
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
              onClick={handleScrapeAll}
              disabled={isScrapingAll}
              className="gap-1"
            >
              {isScrapingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isScrapingAll ? scrapeProgress || 'Atualizando...' : 'Atualizar Journals'}
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
              <p className="text-sm mb-4">Clique em "Atualizar Journals" para buscar artigos</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleScrapeAll}
                disabled={isScrapingAll}
              >
                {isScrapingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Buscar Artigos
              </Button>
            </div>
          )}
        </div>

        {/* Hot Topics */}
        {articles && articles.length > 0 && (
          <HotTopicsPanel articles={articles} />
        )}

        {/* Footer */}
        {articles && articles.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Exibindo {articles.length} artigo{articles.length !== 1 ? 's' : ''} · Fontes: {JOURNAL_SOURCES.map(j => j.label).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HotTopicsPanel({ articles }: { articles: UltrasoundArticle[] }) {
  const hotTopics = useMemo(() => {
    const bySubgroup = new Map<string, UltrasoundArticle[]>();
    articles.forEach(a => {
      const group = bySubgroup.get(a.subgroup) || [];
      if (group.length < 3) group.push(a);
      bySubgroup.set(a.subgroup, group);
    });
    return Array.from(bySubgroup.entries())
      .filter(([, arts]) => arts.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [articles]);

  if (hotTopics.length === 0) return null;

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        Hot Topics por Área
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hotTopics.map(([subgroup, arts]) => (
          <div key={subgroup} className="border rounded-lg p-3 space-y-2">
            <Badge variant="outline" className="text-xs">{getSubgroupLabel(subgroup)}</Badge>
            <ul className="space-y-1.5">
              {arts.map(a => (
                <li key={a.id}>
                  <ExternalLink
                    href={a.url}
                    className="text-xs hover:text-primary hover:underline transition-colors line-clamp-2 !inline"
                  >
                    {a.title}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}