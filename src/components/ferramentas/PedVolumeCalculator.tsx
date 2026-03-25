import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, RotateCcw, ArrowLeft, ClipboardCheck, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logToolUsage } from '@/hooks/useToolUsageLog';
import { TesticularTab } from './ped-volume/TesticularTab';
import { ThyroidTab } from './ped-volume/ThyroidTab';

export function PedVolumeCalculator() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas-ia')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculadoras Pediátricas — Volume</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Percentis de volume testicular e tireoidiano por idade
          </p>
        </div>
      </div>

      <Tabs defaultValue="testicular" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="testicular">Testículo</TabsTrigger>
          <TabsTrigger value="thyroid">Tireoide</TabsTrigger>
        </TabsList>

        <TabsContent value="testicular" className="mt-4">
          <TesticularTab />
        </TabsContent>

        <TabsContent value="thyroid" className="mt-4">
          <ThyroidTab />
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Fontes:</strong> Testículo — Kuijper et al., JCEM 2008. Tireoide — WHO/ICCIDD (crianças), Langer et al. (≥6 anos).</p>
            <p>Ferramenta de suporte — não substitui julgamento clínico.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
