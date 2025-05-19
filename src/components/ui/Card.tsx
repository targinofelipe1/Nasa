import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { ReactNode } from "react";

interface CardProps {
  value: number;
  label: string;
  modalContent?: ReactNode;
  setIsModalOpen: (state: boolean) => void;
  selectOptions?: { id: string; label: string; value: number }[];
}

const Card: React.FC<CardProps> = ({
  value,
  label,
  modalContent,
  setIsModalOpen,
  selectOptions,
}) => {
  const [isModalOpen, setLocalModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");

  useEffect(() => {
    // Definir o primeiro item da lista como o padrão se houver opções
    if (selectOptions && selectOptions.length > 0) {
      setSelectedOption(selectOptions[0].label);
    }
  }, [selectOptions]);

  const openModal = () => {
    setLocalModalOpen(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setLocalModalOpen(false);
    setIsModalOpen(false);
  };

  // Encontrar o valor correto baseado na seleção
  const selectedValue =
    selectOptions?.find((p) => p.label === selectedOption)?.value || value;

  return (
    <div className="p-4 bg-white shadow-md rounded-xl text-center transition-all hover:shadow-lg hover:scale-102">
      <h2 className="text-xl font-bold text-gray-900">{selectedValue.toLocaleString("pt-BR")}</h2>
      <p className="text-sm text-gray-500 mt-1">{label}</p>

      {/* Se houver opções de select, exibir o select */}
      {selectOptions && (
        <Select
          options={selectOptions}
          onChange={(selectedLabel) => setSelectedOption(selectedLabel)}
          defaultValue={selectedOption} // Define o valor inicial do select
        />
      )}

      {/* Se houver modalContent, exibir o botão "Detalhes" */}
      {modalContent && (
        <button
          onClick={openModal}
          className="mt-2 text-blue-600 hover:text-blue-700 no-underline cursor-pointer"
        >
          Detalhes
        </button>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={`Detalhes de ${label}`}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default Card;
