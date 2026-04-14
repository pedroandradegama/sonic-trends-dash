import { useState, useEffect } from "react";
import { HardDrive, Check, Loader2, Unplug, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GDriveFolderSelector } from "./GDriveFolderSelector";

export function GoogleDriveConnectCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  const fetchIntegration = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("google_drive_integrations")
      .select("*")
      .eq("medico_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    setIntegration(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegration();
  }, [user]);

  // Listen for OAuth callback message
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "google-drive-oauth-success") {
        fetchIntegration();
        toast({ title: "Google Drive conectado", description: "Sua conta foi vinculada com sucesso." });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-drive-oauth", {
        body: { action: "get_auth_url", medico_id: user.id },
      });
      if (error) throw error;
      // Open popup
      const popup = window.open(data.authUrl, "google-oauth", "width=500,height=600,menubar=no,toolbar=no");
      // Poll for popup close
      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          setConnecting(false);
          fetchIntegration();
        }
      }, 1000);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await supabase.functions.invoke("google-drive-oauth", {
        body: { action: "disconnect", medico_id: user.id },
      });
      setIntegration(null);
      toast({ title: "Desconectado", description: "Google Drive foi desvinculado." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = !!integration;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Drive</CardTitle>
                <CardDescription>Sincronize automaticamente seus relatórios</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : ""}>
              {isConnected ? <><Check className="h-3 w-3 mr-1" /> Conectado</> : "Desconectado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isConnected ? (
            <>
              {integration.folder_name && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Pasta monitorada:</span>{" "}
                  <span className="font-medium">{integration.folder_name}</span>
                </div>
              )}
              {integration.last_sync && (
                <p className="text-xs text-muted-foreground">
                  Última sincronização: {new Date(integration.last_sync).toLocaleString("pt-BR")}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFolderSelector(true)}>
                  <FolderOpen className="h-4 w-4 mr-1" /> Configurar pasta
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive">
                  <Unplug className="h-4 w-4 mr-1" /> Desconectar
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HardDrive className="h-4 w-4 mr-2" />}
              Conectar Google Drive
            </Button>
          )}
        </CardContent>
      </Card>

      {showFolderSelector && (
        <GDriveFolderSelector
          open={showFolderSelector}
          onOpenChange={setShowFolderSelector}
          currentFolderId={integration?.folder_id}
          currentPatterns={integration?.file_patterns || []}
          currentAutoProcess={integration?.auto_process ?? false}
          onSaved={fetchIntegration}
        />
      )}
    </>
  );
}
