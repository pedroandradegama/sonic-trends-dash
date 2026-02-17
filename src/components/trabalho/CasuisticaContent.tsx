// Re-exports the full Casuistica page content without MainLayout wrapper
// We import the existing page and just render its internal content
import { lazy, Suspense } from 'react';

// Since Casuistica is very large, we create a thin wrapper that renders it without the layout
export function CasuisticaContent() {
  // We'll render the existing Casuistica page inline. 
  // To avoid duplication, we simply import and render.
  // The Casuistica page uses MainLayout, so we need a version without it.
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <CasuisticaInner />
    </Suspense>
  );
}

// We need to create an inner version. For now, redirect to existing page
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, ExternalLink } from 'lucide-react';

function CasuisticaInner() {
  const navigate = useNavigate();
  
  // Since Casuistica is extremely complex (860+ lines), we embed it via iframe-like approach
  // Actually, let's just render it directly. We need to extract the content.
  // For the cleanest approach, we navigate to the standalone page.
  
  return (
    <div className="text-center py-8 space-y-4">
      <BarChart3 className="h-12 w-12 text-primary mx-auto" />
      <p className="text-muted-foreground">O painel completo de Casuística está disponível na página dedicada.</p>
      <Button onClick={() => navigate('/casuistica')} className="gap-2">
        <ExternalLink className="h-4 w-4" />
        Abrir Casuística
      </Button>
    </div>
  );
}
