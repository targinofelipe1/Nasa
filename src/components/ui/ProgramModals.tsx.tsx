// src/components/ui/ProgramModals.tsx
import { TableData } from '@/app/programas/bolsa-familia/page';
import BolsaFamiliaUpdateModalContent from './BolsaFamiliaUpdateModal.tsx';
import CadastroUnicoUpdateModalContent from './CadastroUnicoUpdateModalContent.jsx';

interface ProgramModalsProps {
  programName: string;
  rowData: TableData;
  columnKey: string;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string; // ✅ adicionar
  tabGroups: { [key: string]: string[] }; // ✅ adicionar
}

const ProgramModals = ({ programName, ...props }: ProgramModalsProps) => {
  switch (programName) {
    case 'bolsa-familia':
      return <BolsaFamiliaUpdateModalContent {...props} />;
    case 'cadastro-unico': 
      return <CadastroUnicoUpdateModalContent {...props} />;
    default:
      return null;
  }
};

export default ProgramModals;
