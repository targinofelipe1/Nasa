'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';

// Importações removidas de jspdf e jspdf-autotable
// import { jsPDF } from 'jspdf'; // Não mais necessário
// import 'jspdf-autotable'; // Não mais necessário

// Importações para pdfmake
// Importa pdfmake base e as fontes padrão.
// O import '@pdfmake/vfs-fonts/pdfmake'; é um import com efeito colateral que anexa as fontes
// ao pdfmake global.
// Para carregamento dinâmico, você faria isso dentro do useEffect.

// Importe as interfaces existentes
interface CandidatoDropdownOption {
    nome: string;
    siglaPartido: string;
    numeroCandidato?: string;
}

interface VotoAgregadoCandidatoRanking {
    nome: string;
    totalVotos: number;
    siglaPartido: string;
    porcentagem: number;
    cargo: string;
    municipio: string;
    numeroCandidato: string;
    posicaoRanking: number;
    zonaEleitoral?: string;
    secaoEleitoral?: string;
    localVotacao?: string;
    nomeLocal?: string;
    enderecoLocal?: string;
    bairroLocal?: string;
}

interface LocalVotacaoDetalhado {
    'Município': string;
    'Zona Eleitoral': string;
    'Seção Eleitoral': string;
    'Local de Votação': string;
    'Endereço do Local': string;
    'Bairro do Local': string;
    'Nome do Local': string;
}

interface PlanilhasPorAno {
    [ano: string]: {
        [cargo: string]: string[];
    };
}

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const safeParseVotes = (value: any): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = parseInt(value.replace(/\./g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const [reportStep, setReportStep] = useState(1);
    const [selectedReportCargo, setSelectedReportCargo] = useState('');
    const [selectedReportElectionYear, setSelectedReportElectionYear] = useState('');
    const [selectedReportScope, setSelectedReportScope] = useState('');
    const [selectedReportCity, setSelectedReportCity] = useState('JOÃO PESSOA');
    const [selectedReportLocationType, setSelectedReportLocationType] = useState('');
    const [selectedReportCandidate, setSelectedReportCandidate] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [loadingReportData, setLoadingReportData] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [reportError, setReportError] = useState('');

    const [rawDataForReport, setRawDataForReport] = useState<any[]>([]);
    const [locaisData, setLocaisData] = useState<LocalVotacaoDetalhado[]>([]);
    const locaisCarregadosRef = useRef(false);

    // Ref para a instância ou construtor do pdfmake
    const PdfMakeRef = useRef<any>(null); 

    // Carregamento dinâmico de pdfmake e suas fontes
    useEffect(() => {
        if (isOpen && !PdfMakeRef.current) {
            const loadPdfLibs = async () => {
                try {
                    console.log('Iniciando carregamento de bibliotecas PDF (pdfmake)...');
                    
                    // Importe pdfmake
                    const pdfmakeModule = await import('pdfmake/build/pdfmake');
                    const vfsFontsModule = await import('pdfmake/build/vfs_fonts'); 

                    // Configura as fontes para pdfmake
                    pdfmakeModule.default.vfs = vfsFontsModule.default.vfs;                    
                    PdfMakeRef.current = pdfmakeModule.default; // Armazena o objeto pdfmake
                    console.log('Bibliotecas PDF (pdfmake) carregadas com sucesso.');
                    setReportError(prev => prev.includes('Bibliotecas de PDF não carregadas') ? '' : prev);
                } catch (error) {
                    console.error("Falha ao carregar bibliotecas de PDF (pdfmake):", error);
                    setReportError("Erro ao carregar bibliotecas de PDF. Por favor, recarregue a página.");
                    PdfMakeRef.current = null; // Resetar ref em caso de falha
                }
            };
            loadPdfLibs();
        }
    }, [isOpen]);


    useEffect(() => {
        const fetchLocais = async () => {
            if (!isOpen || locaisCarregadosRef.current) return;

            setLoadingReportData(true);
            setLoadingProgress(10);
            setReportError('');
            try {
                const res = await fetch(`/api/sheets/eleicao/locais`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
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
                setLocaisData(parsedLocais);
                locaisCarregadosRef.current = true;
                setLoadingProgress(100);
            } catch (error: any) {
                console.error('Erro ao carregar dados da planilha de locais para o modal:', error);
                setReportError('Erro ao carregar dados de locais de votação: ' + error.message);
                setLoadingProgress(0);
            } finally {
                setLoadingReportData(false);
            }
        };
        fetchLocais();
    }, [isOpen]);


    const planilhasPorCargoEAno: PlanilhasPorAno = useMemo(() => ({
        '2018': {
            Presidente: ['presidente_2018'],
            'Presidente 2º turno': ['presidente_2018_2'],
            Senador: ['senador_2018'],
            Governador: ['governador_2018'],
            'Deputado Federal': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'],
            'Deputado Estadual': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'],
        },
        '2020': {
            Prefeito: ['prefeito_2020'],
            Vereador: ['vereador_2020'],
        },
        '2022': {
            Presidente: ['presidente'],
            'Presidente 2º turno': ['presidente_2'],
            Senador: ['senador'],
            Governador: ['governador'],
            'Governador 2º turno': ['governador_2'],
            'Deputado Federal': ['grupo_federal1', 'grupo_federal2', 'grupo_federal3', 'deputado_federaljp'],
            'Deputado Estadual': ['grupo_estadual1', 'grupo_estadual2', 'grupo_estadual3', 'deputado_estadualjp'],
        },
        '2024': {
            Prefeito: ['prefeito_2024'],
            Vereador: ['vereador_2024'],
        }
    }), []);


    const cargoMap: Record<string, string> = useMemo(() => ({
        'presidente_2018': 'Presidente', 'presidente_2018_2': 'Presidente 2º turno',
        'senador_2018': 'Senador', 'governador_2018': 'Governador',
        'grupo_federal1_2018': 'Deputado Federal', 'grupo_federal2_2018': 'Deputado Federal', 'grupo_federal3_2018': 'Deputado Federal', 'deputado_federaljp_2018': 'Deputado Federal',
        'grupo_estadual1_2018': 'Deputado Estadual', 'grupo_estadual2_2018': 'Deputado Estadual', 'grupo_estadual3_2018': 'Deputado Estadual', 'deputado_estadualjp_2018': 'Deputado Estadual',
        'prefeito_2020': 'Prefeito', 'vereador_2020': 'Vereador',
        'prefeito_2024': 'Prefeito', 'vereador_2024': 'Vereador',
        'presidente': 'Presidente',
        'presidente_2': 'Presidente 2º turno',
        'senador': 'Senador',
        'governador': 'Governador',
        'governador_2': 'Governador 2º turno',
        'grupo_federal1': 'Deputado Federal',
        'grupo_federal2': 'Deputado Federal',
        'grupo_federal3': 'Deputado Federal',
        'deputado_federaljp': 'Deputado Federal',
        'grupo_estadual1': 'Deputado Estadual',
        'grupo_estadual2': 'Deputado Estadual',
        'grupo_estadual3': 'Deputado Estadual',
        'deputado_estadualjp': 'Deputado Estadual',
    }), []);

    const getUniqueOptions = useCallback((data: any[], key: string, sort = true) => {
        const options = new Set<string>();
        data.forEach((item: any) => {
            const value = item[key]?.trim();
            if (value && value !== 'N/A') {
                options.add(value);
            }
        });
        const sortedOptions = Array.from(options);
        if (sort) {
            sortedOptions.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        } else {
            sortedOptions.sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
            });
        }
        return sortedOptions;
    }, []);

    const fetchReportDataForCargoAndYear = useCallback(async (
        cargo: string,
        year: string,
        locais: LocalVotacaoDetalhado[],
        controller: AbortController
    ) => {
        setLoadingReportData(true);
        setLoadingProgress(10);
        setReportError('');

        try {
            const yearData = planilhasPorCargoEAno[year];
            const ids: string[] | undefined = yearData ? yearData[cargo] : undefined;
            
            if (!ids || ids.length === 0) {
                setReportError('Nenhuma planilha encontrada para o cargo/ano selecionado.');
                setRawDataForReport([]);
                setLoadingProgress(0);
                setLoadingReportData(false);
                return;
            }

            const allData: any[] = [];
            const totalSheets = ids.length;
            let loadedSheets = 0;

            for (const id of ids) {
                if (controller.signal.aborted) {
                    console.warn('Requisição de dados para relatório abortada no meio do loop.');
                    setLoadingProgress(0);
                    setLoadingReportData(false);
                    return;
                }
                setLoadingProgress(10 + Math.floor((loadedSheets / totalSheets) * 90));

                const res = await fetch(`/api/sheets/eleicao/${id}`, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`Falha ao carregar dados da planilha ${id}. Status: ${res.status}`);
                }
                const json = await res.json();
                const linhas: string[][] = json.data?.slice(1) || [];

                const cargoDoRegistro = cargoMap[id] || cargo;

                for (const linha of linhas) {
                    const municipio = linha[0]?.trim();
                    const zona = linha[1]?.trim();
                    const secao = linha[2]?.trim();
                    const local = linha[3]?.trim();

                    const infoLocal = locais.find(l => 
                        l['Município'] === municipio &&
                        l['Zona Eleitoral'] === zona &&
                        l['Seção Eleitoral'] === secao &&
                        l['Local de Votação'] === local
                    );

                    allData.push({
                        'Município': municipio || '',
                        'Zona Eleitoral': zona || '',
                        'Seção Eleitoral': secao || '',
                        'Local de Votação': local || '',
                        'Endereço do Local': infoLocal?.['Endereço do Local'] || 'N/A',
                        'Bairro do Local': infoLocal?.['Bairro do Local'] || 'N/A',
                        'Nome do Local': infoLocal?.['Nome do Local'] || 'N/A',
                        'Numero do Candidato': linha[11]?.trim() || '',
                        'Nome do Candidato/Voto': (linha[12] || '').trim().toUpperCase(),
                        'Quantidade de Votos': safeParseVotes(linha[13]),
                        'Sigla do Partido': (linha[6] || '').trim(),
                        Cargo: cargoDoRegistro,
                        Ano: year,
                    });
                }
                loadedSheets++;
            }
            setRawDataForReport(allData);
            setLoadingProgress(100);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.warn('Requisição de dados para relatório abortada.');
            } else {
                console.error('Erro ao carregar dados para o relatório:', err);
                setReportError('Erro ao carregar dados: ' + err.message);
            }
            setRawDataForReport([]);
            setLoadingProgress(0);
        } finally {
            setLoadingReportData(false);
        }
    }, [planilhasPorCargoEAno, cargoMap]);

    useEffect(() => {
        const controller = new AbortController();
        if (selectedReportCargo && selectedReportElectionYear && locaisData.length > 0) {
            const handler = setTimeout(() => {
                fetchReportDataForCargoAndYear(selectedReportCargo, selectedReportElectionYear, locaisData, controller);
            }, 300);

            return () => {
                clearTimeout(handler);
                controller.abort();
            };
        } else {
            setRawDataForReport([]);
            setLoadingReportData(false);
            setLoadingProgress(0);
            setReportError('');
        }
    }, [selectedReportCargo, selectedReportElectionYear, locaisData, fetchReportDataForCargoAndYear]);


    const availableReportCargos = useMemo(() => {
        if (!selectedReportElectionYear) {
            const allCargos: Set<string> = new Set();
            for (const year in planilhasPorCargoEAno) {
                const yearData = planilhasPorCargoEAno[year];
                for (const cargo in yearData) {
                    if (cargo !== 'Visão Geral' && cargo !== 'Visão Geral 2º turno' && cargo !== 'undefined') {
                        allCargos.add(cargo);
                    }
                }
            }
            return Array.from(allCargos).sort();
        } else {
            const cargosForSelectedYear = planilhasPorCargoEAno[selectedReportElectionYear];
            if (cargosForSelectedYear) {
                const filteredCargos = Object.keys(cargosForSelectedYear).filter(cargo =>
                    cargo !== 'Visão Geral' && cargo !== 'Visão Geral 2º turno' && cargo !== 'undefined'
                ).sort();
                return filteredCargos;
            }
            return [];
        }
    }, [selectedReportElectionYear, planilhasPorCargoEAno]);


    const availableReportCities = useMemo(() => {
        if (rawDataForReport.length === 0) return [];
        const uniqueCities = new Set<string>();
        rawDataForReport.forEach(item => {
            if (item['Município']) uniqueCities.add(item['Município']);
        });
        return Array.from(uniqueCities).sort((a, b) => {
            if (a === 'JOÃO PESSOA') return -1;
            if (b === 'JOÃO PESSOA') return 1;
            return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
        });
    }, [rawDataForReport]);

    const availableReportCandidates = useMemo(() => {
        if (rawDataForReport.length === 0) return [];
        const uniqueCandidates = new Map<string, CandidatoDropdownOption>();

        const filteredByScopeAndCity = rawDataForReport.filter(item => {
            if (selectedReportScope === 'Cidade' && item['Município'] !== selectedReportCity) return false;
            return true;
        });

        filteredByScopeAndCity.forEach(item => {
            const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
            const siglaPartido = item['Sigla do Partido']?.trim();
            const numeroCandidato = item['Numero do Candidato']?.trim();

            if (nomeCandidato && siglaPartido &&
                nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
                siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
                const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
                if (!uniqueCandidates.has(key)) {
                    uniqueCandidates.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
                }
            }
        });
        return Array.from(uniqueCandidates.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [rawDataForReport, selectedReportScope, selectedReportCity]);


    const canSelectCargo = selectedReportElectionYear !== '';
    const canAdvanceToStep2 = canSelectCargo && selectedReportCargo !== '' && !loadingReportData && rawDataForReport.length > 0;


    const canAdvanceToStep3 = selectedReportScope !== '' &&
                               (selectedReportScope === 'Estado' || selectedReportCity !== '') &&
                               !loadingReportData && rawDataForReport.length > 0;

    // Condição para gerar agora depende de PdfMakeRef.current estar disponível
    const canGenerate = selectedReportLocationType !== '' && selectedReportCandidate !== '' && !loadingReportData && PdfMakeRef.current;

    const reportSteps = ['Ano/Cargo', 'Abrangência', 'Detalhes'];

    const resetModalState = useCallback(() => {
        setReportStep(1);
        setSelectedReportCargo('');
        setSelectedReportElectionYear('');
        setSelectedReportScope('');
        setSelectedReportCity('JOÃO PESSOA');
        setSelectedReportLocationType('');
        setSelectedReportCandidate('');
        setIsGeneratingPdf(false);
        setLoadingReportData(false);
        setLoadingProgress(0);
        setReportError('');
        setRawDataForReport([]);
    }, []);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleAdvanceToStep2 = useCallback(() => {
        setReportStep(2);
        setSelectedReportScope('');
        setSelectedReportCity('JOÃO PESSOA');
        setSelectedReportLocationType('');
        setSelectedReportCandidate('');
        setReportError('');
    }, []);

    const handleAdvanceToStep3 = useCallback(() => {
        setReportStep(3);
        setSelectedReportLocationType('');
        setSelectedReportCandidate('');
        setReportError('');
    }, []);

    const handleBackToStep1 = useCallback(() => {
        setReportStep(1);
        setSelectedReportScope('');
        setSelectedReportCity('JOÃO PESSOA');
        setSelectedReportLocationType('');
        setSelectedReportCandidate('');
        setReportError('');
        setRawDataForReport([]);
    }, []);

    const handleBackToStep2 = useCallback(() => {
        setReportStep(2);
        setSelectedReportLocationType('');
        setSelectedReportCandidate('');
        setReportError('');
    }, []);


    const generatePdfReport = async () => {
        setIsGeneratingPdf(true);
        setReportError('');

        try {
            // Verifica se PdfMakeRef.current está disponível
            if (!PdfMakeRef.current) {
                throw new Error('Bibliotecas de PDF não carregadas. Por favor, feche e reabra o modal, ou recarregue a página.');
            }
            if (!rawDataForReport.length) {
                throw new Error('Dados para o relatório não carregados. Por favor, selecione as opções novamente.');
            }

            let filteredData = rawDataForReport.filter(item => {
                const matchesCargo = item.Cargo === selectedReportCargo;
                const matchesYear = item.Ano === selectedReportElectionYear;
                
                let matchesScopeAndCity = true;
                if (selectedReportScope === 'Cidade') {
                    matchesScopeAndCity = item['Município'] === selectedReportCity;
                }

                return matchesCargo && matchesYear && matchesScopeAndCity;
            });

            if (filteredData.length === 0) {
                throw new Error('Nenhum dado encontrado para os critérios selecionados. Por favor, ajuste suas seleções.');
            }


            const aggregatedDataMap = new Map<string, VotoAgregadoCandidatoRanking>();
            const totalsByLocation: { [key: string]: { totalValid: number; totalBrancos: number; totalNulos: number; totalLegenda: number; } } = {};

            filteredData.forEach(item => {
                const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
                const siglaPartido = item['Sigla do Partido']?.trim();
                const votos = item['Quantidade de Votos'] || 0;

                const isLegenda = nomeCandidato === siglaPartido?.toUpperCase();
                const isBranco = nomeCandidato === 'BRANCO';
                const isNulo = nomeCandidato === 'NULO' || siglaPartido?.toLowerCase() === '#nulo#';

                const locationKey = selectedReportLocationType === 'Secao'
                    ? `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}`
                    : `${item['Município']}-${item['Local de Votação']}`;

                if (!totalsByLocation[locationKey]) {
                    totalsByLocation[locationKey] = { totalValid: 0, totalBrancos: 0, totalNulos: 0, totalLegenda: 0 };
                }

                if (isBranco) {
                    totalsByLocation[locationKey].totalBrancos += votos;
                } else if (isNulo) {
                    totalsByLocation[locationKey].totalNulos += votos;
                } else if (isLegenda) {
                    totalsByLocation[locationKey].totalLegenda += votos;
                } else {
                    totalsByLocation[locationKey].totalValid += votos;
                }

                if (nomeCandidato === selectedReportCandidate.toUpperCase()) {
                    const existingEntry = aggregatedDataMap.get(locationKey);

                    if (existingEntry) {
                        existingEntry.totalVotos += votos;
                    } else {
                        aggregatedDataMap.set(locationKey, {
                            nome: selectedReportCandidate,
                            totalVotos: votos,
                            siglaPartido: siglaPartido || '',
                            porcentagem: 0,
                            cargo: selectedReportCargo,
                            municipio: item['Município'] || '',
                            numeroCandidato: item['Numero do Candidato'] || '',
                            posicaoRanking: 0,
                            zonaEleitoral: item['Zona Eleitoral'] || '',
                            secaoEleitoral: item['Seção Eleitoral'] || '',
                            localVotacao: item['Local de Votação'] || '',
                            nomeLocal: item['Nome do Local'] || '',
                            enderecoLocal: item['Endereço do Local'] || '',
                            bairroLocal: item['Bairro do Local'] || '',
                        });
                    }
                }
            });

            const aggregatedData: VotoAgregadoCandidatoRanking[] = Array.from(aggregatedDataMap.values());

            if (aggregatedData.length === 0) {
                throw new Error('O candidato selecionado não possui votos nos locais filtrados ou os dados são insuficientes.');
            }

            aggregatedData.forEach(data => {
                const locationKey = selectedReportLocationType === 'Secao'
                    ? `${data.municipio}-${data.zonaEleitoral}-${data.secaoEleitoral}`
                    : `${data.municipio}-${data.localVotacao}`;
                const totalValidForLocation = totalsByLocation[locationKey]?.totalValid || 0;
                data.porcentagem = totalValidForLocation > 0 ? (data.totalVotos / totalValidForLocation) * 100 : 0;
            });

            const rankedData = [...aggregatedData].sort((a, b) => b.totalVotos - a.totalVotos);
            let currentOverallRank = 1;
            for (let i = 0; i < rankedData.length; i++) {
                if (i > 0 && rankedData[i].totalVotos < rankedData[i-1].totalVotos) {
                    currentOverallRank = i + 1;
                }
                rankedData[i].posicaoRanking = currentOverallRank;
            }

            // Define as colunas da tabela para pdfmake
            const tableColumnPdfMake = [
                { text: 'Município', style: 'tableHeader' },
                { text: selectedReportLocationType === 'Secao' ? 'Zona Eleitoral' : 'Local Votação (Código)', style: 'tableHeader' },
                { text: selectedReportLocationType === 'Secao' ? 'Seção Eleitoral' : 'Nome do Local', style: 'tableHeader' },
                { text: selectedReportLocationType === 'Secao' ? 'Nome do Local' : 'Endereço', style: 'tableHeader' },
                { text: selectedReportLocationType === 'Secao' ? 'Endereço' : 'Bairro', style: 'tableHeader' },
                { text: 'Votos', style: 'tableHeader' },
                { text: '% Válidos no Local', style: 'tableHeader' },
                { text: 'Ranking', style: 'tableHeader' },
            ];

            // Define as linhas da tabela para pdfmake
            const tableRowsPdfMake = rankedData.map(data => {
                const row = [];
                row.push(data.municipio);
                if (selectedReportLocationType === 'Secao') {
                    row.push(data.zonaEleitoral);
                    row.push(data.secaoEleitoral);
                    row.push(data.nomeLocal);
                    row.push(data.enderecoLocal);
                } else {
                    row.push(data.localVotacao);
                    row.push(data.nomeLocal);
                    row.push(data.enderecoLocal);
                    row.push(data.bairroLocal);
                }
                row.push(data.totalVotos.toLocaleString('pt-BR'));
                row.push(`${data.porcentagem.toFixed(2)}%`);
                row.push(`${data.posicaoRanking}º`);
                return row.map(cell => ({ text: cell ?? '', style: 'tableCell' }));
            });

            // Definição do documento PDF para pdfmake
            const docDefinition = {
                pageOrientation: 'landscape',
                content: [
                    { text: `Relatório de Votação - Eleições ${selectedReportElectionYear}`, style: 'header' },
                    { text: `Cargo: ${selectedReportCargo}`, style: 'subheader' },
                    { text: `Candidato: ${selectedReportCandidate} (${availableReportCandidates.find(c => c.nome === selectedReportCandidate)?.siglaPartido || 'N/A'})`, style: 'subheader' },
                    { text: `Abrangência: ${selectedReportScope === 'Estado' ? 'Estado da Paraíba' : `Cidade de ${selectedReportCity}`}`, style: 'subheader' },
                    { text: `Agregação: Por ${selectedReportLocationType === 'Secao' ? 'Seção Eleitoral' : 'Local de Votação'}`, style: 'subheader' },
                    { text: `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, style: 'dateInfo' },
                    {
                        style: 'tableExample',
                        table: {
                            headerRows: 1,
                            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], // Ajuste conforme necessário
                            body: [
                                tableColumnPdfMake,
                                ...tableRowsPdfMake
                            ]
                        },
                        layout: 'lightHorizontalLines' // Um layout de tabela simples
                    }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        margin: [0, 0, 0, 10] // top, right, bottom, left
                    },
                    subheader: {
                        fontSize: 12,
                        margin: [0, 2, 0, 2]
                    },
                    dateInfo: {
                        fontSize: 10,
                        margin: [0, 5, 0, 15]
                    },
                    tableExample: {
                        margin: [0, 5, 0, 15]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 9,
                        color: 'white',
                        fillColor: '#1464C8', // Azul (equivalente a [20, 100, 200] do jspdf)
                        alignment: 'center'
                    },
                    tableCell: {
                        fontSize: 8,
                        margin: [0, 1, 0, 1]
                    }
                },
                defaultStyle: {
                    // Sem estilo padrão aqui, os estilos são aplicados por nome
                }
            };

            // Cria o PDF e baixa
            PdfMakeRef.current.createPdf(docDefinition).download(
                `relatorio_${selectedReportCandidate.replace(/ /g, '_')}_${selectedReportCargo.replace(/ /g, '_')}_${selectedReportElectionYear}.pdf`
            );

            alert('Relatório PDF gerado com sucesso!');
            handleClose();
        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error);
            setReportError(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido.'}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)'
            }}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 relative"
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                }}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    aria-label="Fechar"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Gerar Relatório de Votação</h2>

                {loadingReportData && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 relative overflow-hidden">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                        <p className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-semibold text-gray-800">
                            Carregando dados... {loadingProgress}%
                        </p>
                    </div>
                )}

                <div className="flex justify-center items-center space-x-2 mb-6">
                    {reportSteps.map((label, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300
                                    ${reportStep === index + 1 ? 'bg-blue-600 scale-110' : 'bg-gray-300'}
                                    ${reportStep > index + 1 ? 'bg-blue-500' : ''}`}
                                title={label}
                            >
                                {index + 1}
                            </div>
                            {index < reportSteps.length - 1 && (
                                <div className={`h-1 flex-1 transition-all duration-300 ${reportStep > index + 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-600 mb-6">Etapa: {reportSteps[reportStep - 1]}</p>

                {reportError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Erro:</strong>
                        <span className="block sm:inline"> {reportError}</span>
                    </div>
                )}

                {reportStep === 1 && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="report-year" className="block text-sm font-medium text-gray-700 mb-1">
                                Selecione o Ano da Eleição:
                            </label>
                            <div className="relative">
                                <select
                                    id="report-year"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportElectionYear}
                                    onChange={(e) => {
                                        setSelectedReportElectionYear(e.target.value);
                                        setSelectedReportCargo('');
                                    }}
                                    disabled={loadingReportData}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="2018">2018</option>
                                    <option value="2020">2020</option>
                                    <option value="2022">2022</option>
                                    <option value="2024">2024</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="report-cargo" className="block text-sm font-medium text-gray-700 mb-1">
                                Selecione o Cargo:
                            </label>
                            <div className="relative">
                                <select
                                    id="report-cargo"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportCargo}
                                    onChange={(e) => setSelectedReportCargo(e.target.value)}
                                    disabled={loadingReportData || !selectedReportElectionYear}
                                >
                                    <option value="">Selecione...</option>
                                    {selectedReportElectionYear ? (
                                        availableReportCargos.map(cargo => (
                                            <option key={cargo} value={cargo}>{cargo}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Selecione o Ano Primeiro</option>
                                    )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdvanceToStep2}
                                disabled={!canAdvanceToStep2}
                                className={`px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
                                    canAdvanceToStep2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Avançar
                            </button>
                        </div>
                    </div>
                )}

                {reportStep === 2 && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="report-scope" className="block text-sm font-medium text-gray-700 mb-1">
                                Abrangência do Relatório:
                            </label>
                            <div className="relative">
                                <select
                                    id="report-scope"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportScope}
                                    onChange={(e) => {
                                        setSelectedReportScope(e.target.value);
                                        if (e.target.value === 'Estado') {
                                            setSelectedReportCity('');
                                        } else if (e.target.value === 'Cidade' && !selectedReportCity) {
                                            setSelectedReportCity('JOÃO PESSOA');
                                        }
                                    }}
                                    disabled={loadingReportData}
                                >
                                    <option value="">Selecione...</option>
                                    <option
                                        value="Estado"
                                        disabled={
                                            (selectedReportElectionYear === '2020' || selectedReportElectionYear === '2024') ||
                                            (selectedReportCargo.includes('Prefeito') || selectedReportCargo.includes('Vereador'))
                                        }
                                    >
                                        Estado
                                    </option>
                                    <option value="Cidade">Cidade</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                </div>
                            </div>
                        </div>

                        {selectedReportScope === 'Cidade' && (
                            <div className="mb-6">
                                <label htmlFor="report-city" className="block text-sm font-medium text-gray-700 mb-1">
                                    Selecione o Município:
                                </label>
                                <div className="relative">
                                    <select
                                        id="report-city"
                                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                        value={selectedReportCity}
                                        onChange={(e) => setSelectedReportCity(e.target.value)}
                                        disabled={loadingReportData || availableReportCities.length === 0}
                                    >
                                        <option value="">Selecione...</option>
                                        {availableReportCities
                                            .map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={handleBackToStep1}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleAdvanceToStep3}
                                disabled={!canAdvanceToStep3}
                                className={`px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
                                    canAdvanceToStep3 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Avançar
                            </button>
                        </div>
                    </div>
                )}

                {reportStep === 3 && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="report-location-type" className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Agregação de Local:
                            </label>
                            <div className="relative">
                                <select
                                    id="report-location-type"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportLocationType}
                                    onChange={(e) => setSelectedReportLocationType(e.target.value)}
                                    disabled={loadingReportData}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Secao">Por Seção Eleitoral</option>
                                    <option value="Local">Por Local de Votação</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="report-candidate" className="block text-sm font-medium text-gray-700 mb-1">
                                Selecione o Candidato:
                            </label>
                            <div className="relative">
                                <select
                                    id="report-candidate"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportCandidate}
                                    onChange={(e) => setSelectedReportCandidate(e.target.value)}
                                    disabled={loadingReportData || availableReportCandidates.length === 0}
                                >
                                    <option value="">Selecione...</option>
                                    {availableReportCandidates.map(cand => (
                                        <option key={`${cand.nome}-${cand.siglaPartido}-${cand.numeroCandidato}`} value={cand.nome}>
                                            {cand.nome} ({cand.siglaPartido})
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={handleBackToStep2}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={generatePdfReport}
                                disabled={isGeneratingPdf || !canGenerate}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                    canGenerate && !isGeneratingPdf ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                {isGeneratingPdf ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Gerando PDF...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.29a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06l-1.94 1.94V6.75z" clipRule="evenodd" />
                                        </svg>
                                        Baixar Relatório
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportModal;