// src/components/ui/BpcRmvUpdateModalContent.tsx

import UpdateProgramModal from "./UpdateProgramModal";

// ✅ Ajuste na interface para aceitar arrays readonly
interface BpcRmvUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };

}

const BpcRmvUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: BpcRmvUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="bpc-rmv"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default BpcRmvUpdateModalContent;