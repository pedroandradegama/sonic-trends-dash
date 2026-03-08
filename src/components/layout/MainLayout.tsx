import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopHeader } from './TopHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

function LayoutInner({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileSidebar />
          <main className="pt-24 px-4 pb-6">
            {children}
          </main>
        </>
      ) : (
        <>
          <TopHeader />
          <AppSidebar />
          <main className={cn(
            "transition-all duration-300 min-h-screen px-6 pb-6 pt-20",
            collapsed ? "ml-16" : "ml-64"
          )}>
            <div className="mx-auto">
              {children}
            </div>
          </main>
        </>
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
