// components/ui/DeleteUserModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Button } from "@/app/components-antigo/Button";

interface DeleteUserModalProps {
  user: {
    id: string;
    fullName: string;
  };
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteUserModal({ user, onConfirm, onClose }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success("Usuário removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover o usuário. Tente novamente.");
    } finally {
      setLoading(false);
      onClose();
    }
  };
  
  // Condicionalmente renderiza o modal apenas se o 'user' estiver presente
  if (!user) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover o usuário <strong>{user.fullName}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" /> Deletar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}