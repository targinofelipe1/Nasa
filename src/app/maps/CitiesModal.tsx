// src/components/ui/CitiesModal.tsx
import Modal from '@/components/ui/Modal';
import React, { FC } from 'react';

interface CitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string;
  municipalities: string[];
}

const CitiesModal: FC<CitiesModalProps> = ({ isOpen, onClose, programName, municipalities }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cidades com o programa: ${programName}`}
    >
      {/* ➡️ Conteúdo do modal em duas colunas */}
      <ul className="text-sm text-gray-500 grid grid-cols-2 gap-x-6 gap-y-2">
        {municipalities.length > 0 ? (
          municipalities.sort().map((city, index) => (
            <li key={index} className="truncate">{city}</li>
          ))
        ) : (
          <li className="col-span-2">Nenhuma cidade encontrada para este programa.</li>
        )}
      </ul>
    </Modal>
  );
};

export default CitiesModal;