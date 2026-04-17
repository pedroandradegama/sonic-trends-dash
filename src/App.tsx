import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import TasksPage from "./pages/TasksPage";
import Comunidade from "./pages/Comunidade";
import Index from "./pages/Index";
import Casuistica from "./pages/Casuistica";
import NPS from "./pages/NPS";
import PercentisUS from "./pages/PercentisUS";
import TiRads from "./pages/TiRads";
import MedidasAdulto from "./pages/MedidasAdulto";
import ProvaMotoraVB from "./pages/ProvaMotoraVB";
import VolumeVesicalPed from "./pages/VolumeVesicalPed";
import CIMTPercentile from "./pages/CIMTPercentile";
import ORADSCalculator from "./pages/ORADSCalculator";
import FetalGrowth from "./pages/FetalGrowth";
import PedVolume from "./pages/PedVolume";
import { FinancialNavigatorLayout } from "@/components/financialNavigator/FinancialNavigatorLayout";
import { Block3Page } from "@/components/financialNavigator/block3/Block3Page";
import { Block4Page } from "@/components/financialNavigator/block4/Block4Page";
import { FnOpenFinancePage } from "@/components/financialNavigator/openFinance/FnOpenFinancePage";
import GestaoFinanceiraPage from "@/pages/GestaoFinanceira";
import { TempoLayout } from "@/components/tempo/TempoLayout";
import { TempoAgendaPage } from "@/components/tempo/TempoAgendaPage";
import { TempoDeslocamentosPage } from "@/components/tempo/TempoDeslocamentosPage";
import { TempoTarefasPage } from "@/components/tempo/TempoTarefasPage";

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
            <Route path="/projecao" element={<Navigate to="/financeiro/projecao" replace />} />
            <Route path="/ferramentas-ia" element={<ProtectedWithLayout><FerramentasIA /></ProtectedWithLayout>} />
            <Route path="/ferramentas-ia/tarefas" element={<ProtectedWithLayout><TasksPage /></ProtectedWithLayout>} />
            <Route path="/comunidade" element={<ProtectedWithLayout><Comunidade /></ProtectedWithLayout>} />
            {/* Tempo */}
            <Route path="/tempo" element={<ProtectedWithLayout><TempoLayout /></ProtectedWithLayout>}>
              <Route path="agenda" element={<TempoAgendaPage />} />
              <Route path="deslocamentos" element={<TempoDeslocamentosPage />} />
              <Route path="tarefas" element={<TempoTarefasPage />} />
              <Route index element={<Navigate to="deslocamentos" replace />} />
            </Route>
            {/* Legacy standalone pages */}
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
            <Route path="/ferramentas/ped-volume" element={<ProtectedWithLayout><PedVolume /></ProtectedWithLayout>} />
            <Route path="/gestao-agendas" element={<ProtectedWithLayout><GestaoAgendas /></ProtectedWithLayout>} />
            {/* Financial Navigator */}
            <Route path="/financeiro" element={<ProtectedWithLayout><FinancialNavigatorLayout /></ProtectedWithLayout>}>
              <Route path="projecao" element={<Block3Page />} />
              <Route path="insights" element={<Block4Page />} />
              <Route path="saude" element={<FnOpenFinancePage />} />
              <Route path="gestao" element={<GestaoFinanceiraPage />} />
              <Route index element={<Navigate to="projecao" replace />} />
            </Route>
            {/* Legacy redirects */}
            <Route path="/financeiro/config" element={<Navigate to="/tempo/agenda" replace />} />
            <Route path="/financeiro/agendas" element={<Navigate to="/tempo/agenda" replace />} />
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
