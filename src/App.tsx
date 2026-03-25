import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Auth from "./pages/Auth";
import ModeSelection from "./pages/ModeSelection";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import GestaoAgendas from "./pages/GestaoAgendas";
import Home from "./pages/Home";
import Perfil from "./pages/Perfil";
import MinhaAgenda from "./pages/MinhaAgenda";
import MeuTrabalho from "./pages/MeuTrabalho";
import FerramentasIA from "./pages/FerramentasIA";
import Comunidade from "./pages/Comunidade";
// Legacy pages still needed for standalone routes
import Index from "./pages/Index";
import Casuistica from "./pages/Casuistica";
import NPS from "./pages/NPS";
// Tool sub-pages
import PercentisUS from "./pages/PercentisUS";
import TiRads from "./pages/TiRads";
import MedidasAdulto from "./pages/MedidasAdulto";
import ProvaMotoraVB from "./pages/ProvaMotoraVB";
import VolumeVesicalPed from "./pages/VolumeVesicalPed";
import CIMTPercentile from "./pages/CIMTPercentile";
import ORADSCalculator from "./pages/ORADSCalculator";
import FetalGrowth from "./pages/FetalGrowth";
import PedVolume from "./pages/PedVolume";

const queryClient = new QueryClient();

function ProtectedWithLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/modo" element={<ProtectedRoute><ModeSelection /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedWithLayout><Home /></ProtectedWithLayout>} />
            <Route path="/" element={<Navigate to="/modo" replace />} />
            <Route path="/perfil" element={<ProtectedWithLayout><Perfil /></ProtectedWithLayout>} />
            <Route path="/minha-agenda" element={<ProtectedWithLayout><MinhaAgenda /></ProtectedWithLayout>} />
            <Route path="/meu-trabalho" element={<ProtectedWithLayout><MeuTrabalho /></ProtectedWithLayout>} />
            <Route path="/ferramentas-ia" element={<ProtectedWithLayout><FerramentasIA /></ProtectedWithLayout>} />
            <Route path="/comunidade" element={<ProtectedWithLayout><Comunidade /></ProtectedWithLayout>} />
            {/* Legacy standalone pages (for deep links / sub-content) */}
            <Route path="/repasse" element={<ProtectedWithLayout><Index /></ProtectedWithLayout>} />
            <Route path="/casuistica" element={<ProtectedWithLayout><Casuistica /></ProtectedWithLayout>} />
            <Route path="/nps" element={<ProtectedWithLayout><NPS /></ProtectedWithLayout>} />
            {/* Tool sub-pages */}
            <Route path="/ferramentas/percentis-us" element={<ProtectedWithLayout><PercentisUS /></ProtectedWithLayout>} />
            <Route path="/ferramentas/ti-rads" element={<ProtectedWithLayout><TiRads /></ProtectedWithLayout>} />
            <Route path="/ferramentas/medidas-adulto" element={<ProtectedWithLayout><MedidasAdulto /></ProtectedWithLayout>} />
            <Route path="/ferramentas/prova-motora-vb" element={<ProtectedWithLayout><ProvaMotoraVB /></ProtectedWithLayout>} />
            <Route path="/ferramentas/volume-vesical-ped" element={<ProtectedWithLayout><VolumeVesicalPed /></ProtectedWithLayout>} />
            <Route path="/ferramentas/cimt-percentile" element={<ProtectedWithLayout><CIMTPercentile /></ProtectedWithLayout>} />
            <Route path="/ferramentas/orads-us" element={<ProtectedWithLayout><ORADSCalculator /></ProtectedWithLayout>} />
            <Route path="/ferramentas/crescimento-fetal" element={<ProtectedWithLayout><FetalGrowth /></ProtectedWithLayout>} />
            <Route path="/gestao-agendas" element={<ProtectedWithLayout><GestaoAgendas /></ProtectedWithLayout>} />
            {/* Legacy redirects */}
            <Route path="/institucional" element={<Navigate to="/comunidade" replace />} />
            <Route path="/magia" element={<Navigate to="/ferramentas-ia" replace />} />
            <Route path="/ferramentas" element={<Navigate to="/ferramentas-ia" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
