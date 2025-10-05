// components/ui/AdminAuditLogModal.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components-antigo/Dialog";
import { Button } from "@/app/components-antigo/Button";



interface AdminAuditLogModalProps {
  open: boolean;
  onClose: () => void;
}

interface AuditLogEntry {
  action: string;
  targetUserId: string;
  at: string;
}

export default function AdminAuditLogModal({ open, onClose }: AdminAuditLogModalProps) {
  const { userId } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const logsPerPage = 2;

  useEffect(() => {
    if (!open || !userId) return;

    setPage(1);

    const fetchAuditLog = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Erro ao carregar log de auditoria.");
        }
        const userData = await response.json();
        setAuditLog(userData.privateMetadata?.adminAuditLog || []);
      } catch (error) {
        console.error("Erro ao carregar log de auditoria:", error);
        toast.error("Erro ao carregar o histórico de auditoria.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [open, userId]);

  if (!open) {
    return null;
  }

  const totalPages = Math.ceil(auditLog.length / logsPerPage);
  const startIndex = (page - 1) * logsPerPage;
  const currentLogs = auditLog.slice(startIndex, startIndex + logsPerPage);

  const paginate = (pageNumber: number) => setPage(pageNumber);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle>Minhas Ações de Auditoria</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : auditLog.length > 0 ? (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-4 mb-4">
              {currentLogs.map((log, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="flex items-start space-x-2">
                    <UserRound className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />
                    <div className="flex flex-col flex-grow">
                      {/* Lógica de exibição da ação */}
                      <p className="text-sm font-medium text-gray-900">
                        {log.action.includes("Alterou as permissões do usuário") ? (
                          <>
                            Ação: Definição de Permissão
                            <br />
                            <span className="text-xs text-gray-500 font-normal">
                              {log.action.replace("Alterou as permissões do usuário ", "Para o usuário: ")}
                            </span>
                          </>
                        ) : (
                          `Ação: ${log.action}`
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Em: {format(new Date(log.at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID do Usuário Afetado: {log.targetUserId}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Controles de Paginação */}
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm whitespace-nowrap">Página {page} de {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 p-4">
            Nenhuma ação de auditoria registrada.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}