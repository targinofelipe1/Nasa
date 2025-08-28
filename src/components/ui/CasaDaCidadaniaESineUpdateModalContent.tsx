// src/components/ui/CasaDaCidadaniaESineUpdateModalContent.tsx

import UpdateProgramModal from "./UpdateProgramModal";

interface CasaDaCidadaniaESineUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const CasaDaCidadaniaESineUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: CasaDaCidadaniaESineUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="casa-da-cidadania-e-sine"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default CasaDaCidadaniaESineUpdateModalContent;