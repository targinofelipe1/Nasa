// components/ui/ConfirmModal.tsx
"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Button } from "@/app/components-antigo/Button";
import { Loader2 } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  description: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: string;
  isSubmitting: boolean;
}

export const ConfirmModal = ({
  title,
  description,
  open,
  onConfirm,
  onCancel,
  confirmText,
  isSubmitting,
}: ConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};