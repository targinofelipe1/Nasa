import UpdateProgramModal from "./UpdateProgramModal";

interface ProtecaoBasicaUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const ProtecaoBasicaUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: ProtecaoBasicaUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="protecao-basica"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default ProtecaoBasicaUpdateModalContent;