'use client';

import { useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import AnalysisModal from '@/components/ui/AnalysisModal';

interface LocalVotacaoDetalhado {
    'Município': string;
    'Zona Eleitoral': string;
    'Seção Eleitoral': string;
    'Local de Votação': string;
    'Endereço do Local': string;
    'Bairro do Local': string;
    'Nome do Local': string;
}

const Spinner = () => (
    <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
);

export default function AnalisePage() {
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [carregandoLocais, setCarregandoLocais] = useState(true);
    const [dadosLocais, setDadosLocais] = useState<LocalVotacaoDetalhado[]>([]);
    const [erroCarregamentoLocais, setErroCarregamentoLocais] = useState<string | null>(null);
    const locaisCarregadosRef = useRef(false);

    const fetchLocais = async () => {
        if (locaisCarregadosRef.current && dadosLocais.length > 0) return;

        setCarregandoLocais(true);
        setErroCarregamentoLocais(null);
        try {
            const res = await fetch(`/api/sheets/eleicao/locais`);
            if (!res.ok) {
                throw new Error(`Erro HTTP! Status: ${res.status}`);
            }
            const json = await res.json();
            const linhas: string[][] = json.data?.slice(1) || [];

            const parsedLocais: LocalVotacaoDetalhado[] = linhas.map(linha => ({
                'Município': linha[0]?.trim() || '',
                'Zona Eleitoral': linha[1]?.trim() || '',
                'Seção Eleitoral': linha[2]?.trim() || '',
                'Local de Votação': linha[3]?.trim() || '',
                'Endereço do Local': linha[5]?.trim() || 'N/A',
                'Bairro do Local': linha[6]?.trim() || 'N/A',
                'Nome do Local': linha[4]?.trim() || 'N/A',
            }));
            setDadosLocais(parsedLocais);
            locaisCarregadosRef.current = true;
        } catch (error: any) {
            console.error('Erro ao carregar dados da planilha de locais para a página de análise:', error);
            setErroCarregamentoLocais(`Falha ao carregar dados de locais: ${error.message}. Por favor, tente novamente.`);
            locaisCarregadosRef.current = false;
        } finally {
            setCarregandoLocais(false);
        }
    };

    useEffect(() => {
        fetchLocais();
    }, []);

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
                            <span className="text-gray-400"> Análise de Candidatos</span>
                        </p>
                        <h1 className="text-2xl font-bold text-black">Análise de Candidatos</h1>
                        <div className="flex justify-between items-center mt-5 border-b border-gray-300 pb-2">
                        </div>
                    </div>

                    <div className="p-6 space-y-10 flex flex-col items-center h-[calc(100vh-160px)]">
                        {carregandoLocais ? (
                            <div className="flex flex-col justify-center items-center h-full">
                                <Spinner />
                                <p className="text-gray-600 mt-4">Preparando gerador de análises...</p>
                            </div>
                        ) : erroCarregamentoLocais ? (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-md text-center">
                                <strong className="font-bold">Erro:</strong>
                                <span className="block sm:inline"> {erroCarregamentoLocais}</span>
                                <button
                                    onClick={fetchLocais}
                                    className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 w-full" role="alert">
                                    <p className="font-bold text-lg">Pronto para a Análise!</p>
                                    <p className="text-lg">Clique no botão "Analisar Candidato" para começar.</p>
                                </div>
                                <button
                                    onClick={() => setIsAnalysisModalOpen(true)}
                                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Analisar Candidato
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <AnalysisModal
                    isOpen={isAnalysisModalOpen}
                    onClose={() => setIsAnalysisModalOpen(false)}
                />
            </div>
        </ProtectedRoute>
    );
}