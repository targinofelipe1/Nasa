"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Laptop } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface UserDetailsProps {
  userId: string;
  onClose: () => void;
  open: boolean;
}

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  publicMetadata: { role?: string };
  lastSignInAt: number | null;
  createdAt: number;
  sessions: {
    id: string;
    lastActiveAt: number;
    status: string;
    latestActivity?: {
      id: string;
      isMobile: boolean;
      ipAddress: string;
      city: string | null;
      country: string | null;
      browserVersion: string;
      browserName: string;
      deviceType: string;
    };
  }[];
}

export default function UserDetails({ userId, onClose, open }: UserDetailsProps) {
  const [user, setUser] = useState<ClerkUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Erro ao buscar detalhes do usuário.');
        const userData: ClerkUser = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        toast.error('Erro ao carregar detalhes do usuário.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, open]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="text-center text-gray-500 p-4">
            Não foi possível carregar os detalhes do usuário.
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Seção de Dados Principais */}
            <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Dados do Perfil</h3>
              <div className="text-sm space-y-1">
                <p><strong>Nome:</strong> {`${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>E-mail:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                <p>
                  <strong>Função:</strong>{" "}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    {user.publicMetadata.role || 'Padrão'}
                  </span>
                </p>
                <p><strong>Cadastrado em:</strong> {user.createdAt ? format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}</p>
                <p><strong>Último Acesso:</strong> {user.lastSignInAt ? format(new Date(user.lastSignInAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}</p>
              </div>
            </div>

            {/* Seção de Dispositivos */}
            <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Dispositivos</h3>
              {user.sessions.length > 0 ? (
                <div className="space-y-4">
                  {user.sessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row items-start justify-between space-y-2 sm:space-y-0 sm:space-x-4 p-2 border-b">
                      <div className="flex items-start space-x-2 w-full">
                        <Laptop className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />
                        <div className="flex flex-col flex-grow">
                          <p className="text-sm font-medium text-gray-900">
                            {session.latestActivity?.deviceType || 'Dispositivo Desconhecido'} - {session.latestActivity?.browserName || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            IP: {session.latestActivity?.ipAddress || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Local: {session.latestActivity?.city || 'Desconhecido'}, {session.latestActivity?.country || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Último Acesso: {session.lastActiveAt ? format(new Date(session.lastActiveAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto flex justify-end">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {session.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum dispositivo encontrado.</p>
              )}
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}