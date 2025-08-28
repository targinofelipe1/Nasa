// src/components/ui/ProtecaoEspecialUpdateModalContent.tsx

import UpdateProgramModal from "./UpdateProgramModal";

interface ProtecaoEspecialUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const ProtecaoEspecialUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: ProtecaoEspecialUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="protecao-especial"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default ProtecaoEspecialUpdateModalContent;