"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

interface PermissionManagerModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const programsWithTabs = {
  "bolsa-familia": {
    name: "Bolsa Família",
    tabs: ["Famílias", "Pessoas"]
  },
  "cadastro-unico": {
    name: "Cadastro Único",
    tabs: ["Famílias", "Pessoas e Idade", "Instrução", "Trabalho"]
  },
  "protecao-basica": {
    name: "Proteção Social Básica",
    tabs: ["CRAS", "Primeira Infância", "Órfãos", "Acessuas Trabalho", "Cidade Madura", "CSUs", "Centros de Convivência"]
  },
  "protecao-especial": {
    name: "Proteção Social Especial",
    tabs: ["CREAS", "Centros Pop/Dia", "Acolhimento", "Família Acolhedora", "Projeto Acolher"]
  },
  "saude": {
    name: "Saúde",
    tabs: ["Infraestrutura", "Vacinas"]
  },
  "seguranca-alimentar": {
    name: "Segurança Alimentar",
    tabs: ["Tá na Mesa", "Cartão Alimentação", "Restaurante Popular", "PAA - Leite", "PAA - CDS", "Cisternas", "INSAN"]
  },
  "bpc-rmv": {
    name: "BPC/RMV",
    tabs: ["BPC/RMV"]
  },
  "casa-da-cidadania-e-sine": {
    name: "Casa da Cidadania e SINE",
    tabs: ["Casa da Cidadania", "SINE"]
  },
};

export default function PermissionManagerModal({ open, onClose, userId, userName }: PermissionManagerModalProps) {
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/permissions`);
        
        if (!response.ok) {
          throw new Error("Erro ao buscar as permissões.");
        }
        
        const data = await response.json();
        // Garante que o estado seja um array, mesmo se a API retornar null
        setUserPermissions(data.allowedTabs || []);
        
      } catch (error) {
        console.error("Erro ao buscar permissões:", error);
        toast.error("Erro ao carregar as permissões do usuário.");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [open, userId]);

  const handleToggleTab = (programId: string, tabName: string, isChecked: boolean) => {
    const permissionString = `${programId}_${tabName}`;
    setUserPermissions(prev =>
      isChecked
        ? [...prev, permissionString]
        : prev.filter(p => p !== permissionString)
    );
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedTabs: userPermissions }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar as permissões.");
      }

      toast.success("Permissões salvas com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast.error("Erro ao salvar as permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 flex flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Definir Permissões do Usuário</DialogTitle>
          <DialogDescription className="mt-2">
            {`Selecione os programas e abas que este usuário terá acesso para visualização e edição.`}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {Object.entries(programsWithTabs).map(([programId, program]) => (
              <div key={programId}>
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">{program.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {program.tabs.map(tabName => {
                    const permissionString = `${programId}_${tabName}`;
                    const isEnabled = userPermissions.includes(permissionString);

                    return (
                      <div key={permissionString} className="flex items-center space-x-2">
                        <Checkbox
                          id={permissionString}
                          checked={isEnabled}
                          onCheckedChange={(checked: boolean) => handleToggleTab(programId, tabName, checked)}
                        />
                        <label
                          htmlFor={permissionString}
                          className="text-sm font-medium leading-none"
                        >
                          {tabName}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter className="p-4 border-t sm:justify-end">
          <Button 
            variant="ghost" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePermissions} 
            disabled={isSaving || loading}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}