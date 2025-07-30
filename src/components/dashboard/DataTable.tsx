import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataTableProps {
  data: Array<{
    'Dt. Atendimento': string;
    'Produto': string;
    'Qtde': string;
    'Convênio': string;
    'Médico': string;
    'Vl. Repasse': string;
    'Porcentagem Repasse': string;
  }>;
}

export function DataTable({ data }: DataTableProps) {
  return (
    <Card className="border-border bg-gradient-to-br from-card to-muted/20 shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Dados Detalhados dos Exames
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Data</TableHead>
                <TableHead className="font-semibold text-foreground">Produto</TableHead>
                <TableHead className="font-semibold text-foreground">Qtde</TableHead>
                <TableHead className="font-semibold text-foreground">Convênio</TableHead>
                <TableHead className="font-semibold text-foreground">Médico</TableHead>
                <TableHead className="font-semibold text-foreground">Vl. Repasse</TableHead>
                <TableHead className="font-semibold text-foreground">% Repasse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-muted/30 transition-colors duration-200"
                >
                  <TableCell className="text-sm">{row['Dt. Atendimento']}</TableCell>
                  <TableCell className="text-sm font-medium text-medical-blue">
                    {row['Produto']}
                  </TableCell>
                  <TableCell className="text-sm">{row['Qtde']}</TableCell>
                  <TableCell className="text-sm">{row['Convênio']}</TableCell>
                  <TableCell className="text-sm">{row['Médico']}</TableCell>
                  <TableCell className="text-sm font-medium text-medical-success">
                    {row['Vl. Repasse']}
                  </TableCell>
                  <TableCell className="text-sm">{row['Porcentagem Repasse']}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}