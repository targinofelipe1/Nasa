import { useState } from "react";
import PrintModal from "./PrintModal";
import ModalPortal from "./ModalPortal";

interface BotaoImpressaoProps {
  apiData: any[];
  className?: string;
}

const BotaoImpressao = ({ apiData, className = "" }: BotaoImpressaoProps) => {
  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base px-3 md:px-4 py-2 rounded-full flex items-center justify-center gap-2 font-medium shadow-sm transition duration-200 ${className}`}
      >
        🖨️ Gerar Relatório
      </button>

      {mostrarModal && (
        <ModalPortal>
          <PrintModal
            isOpen={mostrarModal}
            onClose={() => setMostrarModal(false)}
            apiData={apiData}
          />
        </ModalPortal>
      )}
    </>
  );
};

export default BotaoImpressao;