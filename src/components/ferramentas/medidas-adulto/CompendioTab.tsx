import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdultReferenceMeasurements } from '@/hooks/useAdultReferenceMeasurements';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { Copy, Star, ExternalLink as ExternalLinkIcon, Search } from 'lucide-react';
import { ExternalLink } from '@/components/ExternalLink';
import { toast } from 'sonner';

export function CompendioTab() {
  const { data, favorites, loading, toggleFavorite, categories, modalities } = useAdultReferenceMeasurements();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const [modFilter, setModFilter] = useState('todas');
  const [showFavorites, setShowFavorites] = useState(false);

  const filtered = useMemo(() => {
    return data.filter(m => {
      if (showFavorites && !favorites.has(m.id)) return false;
      if (catFilter !== 'todas' && m.category !== catFilter) return false;
      if (modFilter !== 'todas' && m.modality !== modFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${m.structure} ${m.parameter} ${m.normal_text} ${m.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, catFilter, modFilter, showFavorites, favorites]);

  const handleCopy = (m: typeof data[0]) => {
    const text = `${m.structure} — ${m.parameter}: ${m.normal_text}${m.cutoff_text ? ` ${m.cutoff_text}` : ''}. Fonte: ${m.source_title}.`;
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado para o clipboard.');
    logToolUsage('medidas-adulto', { measurement_id: m.id, structure: m.structure });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={modFilter} onValueChange={setModFilter}>
          <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as modalidades</SelectItem>
            {modalities.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showFavorites} onCheckedChange={setShowFavorites} id="fav-toggle" />
          <Label htmlFor="fav-toggle" className="text-sm">Favoritos</Label>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {filtered.map(m => (
          <Card key={m.id}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground">{m.structure} — {m.parameter}</h4>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="outline" className="text-xs">{m.category}</Badge>
                    <Badge variant="outline" className="text-xs">{m.modality}</Badge>
                    {m.unit && <Badge variant="secondary" className="text-xs">{m.unit}</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleFavorite(m.id)}
                >
                  <Star className={`h-4 w-4 ${favorites.has(m.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <p className="text-sm text-foreground">{m.normal_text}</p>
              {m.cutoff_text && (
                <p className="text-sm text-muted-foreground"><strong>Ponto de corte:</strong> {m.cutoff_text}</p>
              )}
              {m.notes && (
                <p className="text-xs text-muted-foreground italic">{m.notes}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopy(m)}>
                  <Copy className="h-3 w-3" /> Copiar para laudo
                </Button>
                <ExternalLink href={m.source_url} className="text-xs text-primary hover:underline" showIcon iconClassName="h-3 w-3">
                  {m.source_title}
                </ExternalLink>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
