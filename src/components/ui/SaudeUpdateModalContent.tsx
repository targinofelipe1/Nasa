// src/components/ui/SaudeUpdateModalContent.tsx

import UpdateProgramModal from "./UpdateProgramModal";

interface SaudeUpdateModalContentProps {
  rowData: any;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

const SaudeUpdateModalContent = ({ 
  rowData, 
  rowIndex, 
  onUpdate, 
  onClose,
  activeTab,
  tabGroups
}: SaudeUpdateModalContentProps) => {
  return (
    <UpdateProgramModal
      rowData={rowData}
      rowIndex={rowIndex}
      onUpdate={onUpdate}
      onClose={onClose}
      programName="saude"
      activeTab={activeTab}
      tabGroups={tabGroups}
    />
  );
};

export default SaudeUpdateModalContent;