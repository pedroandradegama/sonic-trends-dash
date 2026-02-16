import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Casuistica from "./pages/Casuistica";
import NPS from "./pages/NPS";
import Institucional from "./pages/Institucional";
import Magia from "./pages/Magia";
import Perfil from "./pages/Perfil";
import Ferramentas from "./pages/Ferramentas";
import PercentisUS from "./pages/PercentisUS";
import TiRads from "./pages/TiRads";
import Home from "./pages/Home";
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
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/casuistica" element={
              <ProtectedRoute>
                <Casuistica />
              </ProtectedRoute>
            } />
            <Route path="/nps" element={
              <ProtectedRoute>
                <NPS />
              </ProtectedRoute>
            } />
            <Route path="/institucional" element={
              <ProtectedRoute>
                <Institucional />
              </ProtectedRoute>
            } />
            <Route path="/magia" element={
              <ProtectedRoute>
                <Magia />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas" element={
              <ProtectedRoute>
                <Ferramentas />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/percentis-us" element={
              <ProtectedRoute>
                <PercentisUS />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/ti-rads" element={
              <ProtectedRoute>
                <TiRads />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/medidas-adulto" element={
              <ProtectedRoute>
                <MedidasAdulto />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/prova-motora-vb" element={
              <ProtectedRoute>
                <ProvaMotoraVB />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/volume-vesical-ped" element={
              <ProtectedRoute>
                <VolumeVesicalPed />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/cimt-percentile" element={
              <ProtectedRoute>
                <CIMTPercentile />
              </ProtectedRoute>
            } />
            <Route path="/ferramentas/orads-us" element={
              <ProtectedRoute>
                <ORADSCalculator />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
