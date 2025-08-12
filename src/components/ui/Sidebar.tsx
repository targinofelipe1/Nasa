"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import { FaBalanceScale, FaBalanceScaleLeft, FaChartBar, FaChartLine, FaFileAlt, FaFileContract, FaFileInvoice, FaRegAddressBook, FaRegFileAlt, FaVoteYea } from "react-icons/fa";
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
import { MdEmojiObjects, MdHowToVote, MdOutlineHowToVote, MdOutlineMap, MdOutlineShowChart } from "react-icons/md";
import { BsArrowLeftRight, BsBoxArrowInDown } from "react-icons/bs";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";

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

        {/* Adicionado overflow-y-auto e flex-1 para preencher o espaço restante */}
        <nav className="mt-6 w-full flex-1 overflow-y-auto pb-4">
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
            <li className="flex flex-col">
              <button
                onClick={() => setShowPrograms(!showPrograms)}
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 px-4 py-2 w-full"
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
                <ul className="ml-10 text-gray-600">
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <BsBoxArrowInDown className="mr-2" size={16} />
                    <Link href="/programas/paa-cds">PAA - CDS</Link>
                  </li>
                </ul>
              )}
            </li>
            <li className="flex flex-col">
              <button
                onClick={() => setShowElections(!showElections)}
                className="flex items-center justify-between text-gray-700 hover:text-blue-600 px-4 py-2 w-full"
              >
                <div className="flex items-center">
                  <MdOutlineHowToVote className="mr-3" size={20} />
                  {isOpen && "Eleições"}
                </div>
                {isOpen && (
                  <span className="ml-auto">
                    {showElections ? <AiOutlineUp size={14} /> : <AiOutlineDown size={14} />}
                  </span>
                )}
              </button>

              {showElections && isOpen && (
                <ul className="ml-10 text-gray-600">
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineUsergroupAdd className="mr-2" size={16} />
                    <Link href="/votacao/eleitorado">Eleitorado</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineLineChart className="mr-2" size={16} />
                    <Link href="/votacao/2018">Eleições 2018</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineBarChart className="mr-2" size={16} />
                    <Link href="/votacao/2020">Eleições 2020</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineLineChart className="mr-2" size={16} />
                    <Link href="/votacao/2022">Eleições 2022</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineBarChart className="mr-2" size={16} />
                    <Link href="/votacao/2024">Eleições 2024</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <BsArrowLeftRight className="mr-2" size={16} />
                    <Link href="/votacao/comparativogeral(2018-2022)">Comparativo 2018 - 2022</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <BsArrowLeftRight className="mr-2" size={16} />
                    <Link href="/votacao/comparativogeral(2020-2024)">Comparativo 2020 - 2024</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <FaRegFileAlt className="mr-2" size={16} />
                    <Link href="/votacao/relatorioeleicao">Relatório de Votação</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <FaRegAddressBook className="mr-2" size={16} />
                    <Link href="/votacao/relatorioeleitorado">Relatório de Eleitorado</Link>
                  </li>
                  <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineFileSearch className="mr-2" size={16} />
                    <Link href="/votacao/relatorioanalise">Ánalise Eleitoral</Link>
                  </li>
                   <li className="flex items-center py-1 hover:text-blue-500">
                    <AiOutlineFund className="mr-2" size={16} />
                    <Link href="/votacao/projecao2025">Projeção 2025</Link>
                  </li>
                </ul>
              )}
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