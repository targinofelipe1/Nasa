"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Importação do roteador do Next.js
import { FiMenu } from "react-icons/fi";
import {
  AiOutlineBarChart,
  AiOutlineFund,
  AiOutlineSetting,
  AiOutlineFileText,
  AiOutlineFile,
  AiOutlineHome,
} from "react-icons/ai";
import { MdOutlineMap } from "react-icons/md";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs"; // ✅ Importando Clerk para autenticação

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser(); // ✅ Obtém o usuário autenticado
  const { signOut } = useAuth(); // ✅ Para logout
  const router = useRouter(); // ✅ Roteador para redirecionamento

  // ✅ Função para deslogar e redirecionar para a tela de login
  const handleLogout = async () => {
    await signOut();
    router.push("/auth/sign-in"); // ✅ Redireciona para a página de login
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-300 transition-all duration-300 shadow-lg ${
          isOpen ? "w-64" : "w-16"
        } flex flex-col items-center z-50`}
      >
        {/* Ícone do Menu */}
        <div
          className="absolute top-4 right-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiMenu size={24} className="text-gray-600" />
        </div>

        {/* Avatar, Nome e Botão de Logout */}
        {user && (
          <div className="flex flex-col items-center mt-12">
            <img
              src={user.imageUrl}
              alt="User Avatar"
              className="w-10 h-10 rounded-full mb-2"
            />
            {isOpen && (
              <>
                <p className="text-gray-800 font-medium text-sm text-center">
                  {user.fullName}
                </p>
                <button
                  onClick={handleLogout} // ✅ Botão para deslogar
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        )}

        {/* Itens do menu */}
        <nav className="mt-6 w-full">
          <ul className="space-y-4">
            <li>
              <Link href="/" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineHome className="mr-3" size={20} />
                {isOpen && "Página Inicial"}
              </Link>
            </li>
            <li>
              <Link href="/dashboard-estadual" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineBarChart className="mr-3" size={20} />
                {isOpen && "Dashboard Estadual"}
              </Link>
            </li>
            <li>
              <Link href="/dashboard-municipal" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineFund className="mr-3" size={20} />
                {isOpen && "Dashboard Municipal"}
              </Link>
            </li>
            <li>
              <Link href="/maps" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <MdOutlineMap className="mr-3" size={20} />
                {isOpen && "Mapa"}
              </Link>
            </li>
            <li>
              <Link href="/relatorios-estadual" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineFileText className="mr-3" size={20} />
                {isOpen && "Relatórios Estaduais"}
              </Link>
            </li>
            <li>
              <Link href="/relatorio-municipal" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineFile className="mr-3" size={20} />
                {isOpen && "Relatórios Municipais"}
              </Link>
            </li>
            <li>
              <Link href="/config" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineSetting className="mr-3" size={20} />
                {isOpen && "Configurações"}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Conteúdo Principal */}
      <div
        className={`transition-all duration-300 flex-1 p-6 overflow-x-hidden`}
        style={{
          marginLeft: isOpen ? "16rem" : "4rem",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        {/* Conteúdo dinâmico será renderizado aqui */}
      </div>
    </div>
  );
};

export default Sidebar;
