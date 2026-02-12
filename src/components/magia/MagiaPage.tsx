import { useState } from 'react';
import { Brain, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Lazy imports for the two panels
import MagiaHDPanel from './MagiaHDPanel';
import ReportReviewPanel from './ReportReviewPanel';

export default function MagiaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">MagIA</h2>
      </div>

      <Tabs defaultValue="hd" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hd" className="gap-2">
            <Brain className="h-4 w-4" />
            Discussão de HD
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <FileText className="h-4 w-4" />
            Revisão de Laudo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hd" className="mt-6">
          <MagiaHDPanel />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <ReportReviewPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
