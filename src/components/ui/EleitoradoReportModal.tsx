'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Definições de interface reutilizadas
interface EleitoradoAgregado {
    'Município': string;
    'Zona Eleitoral': string;
    'Seção Eleitoral': string;
    'Local de Votação': string;
    'Gênero': string;
    'Estado Civil': string;
    'Faixa Etária': string;
    'Escolaridade': string;
    'Raça/Cor': string;
    'Identidade de Gênero': string;
    'Quilombola': string;
    'Intérprete de Libras': string;
    'Qtd. Eleitores': number;
    'Qtd. com Biometria': number;
    'Qtd. com Deficiência': number;
    'Qtd. com Nome Social': number;
    'Tipo de Escolaridade Detalhado': string;
}

type AgrupamentoKeys = 'Município' | 'Local de Votação' | 'Seção Eleitoral';
type VariaveisKeys = 'Gênero' | 'Estado Civil' | 'Faixa Etária' | 'Escolaridade' | 'Raça/Cor' | 'Identidade de Gênero';

interface EleitoradoReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const Spinner = () => (
    <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
);

const getUniqueOptions = (data: EleitoradoAgregado[], key: keyof EleitoradoAgregado, sort = true): string[] => {
    const options = new Set<string>();
    data.forEach((item) => {
        const value = item[key]?.toString().trim().toUpperCase();
        if (value && value !== 'N/A' && value !== 'NÃO SE APLICA') {
            options.add(value);
        }
    });
    const sortedOptions = Array.from(options);
    if (sort) {
        sortedOptions.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    }
    return sortedOptions;
};

const safeParseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const normalizedValue = value.replace(/\./g, '').replace(/,/g, '.');
        const parsed = parseFloat(normalizedValue);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const getSheetId = (gender: string, maritalStatus: string) => {
    const normalizedMaritalStatus = maritalStatus.toLowerCase().replace(/ /g, '_');
    return `${gender.toLowerCase()}_${normalizedMaritalStatus}`;
};

const getAllRelevantSheetIds = (selectedGenders: string[], selectedMaritalStatus: string[], allPlanilhas: string[]): string[] => {
    const relevantSheets = new Set<string>();

    if ((!selectedGenders || selectedGenders.length === 0) && (!selectedMaritalStatus || selectedMaritalStatus.length === 0)) {
        allPlanilhas.forEach(sheet => relevantSheets.add(sheet));
    } else {
        const maritalStatusList = selectedMaritalStatus.length > 0
            ? selectedMaritalStatus.map(ms => ms.toLowerCase())
            : ['solteiro', 'casado', 'separado_judicialmente', 'divorciado', 'viuvo', 'nao_informado'];

        const genderList = selectedGenders.length > 0
            ? selectedGenders.map(g => g.toLowerCase())
            : ['masculino', 'feminino'];

        for (const gender of genderList) {
            for (const ms of maritalStatusList) {
                if (gender === 'feminino' && ms === 'nao_informado') continue;
                relevantSheets.add(getSheetId(gender, ms));
            }
        }
    }
    return Array.from(relevantSheets);
};

const EleitoradoReportModal: React.FC<EleitoradoReportModalProps> = ({ isOpen, onClose }) => {
    const [reportStep, setReportStep] = useState(1);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [reportError, setReportError] = useState('');

    const [loadingData, setLoadingData] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedVariables, setSelectedVariables] = useState<VariaveisKeys[]>([]);
    const [selectedSubVariables, setSelectedSubVariables] = useState<Partial<Record<VariaveisKeys, string[]>>>({});
    const [agrupamentoPorSelecionado, setAgrupamentoPorSelecionado] = useState<AgrupamentoKeys>('Município');

    const planilhasEleitorado = useMemo(() => ([
        'masculino_solteiro', 'masculino_casado', 'masculino_separado_judicialmente',
        'masculino_divorciado', 'masculino_viuvo', 'masculino_nao_informado', 'feminino_casado',
        'feminino_viuvo', 'feminino_divorciado', 'feminino_separado_judicialmente',
        'feminino_solteiro'
    ]), []);

    const variaveisDisponiveis: VariaveisKeys[] = useMemo(() => ([
        'Gênero', 'Estado Civil', 'Faixa Etária', 'Escolaridade', 'Raça/Cor', 'Identidade de Gênero',
    ]), []);

    const allOptionsForVariables = useMemo(() => ({
        'Gênero': ['MASCULINO', 'FEMININO'],
        'Estado Civil': ['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'SEPARADO JUDICIALMENTE', 'VIÚVO', 'NÃO INFORMADO'],
        'Faixa Etária': [
            '16 ANOS', '17 ANOS', '18 ANOS', '19 ANOS', '20 ANOS', '21 A 24 ANOS',
            '25 A 29 ANOS', '30 A 34 ANOS', '35 A 39 ANOS', '40 A 44 ANOS', '45 A 49 ANOS',
            '50 A 54 ANOS', '55 A 59 ANOS', '60 A 64 ANOS', '65 A 69 ANOS', '70 A 74 ANOS',
            '75 A 79 ANOS', '80 A 84 ANOS', '85 A 89 ANOS', '90 A 94 ANOS', '95 A 99 ANOS', '100 ANOS OU MAIS'
        ],
        'Escolaridade': [
            'ENSINO FUNDAMENTAL INCOMPLETO',
            'ENSINO MÉDIO COMPLETO',
            'LÊ E ESCREVE',
            'ANALFABETO',
            'ENSINO FUNDAMENTAL COMPLETO',
            'SUPERIOR COMPLETO',
            'SUPERIOR INCOMPLETO',
            'ENSINO MÉDIO INCOMPLETO'
        ],
        'Raça/Cor': ['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDÍGENA', 'NÃO INFORMADO'],
        'Identidade de Gênero': ['CISGÊNERO', 'NÃO INFORMADO', 'PREFERE NÃO INFORMAR', 'TRANSGÊNERO'],
    }), []);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) {
            resetModalState();
            return;
        }

        const controller = new AbortController();
        const fetchMunicipalities = async () => {
            setLoadingData(true);
            setReportError('');
            try {
                const res = await fetch(`/api/sheets/eleicao/masculino_solteiro`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Erro ao carregar municípios: ${res.status}`);
                const json = await res.json();
                const linhas: string[][] = json.data?.slice(1) || [];
                const allMunicipalities = getUniqueOptions(linhas.map(l => ({ 'Município': l[0] }) as EleitoradoAgregado), 'Município');
                setMunicipiosDisponiveis(allMunicipalities);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setReportError('Falha ao carregar a lista de municípios. Por favor, tente novamente.');
                }
            } finally {
                setLoadingData(false);
            }
        };

        if (municipiosDisponiveis.length === 0) {
            fetchMunicipalities();
        }

        return () => {
            controller.abort();
        };
    }, [isOpen, municipiosDisponiveis.length]);

    const fetchFilteredData = useCallback(async (controller: AbortController, filters: { cities: string[], variables: VariaveisKeys[], subVariables: Partial<Record<VariaveisKeys, string[]>> }) => {
        setLoadingData(true);
        setLoadingProgress(0);
        setReportError('');

        try {
            const selectedGenders = filters.subVariables['Gênero'] ?? [];
            const selectedMaritalStatus = filters.subVariables['Estado Civil'] ?? [];
            const sheetsToFetch = getAllRelevantSheetIds(selectedGenders, selectedMaritalStatus, planilhasEleitorado);
            const totalSheets = sheetsToFetch.length;

            const allData: EleitoradoAgregado[] = [];
            let loadedSheets = 0;

            for (const id of sheetsToFetch) {
                if (controller.signal.aborted) throw new Error('AbortError');
                const res = await fetch(`/api/sheets/eleicao/${id}`, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`Falha ao carregar dados da planilha ${id}. Status: ${res.status}`);
                }
                const json = await res.json();
                const linhas: string[][] = json.data?.slice(1) || [];
                for (const linha of linhas) {
                    allData.push({
                        'Município': linha[0]?.trim().toUpperCase() || 'N/A',
                        'Zona Eleitoral': linha[1]?.trim().toUpperCase() || 'N/A',
                        'Seção Eleitoral': linha[2]?.trim().toUpperCase() || 'N/A',
                        'Local de Votação': linha[3]?.trim().toUpperCase() || 'N/A',
                        'Gênero': linha[4]?.trim().toUpperCase() || 'N/A',
                        'Estado Civil': linha[5]?.trim().toUpperCase() || 'N/A',
                        'Faixa Etária': linha[6]?.trim().toUpperCase() || 'N/A',
                        'Escolaridade': linha[7]?.trim().toUpperCase() || 'N/A',
                        'Raça/Cor': linha[8]?.trim().toUpperCase() || 'N/A',
                        'Identidade de Gênero': linha[9]?.trim().toUpperCase() || 'N/A',
                        'Quilombola': linha[10]?.trim().toUpperCase() || 'N/A',
                        'Intérprete de Libras': linha[11]?.trim().toUpperCase() || 'N/A',
                        'Qtd. Eleitores': safeParseNumber(linha[12]),
                        'Qtd. com Biometria': safeParseNumber(linha[13]),
                        'Qtd. com Deficiência': safeParseNumber(linha[14]),
                        'Qtd. com Nome Social': safeParseNumber(linha[15]),
                        'Tipo de Escolaridade Detalhado': linha[16]?.trim().toUpperCase() || 'N/A',
                    });
                }
                loadedSheets++;
                setLoadingProgress(Math.floor((loadedSheets / totalSheets) * 100));
            }
            setLoadingProgress(100);
            return allData;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Erro ao carregar dados para o relatório:', err);
                setReportError('Erro ao carregar dados: ' + err.message);
            }
            setLoadingProgress(0);
            return [];
        } finally {
            setLoadingData(false);
        }
    }, [planilhasEleitorado]);

    const handleToggleCity = (city: string) => {
        setSelectedCities(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    const handleToggleVariable = (variable: VariaveisKeys) => {
        setSelectedVariables(prev => {
            if (prev.includes(variable)) {
                setSelectedSubVariables(subPrev => {
                    const newSub = { ...subPrev };
                    delete newSub[variable];
                    return newSub;
                });
                return prev.filter(v => v !== variable);
            } else {
                return [...prev, variable];
            }
        });
    };

    const handleToggleSubVariable = (variable: VariaveisKeys, subVariable: string) => {
        setSelectedSubVariables(prev => {
            const currentSub = prev[variable] ?? [];
            if (currentSub.includes(subVariable)) {
                const newSub = currentSub.filter(v => v !== subVariable);
                if (newSub.length === 0) {
                    const allSub = { ...prev };
                    delete allSub[variable];
                    return allSub;
                }
                return { ...prev, [variable]: newSub };
            } else {
                return { ...prev, [variable]: [...currentSub, subVariable] };
            }
        });
    };

    const resetModalState = useCallback(() => {
        setReportStep(1);
        setSelectedCities([]);
        setSelectedVariables([]);
        setSelectedSubVariables({});
        setAgrupamentoPorSelecionado('Município');
        setIsGeneratingPdf(false);
        setReportError('');
        setLoadingData(false);
        setLoadingProgress(0);
        setSearchTerm('');
    }, []);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleAdvanceFromStep1 = useCallback(() => setReportStep(2), []);
    const handleBackToStep1 = useCallback(() => setReportStep(1), []);
    const handleAdvanceFromStep2 = useCallback(() => setReportStep(3), []);
    const handleBackToStep2 = useCallback(() => setReportStep(2), []);

    const filteredMunicipalities = useMemo(() => {
        if (!searchTerm) {
            return municipiosDisponiveis;
        }
        return municipiosDisponiveis.filter(m =>
            m.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [municipiosDisponiveis, searchTerm]);

    const canAdvanceToStep2 = selectedCities.length > 0;
    const canAdvanceToStep3 = selectedVariables.some(v => (selectedSubVariables[v] ?? []).length > 0);
    const canGenerate = !!agrupamentoPorSelecionado;

    const agrupamentoLabels: Record<AgrupamentoKeys, string> = {
        'Município': 'Município',
        'Local de Votação': 'Local de Votação',
        'Seção Eleitoral': 'Seção Eleitoral',
    };
    
    const aggregateDataByVariable = useCallback((data: EleitoradoAgregado[], agrupamentoKey: AgrupamentoKeys, variable: VariaveisKeys, subVariables: string[]) => {
        const aggregatedData: Record<string, Record<string, number>> = {};
        const allSubVariablesArray = subVariables.sort();
    
        data.forEach(item => {
            const grupoPrimario = item[agrupamentoKey] || 'N/A';
            if (!aggregatedData[grupoPrimario]) {
                aggregatedData[grupoPrimario] = {};
                allSubVariablesArray.forEach(subVar => {
                    aggregatedData[grupoPrimario][subVar] = 0;
                });
            }
    
            const categoria = item[variable]?.toString().trim().toUpperCase() || 'N/A';
            if (allSubVariablesArray.includes(categoria)) {
                aggregatedData[grupoPrimario][categoria] += item['Qtd. Eleitores'];
            }
        });
    
        return { aggregatedData, allSubVariablesArray };
    }, []);

    const createPdfDocument = async (
        aggregatedData: Record<string, Record<string, number>>, 
        allSubVariablesArray: string[], 
        city: string, 
        agrupamentoKey: AgrupamentoKeys, 
        currentVariableLabel: string,
        selectedVariables: VariaveisKeys[],
        selectedSubVariables: Partial<Record<VariaveisKeys, string[]>>
    ) => {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let page = pdfDoc.addPage([842, 595]);
        const { width, height } = page.getSize();
        const margin = 30;
        const lineHeight = 12;
        const smallFontSize = 8;
        const tableFontSize = 8;
        const headerHeight = lineHeight + 5;
        let yPosition = height - margin;

        const drawPageHeader = (pageToDraw: any) => {
            const dateText = `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`;
            pageToDraw.drawText(dateText, {
                x: width - margin - helveticaFont.widthOfTextAtSize(dateText, smallFontSize),
                y: height - margin - 20,
                font: helveticaFont,
                size: smallFontSize,
                color: rgb(0.5, 0.5, 0.5),
            });

            let yPos = height - margin;
            pageToDraw.drawText(`Relatório do Eleitorado - ${currentVariableLabel}`, {
                x: margin,
                y: yPos,
                font: helveticaBoldFont,
                size: 18,
                color: rgb(0, 0, 0),
            });
            yPos -= 1.5 * lineHeight;
            pageToDraw.drawText(`Filtros utilizados:`, {
                x: margin,
                y: yPos,
                font: helveticaBoldFont,
                size: smallFontSize + 2,
                color: rgb(0, 0, 0),
            });
            yPos -= lineHeight;
            pageToDraw.drawText(`Município: ${city}`, {
                x: margin,
                y: yPos,
                font: helveticaFont,
                size: smallFontSize,
                color: rgb(0, 0, 0),
            });
            yPos -= lineHeight;
            pageToDraw.drawText(`Agrupamento: Por ${agrupamentoLabels[agrupamentoKey]}`, {
                x: margin,
                y: yPos,
                font: helveticaFont,
                size: smallFontSize,
                color: rgb(0, 0, 0),
            });
            yPos -= lineHeight;
            
            selectedVariables.forEach(variable => {
                const subVars = selectedSubVariables[variable]?.join(', ') || 'Nenhum';
                pageToDraw.drawText(`- ${variable}: ${subVars}`, {
                    x: margin + 10,
                    y: yPos,
                    font: helveticaFont,
                    size: smallFontSize,
                    color: rgb(0, 0, 0),
                });
                yPos -= lineHeight;
            });

            return yPos - 1.5 * lineHeight;
        };

        const drawTableHeader = (pageToDraw: any, y: number) => {
            const tableHeaders = [agrupamentoLabels[agrupamentoKey], ...allSubVariablesArray.map(c => `Qtd. ${c}`)];
            const tableWidth = width - 2 * margin;
            const primaryColWidth = 0.3 * tableWidth;
            const otherColsWidth = (tableWidth - primaryColWidth) / allSubVariablesArray.length;
            const colWidths = [primaryColWidth, ...Array(allSubVariablesArray.length).fill(otherColsWidth)];

            let xOffset = margin;
            pageToDraw.drawRectangle({
                x: margin,
                y: y - headerHeight,
                width: tableWidth,
                height: headerHeight,
                color: rgb(0.078, 0.392, 0.784),
            });
            for (let i = 0; i < tableHeaders.length; i++) {
                const headerText = tableHeaders[i];
                const headerTextWidth = helveticaBoldFont.widthOfTextAtSize(headerText, smallFontSize);
                pageToDraw.drawText(headerText, {
                    x: xOffset + (colWidths[i] / 2) - (headerTextWidth / 2),
                    y: y - (headerHeight / 2) - (smallFontSize / 2),
                    font: helveticaBoldFont,
                    size: smallFontSize,
                    color: rgb(1, 1, 1),
                });
                xOffset += colWidths[i];
            }
            return y - headerHeight;
        };

        yPosition = drawPageHeader(page);
        yPosition -= 2 * lineHeight;
        page.drawText('Tabela Detalhada', {
            x: margin,
            y: yPosition,
            font: helveticaBoldFont,
            size: 12,
            color: rgb(0, 0, 0),
        });
        yPosition -= 1.5 * lineHeight;

        yPosition = drawTableHeader(page, yPosition);

        const rowHeight = lineHeight + 5;
        Object.keys(aggregatedData).forEach((grupo) => {
            const rowData = [
                grupo,
                ...allSubVariablesArray.map(c => (aggregatedData[grupo][c] || 0).toLocaleString('pt-BR')),
            ];

            if (yPosition < margin + rowHeight) {
                page = pdfDoc.addPage([842, 595]);
                yPosition = drawPageHeader(page);
                yPosition = drawTableHeader(page, yPosition);
            }

            const tableWidth = width - 2 * margin;
            const primaryColWidth = 0.3 * tableWidth;
            const otherColsWidth = (tableWidth - primaryColWidth) / allSubVariablesArray.length;
            const colWidths = [primaryColWidth, ...Array(allSubVariablesArray.length).fill(otherColsWidth)];
            let xOffset = margin;
            
            rowData.forEach((text, i) => {
                const textWidth = helveticaFont.widthOfTextAtSize(text, tableFontSize);
                page.drawText(text, {
                    x: xOffset + (colWidths[i] / 2) - (textWidth / 2),
                    y: yPosition - lineHeight,
                    font: helveticaFont,
                    size: tableFontSize,
                    color: rgb(0, 0, 0),
                });
                xOffset += colWidths[i];
            });
            yPosition -= rowHeight;
        });

        return pdfDoc;
    };

    const gerarPDF = async () => {
        setIsGeneratingPdf(true);
        setReportError('');
        try {
            if (selectedCities.length === 0 || selectedVariables.length === 0 || !agrupamentoPorSelecionado) {
                throw new Error('Por favor, selecione pelo menos uma cidade, uma variável e um tipo de agrupamento.');
            }

            const controller = new AbortController();
            const eleitoradoData = await fetchFilteredData(controller, {
                cities: selectedCities,
                variables: selectedVariables,
                subVariables: selectedSubVariables
            });

            if (eleitoradoData.length === 0) {
                throw new Error('Não foi possível carregar os dados para gerar o relatório com os filtros selecionados.');
            }

            const pdfDoc = await PDFDocument.create();

            for (const city of selectedCities) {
                const dadosFiltradosPorCidade = eleitoradoData.filter(item => item['Município'] === city);

                if (dadosFiltradosPorCidade.length === 0) {
                    console.warn(`Nenhum dado encontrado para a cidade: ${city}. Pulando.`);
                    continue;
                }
                
                for (const variable of selectedVariables) {
                    const subVariables = selectedSubVariables[variable];
                    if (!subVariables || subVariables.length === 0) continue;

                    const { aggregatedData, allSubVariablesArray } = aggregateDataByVariable(dadosFiltradosPorCidade, agrupamentoPorSelecionado, variable, subVariables);

                    const cityPdf = await createPdfDocument(aggregatedData, allSubVariablesArray, city, agrupamentoPorSelecionado, variable, selectedVariables, selectedSubVariables);
                    const cityPages = cityPdf.getPages();
                    for (const page of cityPages) {
                        const [copiedPage] = await pdfDoc.copyPages(cityPdf, [cityPdf.getPages().indexOf(page)]);
                        pdfDoc.addPage(copiedPage);
                    }
                }
            }

            if (pdfDoc.getPages().length === 0) {
                 throw new Error('Nenhum dado foi encontrado para gerar o relatório com os filtros selecionados.');
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_eleitorado.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Relatório PDF gerado com sucesso!');
            handleClose();

        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error);
            setReportError(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido.'}`);
        } finally {
            setIsGeneratingPdf(false);
            setLoadingData(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl mx-4 relative" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    aria-label="Fechar"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Gerar Relatório do Eleitorado</h2>
                {reportError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Erro:</strong>
                        <span className="block sm:inline"> {reportError}</span>
                    </div>
                )}

                {loadingData && (
                    <div className="w-full flex flex-col items-center justify-center h-48">
                        <Spinner />
                        <p className="mt-2 text-sm font-semibold text-gray-800">
                            {reportStep === 1
                                ? "Carregando municípios..."
                                : `Carregando dados (${loadingProgress}%)`
                            }
                        </p>
                        {reportStep > 1 && (
                            <div className="w-64 mt-4 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${loadingProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}

                {reportStep === 1 && !loadingData && (
                    <>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecione os Municípios:
                            </label>
                            {municipiosDisponiveis.length === 0 && !loadingData ? (
                                <p className="text-center text-sm text-gray-500">Nenhum município disponível. Por favor, tente recarregar.</p>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por município..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        {filteredMunicipalities.map(city => (
                                            <div key={city} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`city-${city}`}
                                                    checked={selectedCities.includes(city)}
                                                    onChange={() => handleToggleCity(city)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`city-${city}`} className="ml-2 block text-sm font-medium text-gray-700">
                                                    {city}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdvanceFromStep1}
                                disabled={!canAdvanceToStep2}
                                className={`px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                    canAdvanceToStep2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Avançar
                            </button>
                        </div>
                    </>
                )}

                {reportStep === 2 && !loadingData && (
                    <>
                        <div className="mb-6 overflow-y-auto max-h-[calc(100vh-250px)]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecione as Variáveis para o Relatório:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {variaveisDisponiveis.map(variable => (
                                    <div key={variable} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`variable-${variable}`}
                                            checked={selectedVariables.includes(variable)}
                                            onChange={() => handleToggleVariable(variable)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`variable-${variable}`} className="ml-2 block text-sm font-medium text-gray-700">
                                            {variable}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {selectedVariables.map(variable => (
                                <div key={`sub-${variable}`} className="mt-4">
                                    <h4 className="block text-sm font-semibold text-gray-700 mb-2">
                                        Detalhes para {variable}:
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto max-h-32 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        {allOptionsForVariables[variable]?.map(option => (
                                            <div key={option} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`sub-${variable}-${option}`}
                                                    checked={(selectedSubVariables[variable] ?? []).includes(option)}
                                                    onChange={() => handleToggleSubVariable(variable, option)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={`sub-${variable}-${option}`} className="ml-2 block text-sm font-medium text-gray-700">
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={handleBackToStep1}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleAdvanceFromStep2}
                                disabled={!canAdvanceToStep3}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                    canAdvanceToStep3 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Avançar
                            </button>
                        </div>
                    </>
                )}

                {reportStep === 3 && !loadingData && (
                    <>
                        <div className="mb-6">
                            <label htmlFor="agrupamento" className="block text-sm font-medium text-gray-700 mb-1">
                                Agrupar Por:
                            </label>
                            <div className="relative">
                                <select
                                    id="agrupamento"
                                    className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={agrupamentoPorSelecionado}
                                    onChange={(e) => setAgrupamentoPorSelecionado(e.target.value as AgrupamentoKeys)}
                                >
                                    <option value="Município">Município</option>
                                    <option value="Local de Votação">Local de Votação</option>
                                    <option value="Seção Eleitoral">Seção Eleitoral</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={handleBackToStep2}
                                disabled={isGeneratingPdf || loadingData}
                                className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={gerarPDF}
                                disabled={isGeneratingPdf || !canGenerate || loadingData}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                    canGenerate && !isGeneratingPdf && !loadingData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                {isGeneratingPdf || loadingData ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isGeneratingPdf ? 'Gerando PDF...' : `Carregando dados (${loadingProgress}%)`}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default EleitoradoReportModal;