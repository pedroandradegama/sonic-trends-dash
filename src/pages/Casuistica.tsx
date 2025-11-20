import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCasuisticaData } from '@/hooks/useCasuisticaData';
import { useCasuisticaPeriod } from '@/hooks/useDataPeriod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiagnosisChart } from '@/components/casuistica/DiagnosisChart';
import { BIRADSChart } from '@/components/casuistica/BIRADSChart';
import { DiagnosticosPanel } from '@/components/casuistica/DiagnosticosPanel';
import { DataPeriodInfo } from '@/components/filters/DataPeriodInfo';
import { PeriodFilter } from '@/components/filters/PeriodFilter';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { parse, isValid, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, isAfter, isBefore } from 'date-fns';

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

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    if (dateStr.includes('/')) {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) return parsed;
    }
    
    const parsed = new Date(dateStr);
    if (isValid(parsed)) return parsed;
  } catch {
    return null;
  }
  
  return null;
}

export default function Casuistica() {
  const { signOut } = useAuth();
  const { data, loading, error, subgrupos } = useCasuisticaData();
  const { minDate, maxDate, loading: periodLoading } = useCasuisticaPeriod();
  const [selectedSubgrupo, setSelectedSubgrupo] = useState<string>('todos');
  const [period, setPeriod] = useState<'today' | '7d' | 'mtd' | 'ytd' | 'custom' | 'month'>('ytd');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [customMonth, setCustomMonth] = useState<string>('');
  const [showHistoricalAvg, setShowHistoricalAvg] = useState(false);
  const [showReferenceValue, setShowReferenceValue] = useState(false);
  const [applyPeriodFilter, setApplyPeriodFilter] = useState(false);

  useEffect(() => {
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
    let result = (data || []).filter((r) => {
      const matchesSub = selectedSubgrupo === 'todos' || normalize(r['Subgrupo']) === selectedSubgrupo;
      return matchesSub;
    });

    // Filtro de período
    if (applyPeriodFilter && result.length > 0) {
      const now = new Date();
      let filterStartDate: Date | undefined;
      let filterEndDate: Date | undefined;

      switch (period) {
        case 'today':
          filterStartDate = startOfDay(now);
          filterEndDate = endOfDay(now);
          break;
        case '7d':
          filterStartDate = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
          filterEndDate = endOfDay(now);
          break;
        case 'mtd':
          filterStartDate = startOfMonth(now);
          filterEndDate = endOfDay(now);
          break;
        case 'ytd':
          filterStartDate = startOfYear(now);
          filterEndDate = endOfDay(now);
          break;
        case 'custom':
          if (startDate && endDate) {
            filterStartDate = startOfDay(startDate);
            filterEndDate = endOfDay(endDate);
          }
          break;
        case 'month':
          if (customMonth) {
            const [year, month] = customMonth.split('-').map(Number);
            const monthDate = new Date(year, month - 1, 1);
            filterStartDate = startOfMonth(monthDate);
            filterEndDate = endOfMonth(monthDate);
          }
          break;
      }

      if (filterStartDate && filterEndDate) {
        result = result.filter((r) => {
          const dateStr = r['Data do pedido'];
          const rowDate = parseDate(dateStr);
          if (!rowDate) return false;
          return !isBefore(rowDate, filterStartDate!) && !isAfter(rowDate, filterEndDate!);
        });
      }
    }

    return result;
  }, [data, selectedSubgrupo, period, startDate, endDate, customMonth, applyPeriodFilter]);

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
        return s.includes('mama') || s.includes('mamog') || s.includes('ultra');
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

  const biradsExamType = useMemo<'mamografia' | 'ultrassom' | 'ambos'>(() => {
    const isBreastRelated = (sg?: string | null) => {
      const s = toLowerNoAccent(normalize(sg || ''));
      return s.includes('mama') || s.includes('mamog') || s.includes('ultra');
    };

    const rows = filtered.filter(r => isBreastRelated(r['Subgrupo']));
    let hasMamografia = false;
    let hasUltrassom = false;

    for (const r of rows) {
      const sg = toLowerNoAccent(normalize(r['Subgrupo'] || ''));
      if (sg.includes('mamog')) hasMamografia = true;
      if (sg.includes('ultra') && sg.includes('mama')) hasUltrassom = true;
    }

    if (hasMamografia && hasUltrassom) return 'ambos';
    if (hasMamografia) return 'mamografia';
    if (hasUltrassom) return 'ultrassom';
    return 'mamografia'; // default
  }, [filtered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-teal"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-medical-teal/5 to-medical-success/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Casuística</h1>
            <p className="text-muted-foreground text-lg">Análise de diagnósticos por método</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">Repasse</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/casuistica">Casuística</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/nps">NPS</Link>
            </Button>
            <Button onClick={signOut} variant="outline">Sair</Button>
          </div>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="casuistica" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="casuistica">Casuística Geral</TabsTrigger>
            <TabsTrigger value="diagnosticos">Diagnósticos Histo</TabsTrigger>
          </TabsList>

          {/* Tab Casuística */}
          <TabsContent value="casuistica" className="space-y-6">
            {/* Filtros e Total de Laudos no mesmo nível */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>Selecione o período e o método (Subgrupo)</span>
                    <DataPeriodInfo minDate={minDate} maxDate={maxDate} loading={periodLoading} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Período</label>
                      <PeriodFilter
                        period={period}
                        onPeriodChange={(p) => setPeriod(p as any)}
                        startDate={startDate}
                        endDate={endDate}
                        onDateRangeChange={(start, end) => {
                          setStartDate(start);
                          setEndDate(end);
                        }}
                        customMonth={customMonth}
                        onCustomMonthChange={setCustomMonth}
                      />
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

              <Card>
                <CardHeader>
                  <CardTitle>Total de Laudos</CardTitle>
                  <CardDescription>Registros no filtro atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-medical-teal">{new Intl.NumberFormat('pt-BR').format(totalLaudos)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Controles de referência */}
            <Card>
              <CardHeader>
                <CardTitle>Opções de Visualização</CardTitle>
                <CardDescription>Configure linhas de referência nos gráficos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="historical-avg" 
                      checked={showHistoricalAvg}
                      onCheckedChange={(checked) => setShowHistoricalAvg(checked as boolean)}
                    />
                    <label htmlFor="historical-avg" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Mostrar linha de média histórica nos gráficos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reference-value" 
                      checked={showReferenceValue}
                      onCheckedChange={(checked) => setShowReferenceValue(checked as boolean)}
                    />
                    <label htmlFor="reference-value" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Mostrar valores de referência BI-RADS (literatura)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos alargados */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnósticos mais prevalentes</CardTitle>
                <CardDescription>Top diagnósticos em {selectedSubgrupo === 'todos' ? 'todos os métodos' : selectedSubgrupo}</CardDescription>
              </CardHeader>
              <CardContent>
                <DiagnosisChart data={topDiagnosticos} showHistoricalAverage={showHistoricalAvg} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição BI-RADS (Mama)</CardTitle>
                <CardDescription>Percentual por categoria (soma 100%) - {biradsExamType === 'mamografia' ? 'Mamografia' : biradsExamType === 'ultrassom' ? 'Ultrassonografia' : 'Mamografia e Ultrassonografia'}</CardDescription>
              </CardHeader>
              <CardContent>
                {biradsData.length > 0 ? (
                  <BIRADSChart 
                    data={biradsData} 
                    showHistoricalAverage={showHistoricalAvg}
                    showReferenceValue={showReferenceValue}
                    examType={biradsExamType}
                  />
                ) : (
                  <p className="text-muted-foreground">Sem dados de BI-RADS no filtro atual.</p>
                )}
              </CardContent>
            </Card>

            {/* Referências (benchmarks) */}
            <Card>
              <CardHeader>
                <CardTitle>Referências BI-RADS (benchmarks)</CardTitle>
                <CardDescription>Valores de referência em rastreamento (literatura) - {biradsExamType === 'mamografia' ? 'Mamografia' : biradsExamType === 'ultrassom' ? 'Ultrassonografia' : 'Mamografia e Ultrassonografia'}</CardDescription>
              </CardHeader>
              <CardContent>
                {biradsExamType === 'mamografia' && (
                  <>
                    <h4 className="font-semibold text-sm mb-2">Mamografia</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                      <li>Taxa de recall (BI-RADS 0): recomendada ~8% a 12% em mamografia de rastreamento (ACR/BCSC).</li>
                      <li>BI-RADS 1–2 (negativo/benigno): tipicamente a maioria dos exames (≈75%–85%).</li>
                      <li>BI-RADS 3: geralmente baixo (≈3%–7%).</li>
                      <li>BI-RADS 4–5: raros em rastreamento (≈2%–5%).</li>
                    </ul>
                  </>
                )}
                {biradsExamType === 'ultrassom' && (
                  <>
                    <h4 className="font-semibold text-sm mb-2">Ultrassonografia de Mamas</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                      <li>Taxa de recall (BI-RADS 0): recomendada ~3% a 7% em ultrassom complementar.</li>
                      <li>BI-RADS 1–2 (negativo/benigno): tipicamente a maioria dos exames (≈85%–95%).</li>
                      <li>BI-RADS 3: geralmente baixo (≈1%–5%).</li>
                      <li>BI-RADS 4–5: raros (≈0,5%–2,5%).</li>
                    </ul>
                  </>
                )}
                {biradsExamType === 'ambos' && (
                  <>
                    <h4 className="font-semibold text-sm mb-2">Mamografia</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground mb-4">
                      <li>Taxa de recall (BI-RADS 0): recomendada ~8% a 12% em mamografia de rastreamento (ACR/BCSC).</li>
                      <li>BI-RADS 1–2 (negativo/benigno): tipicamente a maioria dos exames (≈75%–85%).</li>
                      <li>BI-RADS 3: geralmente baixo (≈3%–7%).</li>
                      <li>BI-RADS 4–5: raros em rastreamento (≈2%–5%).</li>
                    </ul>
                    <h4 className="font-semibold text-sm mb-2">Ultrassonografia de Mamas</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                      <li>Taxa de recall (BI-RADS 0): recomendada ~3% a 7% em ultrassom complementar.</li>
                      <li>BI-RADS 1–2 (negativo/benigno): tipicamente a maioria dos exames (≈85%–95%).</li>
                      <li>BI-RADS 3: geralmente baixo (≈1%–5%).</li>
                      <li>BI-RADS 4–5: raros (≈0,5%–2,5%).</li>
                    </ul>
                  </>
                )}
                <div className="mt-3 text-xs">
                  Fontes: 
                  <a className="text-medical-teal underline ml-1" href="https://pubs.rsna.org/doi/10.1148/radiol.2016161174" target="_blank" rel="noreferrer">RSNA – BCSC Benchmarks</a>,
                  <a className="text-medical-teal underline ml-2" href="https://radiologyassistant.nl/breast/bi-rads/bi-rads-for-mammography-and-ultrasound-2013" target="_blank" rel="noreferrer">Radiology Assistant (BI-RADS)</a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Diagnósticos Histopatológicos */}
          <TabsContent value="diagnosticos" className="space-y-6">
            <DiagnosticosPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
