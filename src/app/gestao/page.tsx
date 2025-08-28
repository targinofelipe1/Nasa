// app/dashboard/gestao/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
  Plus,
  SquarePen,
  Info,
  X,
  Mail,
  User,
  Calendar,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import Sidebar from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // ✅ necessário para o botão "Adicionar Novo Usuário"
} from "@/components/ui/Dialog";
import CreateUserForm from "@/components/ui/CreateUserForm";
import EditUserForm from "@/components/ui/EditUserForm";
import UserDetails from "@/components/ui/UserDetailsModal";
import UserBlockToggle from "@/components/ui/UserBlockToggle";
import AdminAuditLogModal from "@/components/ui/AdminAuditLogModal";
import PermissionManagerModal from "@/components/ui/PermissionManagerModal";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/DataTable";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  imageUrl?: string | null;
  lastSignInAt?: number | null;
  createdAt?: number | null;
  isBlocked: boolean;
}

export default function GestaoPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [isAdminAuditModalOpen, setIsAdminAuditModalOpen] = useState(false);

  // ✅ estados para modal de permissões
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // filtros
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [lastSignInAtFilter, setLastSignInAtFilter] = useState("");

  const usersPerPage = 4;

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) throw new Error("Erro ao buscar usuários.");
      const { data, totalCount } = (await response.json()) as {
        data: UserData[];
        totalCount: number;
      };

      setUsers(data || []);
      setTotalUsers(totalCount || 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar a lista de usuários.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lista filtrada (useMemo p/ evitar recomputar em cada render)
  const filteredUsers = useMemo(() => {
    const nf = nameFilter.toLowerCase();
    const ef = emailFilter.toLowerCase();

    return users.filter((user) => {
      const matchesName = user.fullName?.toLowerCase().includes(nf);
      const matchesEmail = user.email?.toLowerCase().includes(ef);

      const formattedCreatedAt =
        user.createdAt != null
          ? format(new Date(user.createdAt), "dd/MM/yyyy")
          : "";
      const formattedLastSignInAt =
        user.lastSignInAt != null
          ? format(new Date(user.lastSignInAt), "dd/MM/yyyy")
          : "";

      const matchesCreatedAt = formattedCreatedAt.includes(createdAtFilter);
      const matchesLastSignInAt =
        formattedLastSignInAt.includes(lastSignInAtFilter);

      return (
        matchesName &&
        matchesEmail &&
        matchesCreatedAt &&
        matchesLastSignInAt
      );
    });
  }, [users, nameFilter, emailFilter, createdAtFilter, lastSignInAtFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => {
    const clamped = Math.min(Math.max(pageNumber, 1), totalPages);
    setCurrentPage(clamped);
  };

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

  const handleDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailsDialogOpen(true);
  };

  const handleClearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setCreatedAtFilter("");
    setLastSignInAtFilter("");
    setCurrentPage(1);
  };

  // ✅ abrir modal de permissões
  const handleOpenPermissionModal = (user: UserData) => {
    setSelectedUserForPermissions({ id: user.id, name: user.fullName });
    setIsPermissionModalOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen overflow-auto">
          <Sidebar />
        </div>

        <main className="flex-1 p-4 sm:p-8 pl-24 sm:pl-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h1 className="text-xl sm:text-3xl font-bold text-wrap min-w-0">
                Listagem Geral de Usuários
              </h1>

              <div className="flex gap-2">
                <Button
                  className="shrink-0"
                  onClick={() => setIsAdminAuditModalOpen(true)}
                >
                  Minhas Ações
                </Button>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
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
              </div>

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

              {isDetailsDialogOpen && selectedUserId && (
                <UserDetails
                  userId={selectedUserId}
                  open={isDetailsDialogOpen}
                  onClose={() => setIsDetailsDialogOpen(false)}
                />
              )}

              <AdminAuditLogModal
                open={isAdminAuditModalOpen}
                onClose={() => setIsAdminAuditModalOpen(false)}
              />

              {/* ✅ Modal de gerenciamento de permissões */}
              {selectedUserForPermissions && (
                <PermissionManagerModal
                  open={isPermissionModalOpen}
                  onClose={() => setIsPermissionModalOpen(false)}
                  userId={selectedUserForPermissions.id}
                  userName={selectedUserForPermissions.name}
                />
              )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Filtrar por e-mail..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Filtrar data de cadastro (dd/mm/yyyy)..."
                      value={createdAtFilter}
                      onChange={(e) => setCreatedAtFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Filtrar último acesso (dd/mm/yyyy)..."
                      value={lastSignInAtFilter}
                      onChange={(e) => setLastSignInAtFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="sm:mt-0 w-full sm:w-auto shrink-0"
                >
                  <X className="w-4 h-4 mr-2" /> Limpar Filtros
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                <p className="text-sm font-semibold">
                  Total: {filteredUsers.length} usuários
                </p>

                {!usersLoading && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm whitespace-nowrap">
                      Página {currentPage} de {totalPages}
                    </span>
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
                  {/* Tabela (desktop) */}
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
                                      style={{ objectFit: "cover" }}
                                      className="rounded-full"
                                    />
                                  </div>
                                ) : (
                                  <CircleUserRound className="w-8 h-8 text-gray-400" />
                                )}
                                <p className="font-medium text-gray-900">
                                  {user.fullName}
                                </p>
                              </div>
                            </DataTableCell>

                            <DataTableCell>{user.email}</DataTableCell>

                            <DataTableCell>
                              {user.createdAt != null
                                ? format(
                                    new Date(user.createdAt),
                                    "dd 'de' MMMM 'de' yyyy",
                                    { locale: ptBR }
                                  )
                                : "N/A"}
                            </DataTableCell>

                            <DataTableCell>
                              {user.lastSignInAt != null
                                ? format(
                                    new Date(user.lastSignInAt),
                                    "dd 'de' MMMM 'de' yyyy",
                                    { locale: ptBR }
                                  )
                                : "N/A"}
                            </DataTableCell>

                            <DataTableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(user)}
                                >
                                  <SquarePen className="h-4 w-4 text-gray-500" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDetails(user.id)}
                                >
                                  <Info className="h-4 w-4 text-blue-500" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenPermissionModal(user)}
                                >
                                  <Lock className="h-4 w-4 text-orange-500" />
                                </Button>

                                <UserBlockToggle
                                  userId={user.id}
                                  isBlocked={user.isBlocked}
                                  onUpdate={fetchUsers}
                                />
                              </div>
                            </DataTableCell>
                          </DataTableRow>
                        ))
                      ) : (
                        <DataTableRow>
                          <DataTableCell colSpan={5} className="text-center">
                            Nenhum usuário encontrado.
                          </DataTableCell>
                        </DataTableRow>
                      )}
                    </DataTableBody>
                  </DataTable>

                  {/* Cartões (mobile) */}
                  <div className="sm:hidden space-y-4 mt-4">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-gray-50 p-4 rounded-lg shadow-sm border overflow-x-auto whitespace-nowrap"
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            {user.imageUrl ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                <Image
                                  src={user.imageUrl}
                                  alt={user.fullName}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  className="rounded-full"
                                />
                              </div>
                            ) : (
                              <CircleUserRound className="w-10 h-10 text-gray-400" />
                            )}
                            <h3 className="font-bold text-lg">{user.fullName}</h3>
                          </div>

                          <div className="text-sm text-gray-700">
                            <p className="truncate">
                              <span className="font-semibold">E-mail:</span>{" "}
                              {user.email}
                            </p>
                            <p>
                              <span className="font-semibold">Cadastro:</span>{" "}
                              {user.createdAt != null
                                ? format(new Date(user.createdAt), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })
                                : "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Último Acesso:</span>{" "}
                              {user.lastSignInAt != null
                                ? format(new Date(user.lastSignInAt), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })
                                : "N/A"}
                            </p>
                          </div>

                          <div className="flex justify-center space-x-2 mt-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <SquarePen className="h-4 w-4 text-gray-500" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDetails(user.id)}
                            >
                              <Info className="h-4 w-4 text-blue-500" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPermissionModal(user)}
                            >
                              <Lock className="h-4 w-4 text-orange-500" />
                            </Button>

                            <UserBlockToggle
                              userId={user.id}
                              isBlocked={user.isBlocked}
                              onUpdate={fetchUsers}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 mt-4">
                        Nenhum usuário encontrado.
                      </div>
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
