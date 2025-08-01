'use client';

import { useState } from 'react';
import EleitoradoReportModal from '@/components/ui/EleitoradoReportModal';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';

export default function RelatorioPage() {
    const [isEleitoradoModalOpen, setIsEleitoradoModalOpen] = useState(false);

    return (
        <ProtectedRoute>
            <NoScroll />
            <div className="flex bg-white h-screen overflow-hidden">
                <div style={{ zoom: '80%' }} className="h-screen overflow-auto">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-auto" style={{ zoom: '80%' }}>
                    <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
                        <p className="text-sm text-gray-500 mb-1">
                            <span className="text-black font-medium">Painel</span> /
                            <span className="text-gray-400"> Geração de Relatórios</span>
                        </p>
                        <h1 className="text-2xl font-bold text-black">Geração de Relatórios</h1>
                        <div className="flex justify-between items-center mt-5 border-b border-gray-300 pb-2">
                        </div>
                    </div>

                    <div className="p-6 space-y-10 flex flex-col items-center h-[calc(100vh-160px)]"> 
                        {/* Conteúdo da página principal */}
                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 w-full" role="alert">
                            <p className="font-bold text-lg">Pronto para Gerar Relatório!</p>
                            <p className="text-lg">Clique no botão "Gerar Relatório" para começar.</p>
                        </div>
                        <button
                            onClick={() => setIsEleitoradoModalOpen(true)}
                            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Gerar Relatório
                        </button>
                    </div>
                </div>
                <EleitoradoReportModal
                    isOpen={isEleitoradoModalOpen}
                    onClose={() => setIsEleitoradoModalOpen(false)}
                />
            </div>
        </ProtectedRoute>
    );
}