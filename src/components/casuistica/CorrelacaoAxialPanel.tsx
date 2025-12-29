import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Magnet, Scan, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CorrelacaoItem } from '@/hooks/useCorrelacaoAxial';
import { Button } from '@/components/ui/button';

interface CorrelacaoAxialPanelProps {
  correlacoes: CorrelacaoItem[];
  stats: {
    totalPacientes: number;
    totalCorrelacoes: number;
    totalRM: number;
    totalTC: number;
    avgDiasAteAxial: number;
  };
  loading: boolean;
  error: string | null;
}

export function CorrelacaoAxialPanel({ correlacoes, stats, loading, error }: CorrelacaoAxialPanelProps) {
  const [filterTipo, setFilterTipo] = useState<'todos' | 'RM' | 'TC'>('todos');
  const [showAll, setShowAll] = useState(false);

  const filteredCorrelacoes = useMemo(() => {
    if (filterTipo === 'todos') return correlacoes;
    return correlacoes.filter(c => c.axialTipo === filterTipo);
  }, [correlacoes, filterTipo]);

  const displayedCorrelacoes = showAll ? filteredCorrelacoes : filteredCorrelacoes.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-teal"></div>
        <span className="ml-3 text-muted-foreground">Carregando correlações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (correlacoes.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Nenhuma correlação encontrada</p>
        <p className="text-sm text-muted-foreground mt-2">
          Não foram identificados pacientes que realizaram RM ou TC após exames de USG realizados por você.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{stats.totalPacientes}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{stats.totalCorrelacoes}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Correlações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-emerald-500/10">
                <Magnet className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{stats.totalRM}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Exames RM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/10">
                <Scan className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{stats.totalTC}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Exames TC</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl col-span-2 sm:col-span-1">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-rose-500/10">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{stats.avgDiasAteAxial}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Média dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro e tabela */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Lista de Correlações</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Pacientes que realizaram RM/TC após exame de USG realizado por você
              </CardDescription>
            </div>
            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as 'todos' | 'RM' | 'TC')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="RM">Apenas RM</SelectItem>
                <SelectItem value="TC">Apenas TC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Paciente</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Exame USG</TableHead>
                  <TableHead className="min-w-[90px]">Data USG</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Exame Axial</TableHead>
                  <TableHead className="min-w-[90px]">Data Axial</TableHead>
                  <TableHead className="text-center min-w-[60px]">Tipo</TableHead>
                  <TableHead className="text-right min-w-[80px]">Intervalo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCorrelacoes.map((item, idx) => (
                  <TableRow key={`${item.paciente}-${idx}`}>
                    <TableCell className="font-medium max-w-[150px] md:max-w-[200px] truncate text-xs md:text-sm" title={item.paciente}>
                      {item.paciente}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs md:text-sm hidden md:table-cell" title={item.usgExame}>
                      {item.usgExame}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs md:text-sm">
                      {format(item.usgData, 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs md:text-sm hidden md:table-cell" title={item.axialExame}>
                      {item.axialExame}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs md:text-sm">
                      {format(item.axialData, 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={item.axialTipo === 'RM' ? 'default' : 'secondary'}
                        className={`text-xs ${item.axialTipo === 'RM' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      >
                        {item.axialTipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs md:text-sm">
                      {item.diasDiferenca}d
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredCorrelacoes.length > 10 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="gap-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver todos ({filteredCorrelacoes.length} registros)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
