// app/dashboard/gestao/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CircleUserRound, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import CreateUserForm from "@/components/ui/CreateUserForm";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  imageUrl?: string;
  lastSignInAt?: number | null;
  createdAt?: number;
}

export default function GestaoPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Estado para controlar o modal
  const usersPerPage = 4;

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erro ao buscar usuários.');
      const { data, totalCount } = await response.json();

      setUsers(data || []);
      setTotalUsers(totalCount || 0);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar a lista de usuários.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const handleUserCreated = () => {
    fetchUsers();
    setIsDialogOpen(false); // Fecha o modal após a criação do usuário
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: '80%' }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Listagem Geral de Usuários</h1>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <CreateUserForm 
                    onUserCreated={handleUserCreated} 
                    onClose={() => setIsDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold">Total: {totalUsers} usuários</p>
                {usersLoading ? null : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {usersLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DataTable>
                    <DataTableHeader>
                      <DataTableRow>
                        <DataTableHead>Nome</DataTableHead>
                        <DataTableHead>E-mail</DataTableHead>
                        <DataTableHead>Data de Cadastro</DataTableHead>
                        <DataTableHead>Último Acesso</DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {currentUsers.length > 0 ? (
                        currentUsers.map((user) => (
                          <DataTableRow key={user.id}>
                            <DataTableCell>
                              <div className="flex items-center space-x-3">
                                {user.imageUrl ? (
                                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                    <Image
                                      src={user.imageUrl}
                                      alt={user.fullName}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      className="rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <CircleUserRound className="w-8 h-8 text-gray-400" />
                                )}
                                <p className="font-medium text-gray-900">{user.fullName}</p>
                              </div>
                            </DataTableCell>
                            <DataTableCell>{user.email}</DataTableCell>
                            <DataTableCell>
                              {user.createdAt ? format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
                            </DataTableCell>
                            <DataTableCell>
                              {user.lastSignInAt ? format(new Date(user.lastSignInAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
                            </DataTableCell>
                          </DataTableRow>
                        ))
                      ) : (
                        <DataTableRow>
                          <DataTableCell colSpan={4} className="text-center">Nenhum usuário encontrado.</DataTableCell>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}