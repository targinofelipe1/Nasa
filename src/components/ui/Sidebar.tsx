import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { AiOutlineBarChart, AiOutlineFund, AiOutlineSetting, AiOutlineFileText, AiOutlineEnvironment, AiFillFile, AiFillFileText, AiOutlineFile, AiOutlineHome } from "react-icons/ai";
import { MdOutlineMap } from "react-icons/md";
import Link from "next/link";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-300 transition-all duration-300 shadow-lg ${
          isOpen ? "w-64" : "w-16"
        } flex flex-col z-50`}
      >
        {/* Ícone do Menu */}
        <div
          className="absolute top-4 right-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiMenu size={24} className="text-gray-600" />
        </div>

        {/* Itens do menu */}
        <nav className="mt-16 pl-4">
          <ul className="space-y-4">
            <li>
              <Link
                href="/map-rga"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <AiOutlineHome className="mr-3" size={20} />
                {isOpen && "Página Inicial"}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard-estadual"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <AiOutlineBarChart className="mr-3" size={20} />
                {isOpen && "Dashboard Estadual"}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard-municipal"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <AiOutlineFund className="mr-3" size={20} />
                {isOpen && "Dashboard Municipal"}
              </Link>
            </li>
            <li>
              <Link
                href="/maps"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <MdOutlineMap className="mr-3" size={20} />
                {isOpen && "Mapa"}
              </Link>
            </li>
            <li>
              <Link
                href="/relatorios-estadual"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <AiOutlineFileText className="mr-3" size={20} />
                {isOpen && "Relatórios Estaduais"}
              </Link>
            </li>
            <li>
              <Link
                href="/relatorio-municipal"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
                <AiOutlineFile className="mr-3" size={20} />
                {isOpen && "Relatórios Municipais"}
              </Link>
            </li>
            <li>
              <Link
                href="/config"
                className="flex items-center text-gray-700 hover:text-blue-600"
              >
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
