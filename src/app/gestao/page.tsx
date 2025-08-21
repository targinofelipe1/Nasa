// app/dashboard/gestao/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CircleUserRound, ChevronLeft, ChevronRight, Plus, SquarePen, Trash, Info } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import Sidebar from "@/components/ui/Sidebar";
import DeleteUserModal from "@/components/ui/DeleteUserModal";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import CreateUserForm from "@/components/ui/CreateUserForm";
import EditUserForm from "@/components/ui/EditUserForm";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/ui/DataTable";
import UserDetails from "@/components/ui/UserDetailsModal";


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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
    setIsCreateDialogOpen(false);
  };
  
  const handleUserUpdated = () => {
    fetchUsers();
    setIsEditDialogOpen(false);
  };

  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao remover o usuário.');
      fetchUsers();
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast.error('Erro ao remover o usuário. Tente novamente.');
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDelete = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailsDialogOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex bg-white min-h-screen w-full">
        {/* Sidebar com estilo responsivo */}
        <div style={{ zoom: '80%' }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        {/* Adicionado pl-24 para compensar o sidebar em telas pequenas */}
        <main className="flex-1 p-4 sm:p-8 pl-24 sm:pl-8">
          <div className="max-w-7xl mx-auto">
            {/* Título e Botão - Ajuste de layout responsivo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h1 className="text-xl sm:text-3xl font-bold text-wrap min-w-0">Listagem Geral de Usuários</h1>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  {/* Removido w-full para evitar que o botão ocupe toda a largura */}
                  <Button className="shrink-0"> 
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <CreateUserForm 
                    onUserCreated={handleUserCreated} 
                    onClose={() => setIsCreateDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>

              {selectedUser && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Usuário</DialogTitle>
                    </DialogHeader>
                    <EditUserForm
                      user={selectedUser}
                      onUserUpdated={handleUserUpdated}
                      onClose={() => setIsEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {userToDelete && (
                  <DeleteUserModal
                    user={userToDelete}
                    onConfirm={handleConfirmDelete}
                    onClose={() => setIsDeleteDialogOpen(false)}
                  />
                )}

              {isDetailsDialogOpen && selectedUserId && (
                  // Passando as props de controle para o componente filho
                  <UserDetails
                    userId={selectedUserId}
                    open={isDetailsDialogOpen}
                    onClose={() => setIsDetailsDialogOpen(false)}
                  />
                )}
                                                                
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
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
                    <span className="text-sm whitespace-nowrap">Página {currentPage} de {totalPages}</span>
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
                <div className="overflow-x-auto sm:overflow-visible">
                  {/* Tabela para telas maiores */}
                  <DataTable className="hidden sm:table w-full"> 
                    <DataTableHeader>
                      <DataTableRow>
                        <DataTableHead>Nome</DataTableHead>
                        <DataTableHead>E-mail</DataTableHead>
                        <DataTableHead>Data de Cadastro</DataTableHead>
                        <DataTableHead>Último Acesso</DataTableHead>
                        <DataTableHead className="text-center">Ações</DataTableHead>
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
                            <DataTableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                  <SquarePen className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDetails(user.id)}>
                                  <Info className="h-4 w-4 text-blue-500" />
                                </Button>
                              </div>
                            </DataTableCell>
                          </DataTableRow>
                        ))
                      ) : (
                        <DataTableRow>
                          <DataTableCell colSpan={5} className="text-center">Nenhum usuário encontrado.</DataTableCell>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>
                  
                  {/* Tabela em forma de Cards para telas pequenas (empilhados, mas com rolagem horizontal interna) */}
                  <div className="sm:hidden space-y-4 mt-4">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border overflow-x-auto whitespace-nowrap">
                          <div className="flex items-center space-x-3 mb-2">
                            {user.imageUrl ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                <Image
                                  src={user.imageUrl}
                                  alt={user.fullName}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  className="rounded-full"
                                />
                              </div>
                            ) : (
                              <CircleUserRound className="w-10 h-10 text-gray-400" />
                            )}
                            <h3 className="font-bold text-lg">{user.fullName}</h3>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p className="truncate"><span className="font-semibold">E-mail:</span> {user.email}</p>
                            <p><span className="font-semibold">Cadastro:</span> {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                            <p><span className="font-semibold">Último Acesso:</span> {user.lastSignInAt ? format(new Date(user.lastSignInAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                          </div>
                          {/* Ajustado: Centralizado as ações */}
                          <div className="flex justify-center space-x-2 mt-4">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                              <SquarePen className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDetails(user.id)}>
                              <Info className="h-4 w-4 text-blue-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 mt-4">Nenhum usuário encontrado.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}