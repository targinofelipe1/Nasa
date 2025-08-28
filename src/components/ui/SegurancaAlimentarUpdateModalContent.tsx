// src/components/ui/SegurancaAlimentarUpdateModalContent.tsx

import UpdateProgramModal from "./UpdateProgramModal";

interface SegurancaAlimentarUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const SegurancaAlimentarUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: SegurancaAlimentarUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="seguranca-alimentar"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default SegurancaAlimentarUpdateModalContent;