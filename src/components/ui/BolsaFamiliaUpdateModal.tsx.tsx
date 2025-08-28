import UpdateProgramModal from "./UpdateProgramModal";

interface BolsaFamiliaUpdateModalContentProps {
  rowData: any;
  columnKey: string;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string; // ✅ Adicionado
  tabGroups: { [key: string]: string[] }; // ✅ Adicionado
}

const BolsaFamiliaUpdateModalContent = ({ 
  rowData, 
  columnKey, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab, // ✅ Recebe a aba ativa
  tabGroups // ✅ Recebe os grupos de abas
}: BolsaFamiliaUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="bolsa-familia"
      activeTab={activeTab} // ✅ Repassa para o modal
      tabGroups={tabGroups} // ✅ Repassa para o modal
    />
  );
};

export default BolsaFamiliaUpdateModalContent;