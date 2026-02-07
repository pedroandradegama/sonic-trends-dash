import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopHeader } from './TopHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileSidebar />
          <main className="pt-14 px-4 pb-6">
            {children}
          </main>
        </>
      ) : (
        <>
          <TopHeader />
          <AppSidebar />
          <main className="transition-all duration-300 min-h-screen pt-14 ml-56 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
