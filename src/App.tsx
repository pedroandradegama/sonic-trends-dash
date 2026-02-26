import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/minha-agenda" element={<ProtectedRoute><MinhaAgenda /></ProtectedRoute>} />
            <Route path="/meu-trabalho" element={<ProtectedRoute><MeuTrabalho /></ProtectedRoute>} />
            <Route path="/ferramentas-ia" element={<ProtectedRoute><FerramentasIA /></ProtectedRoute>} />
            <Route path="/comunidade" element={<ProtectedRoute><Comunidade /></ProtectedRoute>} />
            {/* Legacy standalone pages (for deep links / sub-content) */}
            <Route path="/repasse" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/casuistica" element={<ProtectedRoute><Casuistica /></ProtectedRoute>} />
            <Route path="/nps" element={<ProtectedRoute><NPS /></ProtectedRoute>} />
            {/* Tool sub-pages */}
            <Route path="/ferramentas/percentis-us" element={<ProtectedRoute><PercentisUS /></ProtectedRoute>} />
            <Route path="/ferramentas/ti-rads" element={<ProtectedRoute><TiRads /></ProtectedRoute>} />
            <Route path="/ferramentas/medidas-adulto" element={<ProtectedRoute><MedidasAdulto /></ProtectedRoute>} />
            <Route path="/ferramentas/prova-motora-vb" element={<ProtectedRoute><ProvaMotoraVB /></ProtectedRoute>} />
            <Route path="/ferramentas/volume-vesical-ped" element={<ProtectedRoute><VolumeVesicalPed /></ProtectedRoute>} />
            <Route path="/ferramentas/cimt-percentile" element={<ProtectedRoute><CIMTPercentile /></ProtectedRoute>} />
            <Route path="/ferramentas/orads-us" element={<ProtectedRoute><ORADSCalculator /></ProtectedRoute>} />
            {/* Legacy redirects */}
            {/* Legacy redirects - removed /perfil redirect since it's now a real page */}
            <Route path="/institucional" element={<Navigate to="/comunidade" replace />} />
            <Route path="/magia" element={<Navigate to="/ferramentas-ia" replace />} />
            <Route path="/ferramentas" element={<Navigate to="/ferramentas-ia" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
