import UpdateProgramModal from "./UpdateProgramModal";

interface CadastroUnicoUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string; // ✅ Adicionado
  tabGroups: { [key: string]: string[] }; // ✅ Adicionado
}

const CadastroUnicoUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab, // ✅ Recebe a aba ativa
  tabGroups // ✅ Recebe os grupos de abas
}: CadastroUnicoUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="cadastro-unico"
      activeTab={activeTab} // ✅ Repassa para o modal
      tabGroups={tabGroups} // ✅ Repassa para o modal
    />
  );
};

export default CadastroUnicoUpdateModalContent;