// components/ui/UserBlockToggle.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Unlock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface UserBlockToggleProps {
  userId: string;
  isBlocked: boolean;
  onUpdate: (isBlocked: boolean) => void;
}

export default function UserBlockToggle({ userId, isBlocked, onUpdate }: UserBlockToggleProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlockToggle = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o status do usuário.');
      }

      await response.json();
      onUpdate(!isBlocked);
      toast.success(`Usuário ${!isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar o usuário:', error);
      toast.error('Erro ao atualizar o status do usuário.');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const title = isBlocked ? "Desbloquear Usuário" : "Bloquear Usuário";
  const description = isBlocked
    ? "Tem certeza que deseja desbloquear este usuário? Ele terá acesso total novamente."
    : "Tem certeza que deseja bloquear este usuário? Ele não conseguirá mais fazer login.";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsConfirmModalOpen(true)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isBlocked ? (
          <Lock className="h-4 w-4 text-red-500" />
        ) : (
          <Unlock className="h-4 w-4 text-gray-500" />
        )}
      </Button>

      <ConfirmModal
        title={title}
        description={description}
        open={isConfirmModalOpen}
        onConfirm={handleBlockToggle}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText={title}
        isSubmitting={isSubmitting}
      />
    </>
  );
}