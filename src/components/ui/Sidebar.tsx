"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { FaBalanceScale, FaBalanceScaleLeft, FaChartBar, FaChartLine, FaClipboardList, FaFileAlt, FaFileContract, FaFileInvoice, FaHandHoldingUsd, FaIdCard, FaRegAddressBook, FaRegAddressCard, FaRegFileAlt, FaRegIdCard, FaShieldAlt, FaShoppingBasket, FaStethoscope, FaUsers, FaUserShield, FaUtensils, FaVoteYea } from "react-icons/fa";
import {
  AiOutlineBarChart,
  AiOutlineFund,
  AiOutlineSetting,
  AiOutlineFileText,
  AiOutlineFile,
  AiOutlineHome,
  AiOutlineUp,
  AiOutlineDown,
  AiOutlineFolder,
  AiOutlineUsergroupAdd,
  AiOutlineAreaChart,
  AiOutlineFileSearch,
  AiOutlineSwap,
  AiOutlineInsertRowBelow,
  AiOutlineLineChart,
} from "react-icons/ai";
import { MdEmojiObjects, MdHowToVote, MdOutlineAnalytics, MdOutlineHowToVote, MdOutlineMap, MdOutlineShowChart } from "react-icons/md";
import { BsArrowLeftRight, BsBoxArrowInDown } from "react-icons/bs";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { Settings, Sliders } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [showPrograms, setShowPrograms] = useState(false);
  const [showElections, setShowElections] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/sign-in");
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
                  onClick={handleLogout}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        )}

        <nav className="mt-6 w-full flex-1 overflow-y-auto pb-4">
          <ul className="space-y-4">
            <li>
              <Link href="/" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineHome className="mr-3" size={20} />
                {isOpen && "Página Inicial"}
              </Link>
            </li>
             <li className="flex flex-col">
              <button
                onClick={() => setShowPrograms(!showPrograms)}
                className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 w-full"
              >
                <div className="flex items-center">
                  <AiOutlineFolder className="mr-3" size={20} />
                  {isOpen && "Programas"}
                </div>
                {isOpen && (
                  <span className="ml-auto">
                    {showPrograms ? <AiOutlineUp size={14} /> : <AiOutlineDown size={14} />}
                  </span>
                )}
              </button>

              {showPrograms && isOpen && (
               <ul className="ml-10 text-gray-600 dark:text-gray-400">
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaRegIdCard className="mr-2" size={16} />
                  <Link href="/programas/cadastro-unico">Cadastro Único</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaUsers className="mr-2" size={16} />
                  <Link href="/programas/bolsa-familia">Bolsa Família</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaShieldAlt className="mr-2" size={16} />
                  <Link href="/programas/protecao-basica">Proteção Social Básica</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaUserShield className="mr-2" size={16} />
                  <Link href="/programas/protecao-especial">Proteção Social Especial</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaUtensils className="mr-2" size={16} />
                  <Link href="/programas/seguranca-alimentar">Segurança Alimentar</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaRegAddressCard className="mr-2" size={16} />
                  <Link href="/programas/casa-da-cidadania-e-sine">Casa da Cidadania</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaHandHoldingUsd className="mr-2" size={16} />
                  <Link href="/programas/bpc-rmv">BPC/RMV</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaStethoscope className="mr-2" size={16} />
                  <Link href="/programas/saude">Saúde</Link>
                </li>
                 <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaClipboardList className="mr-2" size={16} />
                  <Link href="/programas/auditoria">Gerenciamento de Ações</Link>
                </li>
                <li className="flex items-center py-1 hover:text-blue-500 dark:hover:text-blue-400">
                  <FaShoppingBasket className="mr-2" size={16} />
                  <Link href="/programas/paa">PAA</Link>
                </li>

              </ul>

              )}
            </li>

            <li>
              <Link href="/maps" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <MdOutlineMap className="mr-3" size={20} />
                {isOpen && "Mapa"}
              </Link>
            </li>
            <li>
            <Link
              href="/analise-grafica"
              className="flex items-center text-gray-700 hover:text-blue-600 px-4"
            >
              <MdOutlineAnalytics className="mr-3" size={20} />
              {isOpen && "Análise Gráfica"}
            </Link>
          </li>

            <li>
              <Link href="/relatorios-estadual" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <AiOutlineFileText className="mr-3" size={20} />
                {isOpen && "Gerar Relatórios"}
              </Link>
            </li>
             <li>
              <Link href="/config" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <Settings className="mr-3" size={20} />
                {isOpen && "Configurações"}
              </Link>
            </li>
             <li>
              <Link href="/gestao" className="flex items-center text-gray-700 hover:text-blue-600 px-4">
                <Sliders className="mr-3" size={20} />
                {isOpen && "Painel de Gestão"}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div
        className={`transition-all duration-300 flex-1 p-6 overflow-x-hidden`}
        style={{
          marginLeft: isOpen ? "16rem" : "4rem",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
      </div>
    </div>
  );
};

export default Sidebar;