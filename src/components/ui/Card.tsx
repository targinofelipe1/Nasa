"use client";

import { useState, useEffect, ReactNode, FC } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { FaExternalLinkAlt } from "react-icons/fa";

interface CardProps {
  value: number;
  label: string;
  modalContent?: ReactNode;
  setIsModalOpen: (state: boolean) => void;
  selectOptions?: { id: string; label: string; value: number }[];
  icon?: ReactNode;
  iconColor?: string;
  bgColor?: string;
}

const Card: FC<CardProps> = ({
  value,
  label,
  modalContent,
  setIsModalOpen,
  selectOptions,
  icon,
  iconColor,
  bgColor,
}) => {
  const [isModalOpen, setLocalModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{ id: string; label: string; value: number } | undefined>(
    selectOptions && selectOptions.length > 0 ? selectOptions[0] : undefined
  );

  useEffect(() => {
    if (selectOptions && selectOptions.length > 0) {
      setSelectedOption(selectOptions[0]);
    } else {
      setSelectedOption(undefined);
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

  const handleSelectChange = (selectedLabel: string) => {
    const option = selectOptions?.find(opt => opt.label === selectedLabel);
    setSelectedOption(option);
  };

  const displayValue = selectOptions ? selectedOption?.value : value;
 const displayLabel = label;

  return (
    <div
      className={`p-4 shadow-md rounded-xl text-center transition-all hover:shadow-lg flex flex-col items-center justify-between ${bgColor || 'bg-white'}`}
    >
      <div className="flex flex-col items-center justify-center min-h-[140px]">
        {icon && (
          <div className={`text-3xl mb-2 ${iconColor}`}>
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900">{displayValue?.toLocaleString("pt-BR") || "N/A"}</h2>
        <p className="text-sm text-gray-500 mt-1">{displayLabel}</p>
      </div>

      <div className="w-full mt-auto">
        {selectOptions && (
          <div className="mt-2">
            <Select
              options={selectOptions}
              onChange={handleSelectChange}
              defaultValue={selectedOption?.label || ""}
            />
          </div>
        )}

        {modalContent && (
          <button
            onClick={openModal}
            className="mt-2 text-blue-600 hover:text-blue-700 no-underline cursor-pointer flex items-center justify-center mx-auto"
          >
            <FaExternalLinkAlt className="mr-1 text-sm" /> Detalhes
          </button>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={`Detalhes de ${label}`}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default Card;