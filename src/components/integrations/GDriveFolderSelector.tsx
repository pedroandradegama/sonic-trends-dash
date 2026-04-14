import { useState, useEffect } from "react";
import { Folder, Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId?: string;
  currentPatterns: string[];
  currentAutoProcess: boolean;
  onSaved: () => void;
}

interface DriveFolder {
  id: string;
  name: string;
}

export function GDriveFolderSelector({ open, onOpenChange, currentFolderId, currentPatterns, currentAutoProcess, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [patterns, setPatterns] = useState(currentPatterns.join(", "));
  const [autoProcess, setAutoProcess] = useState(currentAutoProcess);

  useEffect(() => {
    if (!open || !user) return;
    const loadFolders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-drive-oauth", {
          body: { action: "list_folders", medico_id: user.id },
        });
        if (error) throw error;
        setFolders(data.folders || []);
        if (currentFolderId) {
          const current = (data.folders || []).find((f: DriveFolder) => f.id === currentFolderId);
          if (current) setSelectedFolder(current);
        }
      } catch (err: any) {
        toast({ title: "Erro ao listar pastas", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadFolders();
  }, [open, user]);

  const handleSave = async () => {
    if (!selectedFolder || !user) return;
    setSaving(true);
    try {
      const filePatterns = patterns
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("google_drive_integrations")
        .update({
          folder_id: selectedFolder.id,
          folder_name: selectedFolder.name,
          file_patterns: filePatterns,
          auto_process: autoProcess,
        })
        .eq("medico_id", user.id);

      if (error) throw error;

      toast({ title: "Configuração salva", description: `Pasta "${selectedFolder.name}" será monitorada.` });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Pasta Monitorada</DialogTitle>
          <DialogDescription>Selecione a pasta do Google Drive para monitorar novos arquivos</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione uma pasta</Label>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-2 space-y-1">
                  {folders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pasta encontrada</p>
                  ) : (
                    folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                          selectedFolder?.id === folder.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <Folder className="h-4 w-4 shrink-0" />
                        {folder.name}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patterns">Padrões de nome de arquivo</Label>
              <Input
                id="patterns"
                value={patterns}
                onChange={(e) => setPatterns(e.target.value)}
                placeholder="*Repasse*, *Produtividade*"
              />
              <p className="text-xs text-muted-foreground">Separe os padrões por vírgula. Ex: *Repasse*, *Produtividade*</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="auto-process" className="text-sm">Processar automaticamente</Label>
                <p className="text-xs text-muted-foreground">Extrair dados ao detectar novos arquivos</p>
              </div>
              <Switch id="auto-process" checked={autoProcess} onCheckedChange={setAutoProcess} />
            </div>

            <Button onClick={handleSave} disabled={!selectedFolder || saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar configuração
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
