import { ReactNode, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopHeader } from './TopHeader';
import { ClipboardToast } from './ClipboardToast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClipboardDetection } from '@/hooks/useClipboardDetection';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { ClipboardPaste } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { collapsed } = useSidebar();
  const navigate = useNavigate();

  const [clipboardEnabled, setClipboardEnabled] = useState(
    () => localStorage.getItem('clipboard_detection_enabled') === 'true'
  );
  const [pendingLaudo, setPendingLaudo] = useState<string | null>(null);

  const toggleClipboard = useCallback((value: boolean) => {
    setClipboardEnabled(value);
    localStorage.setItem('clipboard_detection_enabled', String(value));
  }, []);

  useClipboardDetection({
    enabled: clipboardEnabled,
    onLaudoDetected: (text) => setPendingLaudo(text),
  });

  const handleConfirm = (text: string) => {
    sessionStorage.setItem('clipboard_laudo_pending', text);
    setPendingLaudo(null);
    // Reset clipboard enabled briefly to clear lastDetectedRef
    setClipboardEnabled(false);
    setTimeout(() => {
      setClipboardEnabled(localStorage.getItem('clipboard_detection_enabled') === 'true');
    }, 500);
    navigate('/ferramentas-ia', { state: { openTab: 'magia-laudo' } });
  };

  const handleDismiss = () => setPendingLaudo(null);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileSidebar />
          <main className="pt-14 px-4 pb-20">
            {children}
          </main>
        </>
      ) : (
        <>
          <TopHeader />
          <AppSidebar />
          <main className={cn(
            "transition-all duration-300 min-h-screen px-6 pb-6 pt-20",
            collapsed ? "ml-16" : "ml-60"
          )}>
            <div className="mx-auto">
              {children}
            </div>
          </main>
        </>
      )}

      {/* Clipboard detection toggle — desktop only */}
      {!isMobile && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
          <button
            onClick={() => toggleClipboard(!clipboardEnabled)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200",
              clipboardEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
            )}
            title={clipboardEnabled ? "Detecção de laudo ativa — clique para desativar" : "Ativar detecção automática de laudo"}
          >
            <ClipboardPaste className="h-3 w-3" />
            {clipboardEnabled ? "Detecção ativa" : "Detecção inativa"}
          </button>
        </div>
      )}

      {/* Clipboard laudo toast */}
      {pendingLaudo && (
        <ClipboardToast
          text={pendingLaudo}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
