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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 🔹 Modal estilizado sem alterar a cor de fundo */}
      <div
        className="relative bg-white p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-2 border-gray-200 max-w-md w-full z-50 scale-95 animate-fade-in"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
        <div className="mb-4 text-left">{children}</div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 block mx-auto transition-all"
        >
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
