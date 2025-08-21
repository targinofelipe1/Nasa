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
  const usersPerPage = 4;

  const fetchUsers = async (page: number) => {
    setUsersLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&limit=${usersPerPage}`);
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
    fetchUsers(currentPage);
  }, [currentPage]);

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="bg-white min-h-screen w-full">
        {/* Sidebar fixa em todas as telas */}
        <div className="h-screen overflow-auto fixed left-0 top-0">
          <Sidebar />
        </div>
        
        {/* Conteúdo principal com margem para a Sidebar */}
        <main className="p-4 md:p-8 ml-[80px]">
          <div className="max-w-7xl mx-auto">
            {/* Título e botão "Adicionar" */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Listagem Geral de Usuários</h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <CreateUserForm onUserCreated={() => fetchUsers(currentPage)} />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              {/* Informação de total e paginação */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <p className="text-sm font-semibold mb-2 sm:mb-0">Total: {totalUsers} usuários</p>
                {usersLoading ? null : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Página {currentPage} de {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Tabela de usuários */}
              {usersLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
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
                      {users.length > 0 ? (
                        users.map((user) => (
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