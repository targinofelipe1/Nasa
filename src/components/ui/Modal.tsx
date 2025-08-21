import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay com fundo escuro e suave */}
      <div 
        className="fixed inset-0 bg-black/75 transition-opacity duration-300 backdrop-blur-sm"
      ></div>
      
      {/* Contêiner do Modal com design ajustado para ser mais compacto */}
      <div
        className="relative bg-white p-6 rounded-3xl shadow-xl max-w-md max-h-[90vh] w-full z-50 transition-all duration-300 ease-out transform scale-100 opacity-100 animate-pop-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center flex-grow">{title}</h2>
            {/* Botão de fechar (X) no canto superior */}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors text-2xl"
            >
              &times;
            </button>
        </div>
        
        {/* Área de conteúdo com rolagem */}
        <div className="flex-grow overflow-y-auto text-left text-gray-700 space-y-2">
            {children}
        </div>

        {/* Rodapé e botão de fechar */}
        <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
            >
              Fechar
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;