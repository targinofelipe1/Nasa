// src/components/ui/DynamicAnalysisModal.tsx
import dynamic from 'next/dynamic';

// Exporte o componente de forma dinâmica, desabilitando o SSR
const DynamicAnalysisModal = dynamic(() => import('./AnalysisModal'), {
  ssr: false,
  loading: () => <p>Carregando modal...</p>,
});

export default DynamicAnalysisModal;