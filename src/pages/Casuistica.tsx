import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCasuisticaData } from '@/hooks/useCasuisticaData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiagnosisChart } from '@/components/casuistica/DiagnosisChart';
import { BIRADSChart } from '@/components/casuistica/BIRADSChart';
import { Link } from 'react-router-dom';

function normalize(str?: string | null) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

function toLowerNoAccent(str: string) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase();
}

export default function Casuistica() {
  const { signOut } = useAuth();
  const { data, loading, error, doctors, subgrupos } = useCasuisticaData();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('todos');
  const [selectedSubgrupo, setSelectedSubgrupo] = useState<string>('todos');

  useEffect(() => {
    // SEO basics
    document.title = 'Casuística | Diagnósticos por Médico - Dashboard';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Dashboard de casuística: diagnósticos por médico, filtros por método (Subgrupo) e distribuição BI-RADS (%).');
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Dashboard de casuística: diagnósticos por médico, filtros por método (Subgrupo) e distribuição BI-RADS (%).';
      document.head.appendChild(m);
    }

    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const canonicalUrl = `${window.location.origin}/casuistica`;
    if (existingCanonical) existingCanonical.setAttribute('href', canonicalUrl);
    else {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      l.setAttribute('href', canonicalUrl);
      document.head.appendChild(l);
    }
  }, []);

  const filtered = useMemo(() => {
    return (data || []).filter((r) => {
      const matchesDoctor = selectedDoctor === 'todos' || normalize(r['Médico Executante']) === selectedDoctor;
      const matchesSub = selectedSubgrupo === 'todos' || normalize(r['Subgrupo']) === selectedSubgrupo;
      return matchesDoctor && matchesSub;
    });
  }, [data, selectedDoctor, selectedSubgrupo]);

  const totalLaudos = filtered.length;

  const topDiagnosticos = useMemo(() => {
    const map = new Map<string, { diagnostico: string; count: number }>();
    for (const row of filtered) {
      const raw = normalize(row['Comentário']);
      if (!raw) continue;
      const key = raw.toUpperCase();
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { diagnostico: raw, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [filtered]);

  const biradsData = useMemo(() => {
    const isBreastRelated = (sg?: string | null) => {
      const s = toLowerNoAccent(normalize(sg || ''));
      return s.includes('mama') || s.includes('mamog');
    };

    const rows = filtered.filter(r => isBreastRelated(r['Subgrupo']));
    const counts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<string, number>;
    let total = 0;

    const regex = /bi\s*[-\s]?rads\s*([0-5])/i;

    for (const r of rows) {
      const c = r['Comentário'] || '';
      const m = String(c).match(regex);
      if (m && m[1]) {
        const k = m[1] as '0'|'1'|'2'|'3'|'4'|'5';
        counts[k] += 1;
        total += 1;
      }
    }

    if (total === 0) return [] as Array<{ categoria: string; percent: number }>;

    const cats = ['0','1','2','3','4','5'] as const;
    let arr = cats.map((k) => {
      const raw = (counts[k] / total) * 100;
      const rounded = Math.round(raw * 10) / 10;
      return { categoria: `BI-RADS ${k}`, percent: rounded };
    });
    const sum = arr.reduce((s, a) => s + a.percent, 0);
    const diff = Math.round((100 - sum) * 10) / 10;
    if (arr.length > 0) {
      arr[arr.length - 1].percent = Math.max(0, Math.min(100, Math.round((arr[arr.length - 1].percent + diff) * 10) / 10));
    }
    return arr;
  }, [filtered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
          <p className="mt-4 text-muted-foreground">Carregando Casuística...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/5 to-medical-success/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Casuística</h1>
            <p className="text-muted-foreground text-lg">Análise de diagnósticos por médico e método</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/" aria-label="Ir para Dashboard de Repasse">Repasse</Link>
            </Button>
            <Button onClick={signOut} variant="outline">Sair</Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o médico e o método (Subgrupo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Médico Executante</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((m) => (
                      <SelectItem key={m} value={m}>{m === 'todos' ? 'Todos' : m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Subgrupo (Método)</label>
                <Select value={selectedSubgrupo} onValueChange={setSelectedSubgrupo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por subgrupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {subgrupos.map((s) => (
                      <SelectItem key={s} value={s}>{s === 'todos' ? 'Todos' : s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total de Laudos</CardTitle>
              <CardDescription>Registros no filtro atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-medical-blue">{new Intl.NumberFormat('pt-BR').format(totalLaudos)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnósticos mais prevalentes</CardTitle>
              <CardDescription>Top diagnósticos em {selectedSubgrupo === 'todos' ? 'todos os métodos' : selectedSubgrupo}</CardDescription>
            </CardHeader>
            <CardContent>
              <DiagnosisChart data={topDiagnosticos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição BI-RADS (Mama)</CardTitle>
              <CardDescription>Percentual por categoria (soma 100%)</CardDescription>
            </CardHeader>
            <CardContent>
              {biradsData.length > 0 ? (
                <BIRADSChart data={biradsData} />
              ) : (
                <p className="text-muted-foreground">Sem dados de BI-RADS no filtro atual.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referências (benchmarks) */}
        <Card>
          <CardHeader>
            <CardTitle>Referências BI-RADS (benchmarks)</CardTitle>
            <CardDescription>Valores de referência em rastreamento (literatura)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Taxa de recall (aprox. BI-RADS 0): recomendada ~5% a 12% em mamografia de rastreamento (ACR/BCSC).</li>
              <li>BI-RADS 1–2 (negativo/benigno): tipicamente a maioria dos exames (≈80%–90%).</li>
              <li>BI-RADS 3: geralmente baixo (≈0,5%–2%).</li>
              <li>BI-RADS 4–5: raros em rastreamento (≈0,3%–1%).</li>
            </ul>
            <div className="mt-3 text-xs">
              Fontes: 
              <a className="text-medical-blue underline ml-1" href="https://pubs.rsna.org/doi/10.1148/radiol.2016161174" target="_blank" rel="noreferrer">RSNA – BCSC Benchmarks</a>,
              <a className="text-medical-blue underline ml-2" href="https://radiologyassistant.nl/breast/bi-rads/bi-rads-for-mammography-and-ultrasound-2013" target="_blank" rel="noreferrer">Radiology Assistant (BI-RADS)</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
