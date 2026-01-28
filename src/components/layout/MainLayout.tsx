import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileSidebar />
          <main className="pt-16 px-4 pb-6">
            {children}
          </main>
        </>
      ) : (
        <>
          <AppSidebar />
          <main className={cn(
            "transition-all duration-300 min-h-screen",
            "ml-64 p-6" // Fixed margin for desktop
          )}>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
