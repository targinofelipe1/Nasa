'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

interface CandidatoDropdownOption {
    nome: string;
    siglaPartido: string;
    numeroCandidato?: string;
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

interface RelatorioDetalhadoItem {
    nome: string;
    votos: number;
    porcentagem: number;
    ranking: number;
    eleitores?: number;
    bairro?: string;
    eleitoresAptos?: number;
    comparecimento?: number;
}

interface VotacaoPorBairro {
    nome: string;
    votos: number;
    ranking: number;
    eleitoresAptos?: number;
    comparecimento?: number;
}

interface AnalysisResults {
    totalVotos: number;
    totalPorcentagem: number;
    rankingGeral: number;
    totalSecoesComVotos: number;
    totalLocaisComVotos: number;
    totalCidadesComVotos: number;
    mediaVotosPorLocal: number;
    mediaVotosPorSecao: number;
    mediaVotosPorBairro: number;
    locaisZeroVoto: number;
    relatorioDetalhado: RelatorioDetalhadoItem[];
    rankingPorBairro: VotacaoPorBairro[];
    infoCandidato: { nome: string; partido: string; ano: string; cargo: string; abrangencia: string; cidade?: string; };
    totalEleitoresAptos?: number;
    totalComparecimento?: number;
}

interface FullAnalysisReport {
    mainAnalysis: AnalysisResults;
    cityAnalyses: AnalysisResults[];
}

const safeParseVotes = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseInt(value.replace(/\./g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#F5F5F5', padding: 30, fontFamily: 'Helvetica' },
    header: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#2c3e50', fontFamily: 'Helvetica-Bold' },
    subheader: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#34495e' },
    gridContainer: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 20, marginBottom: 20 },
    card: { width: '30%', padding: 15, backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 15, border: '1px solid #e0e0e0', justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
    cardTitle: { fontSize: 12, color: '#7f8c8d', marginBottom: 5 },
    cardValue: { fontSize: 24, color: '#2980b9', fontFamily: 'Helvetica-Bold' },
    table: { display: 'table' as any, width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { flexDirection: 'row' },
    tableHeader: { backgroundColor: '#2980b9' },
    tableHeaderCell: { margin: 'auto', marginTop: 5, padding: 5, fontSize: 10, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
    tableCell: { margin: 'auto', marginTop: 5, padding: 5, fontSize: 8, borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0 },
});

const CoverPage = ({ data }: { data: FullAnalysisReport }) => (
    <Page size="A4" style={{ justifyContent: 'center', alignItems: 'center', ...styles.page }}>
        <Text style={{ fontSize: 40, fontFamily: 'Helvetica-Bold', marginBottom: 20 }}>Análise Eleitoral</Text>
        <Text style={{ fontSize: 20 }}>{`Eleição: ${data.mainAnalysis.infoCandidato.ano}`}</Text>
        <Text style={{ fontSize: 20 }}>{`Cargo: ${data.mainAnalysis.infoCandidato.cargo}`}</Text>
        <Text style={{ fontSize: 20 }}>{`Candidato: ${data.mainAnalysis.infoCandidato.nome} (${data.mainAnalysis.infoCandidato.partido})`}</Text>
        <Text style={{ fontSize: 12, marginTop: 50 }}>Gerado por: Data Metrics</Text>
    </Page>
);

const AnalysisPage = ({ data }: { data: AnalysisResults }) => {
    const { totalVotos, totalPorcentagem, rankingGeral, totalSecoesComVotos, totalLocaisComVotos, totalCidadesComVotos, mediaVotosPorLocal, mediaVotosPorSecao, mediaVotosPorBairro, locaisZeroVoto, relatorioDetalhado, rankingPorBairro, infoCandidato, totalEleitoresAptos, totalComparecimento } = data;
    const isEstado = infoCandidato.abrangencia === 'Estado';
    const isMunicipio = infoCandidato.abrangencia === 'Município' && infoCandidato.cidade;
    const totalEntities = isEstado ? totalCidadesComVotos : totalLocaisComVotos;
    const totalEntitiesLabel = isEstado ? 'Cidades com Votos' : 'Locais com Votos';
    const subtitleText = isEstado
        ? `Candidato: ${infoCandidato.nome} (${infoCandidato.partido}) - Cargo: ${infoCandidato.cargo} - Abrangência: ${infoCandidato.abrangencia}`
        : `Candidato: ${infoCandidato.nome} (${infoCandidato.partido}) - Cargo: ${infoCandidato.cargo} - Abrangência: ${infoCandidato.abrangencia} (${infoCandidato.cidade})`;

    const tableHeaders = isEstado
        ? ['Município', 'Eleitores', 'Votos Válidos', '% de Válidos', 'Ranking']
        : ['Local de Votação', 'Eleitores Aptos', 'Bairro', 'Votos Válidos', '% de Válidos', 'Ranking'];

    const headerWidths = isEstado
        ? ['30%', '20%', '15%', '15%', '20%']
        : ['20%', '15%', '20%', '15%', '15%', '15%'];

    return (
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.header}>{`Análise Eleitoral - ${infoCandidato.ano}`}</Text>
                <Text style={styles.subheader}>{subtitleText}</Text>
            </View>

            <View style={styles.gridContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Total de Votos</Text>
                    <Text style={styles.cardValue}>{totalVotos.toLocaleString('pt-BR')}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ranking Geral</Text>
                    <Text style={styles.cardValue}>{rankingGeral === 0 ? 'N/A' : `${rankingGeral}º`}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>% de Votos Válidos</Text>
                    <Text style={styles.cardValue}>{`${totalPorcentagem.toFixed(2)}%`}</Text>
                </View>
            </View>

            <View style={styles.gridContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{totalEntitiesLabel}</Text>
                    <Text style={styles.cardValue}>{totalEntities}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Locais com Zero Votos</Text>
                    <Text style={styles.cardValue}>{locaisZeroVoto}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Eleitores Aptos</Text>
                    <Text style={styles.cardValue}>{totalEleitoresAptos?.toLocaleString('pt-BR') || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.gridContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Média de Votos por Local</Text>
                    <Text style={styles.cardValue}>{mediaVotosPorLocal.toFixed(2)}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Média de Votos por Seção</Text>
                    <Text style={styles.cardValue}>{mediaVotosPorSecao.toFixed(2)}</Text>
                </View>
                {isMunicipio && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Média de Votos por Bairro</Text>
                        <Text style={styles.cardValue}>{mediaVotosPorBairro.toFixed(2)}</Text>
                    </View>
                )}
            </View>

            <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>
                    Detalhe da Votação por {isEstado ? 'Município' : 'Local'}
                </Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableHeaderCell, { width: headerWidths[0] }]}>{tableHeaders[0]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: headerWidths[1] }]}>{tableHeaders[1]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: headerWidths[2] }]}>{tableHeaders[2]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: headerWidths[3] }]}>{tableHeaders[3]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: headerWidths[4] }]}>{tableHeaders[4]}</Text>
                        {!isEstado && <Text style={[styles.tableHeaderCell, { width: headerWidths[5] }]}>{tableHeaders[5]}</Text>}
                    </View>
                    {relatorioDetalhado.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: headerWidths[0] }]}>{item.nome}</Text>
                            <Text style={[styles.tableCell, { width: headerWidths[1] }]}>{item.eleitoresAptos?.toLocaleString('pt-BR') || '0'}</Text>
                            <Text style={[styles.tableCell, { width: headerWidths[2] }]}>{isEstado ? item.votos.toLocaleString('pt-BR') : item.bairro}</Text>
                            <Text style={[styles.tableCell, { width: headerWidths[3] }]}>{isEstado ? `${item.porcentagem.toFixed(2)}%` : item.votos.toLocaleString('pt-BR')}</Text>
                            <Text style={[styles.tableCell, { width: headerWidths[4] }]}>{isEstado ? `${item.ranking}º` : `${item.porcentagem.toFixed(2)}%`}</Text>
                            {!isEstado && <Text style={[styles.tableCell, { width: headerWidths[5] }]}>{`${item.ranking}º`}</Text>}
                        </View>
                    ))}
                </View>
            </View>
            
            {isMunicipio && rankingPorBairro.length > 0 && (
                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>
                        Análise de Votação por Bairro
                    </Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Bairro</Text>
                            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Eleitores Aptos</Text>
                            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Total de Votos</Text>
                            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Ranking</Text>
                        </View>
                        {rankingPorBairro.map((b, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: '35%' }]}>{b.nome}</Text>
                                <Text style={[styles.tableCell, { width: '20%' }]}>{b.eleitoresAptos?.toLocaleString('pt-BR') || '0'}</Text>
                                <Text style={[styles.tableCell, { width: '20%' }]}>{b.votos.toLocaleString('pt-BR')}</Text>
                                <Text style={[styles.tableCell, { width: '25%' }]}>{`${b.ranking}º`}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={{ position: 'absolute', bottom: 30, right: 40, textAlign: 'right' }}>
                <Text style={{ fontSize: 8, color: '#999' }}>
                    {`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Fonte: TSE`}
                </Text>
            </View>
        </Page>
    );
};

const MyDocument = ({ data }: { data: FullAnalysisReport | null }) => {
    if (!data) return null;

    return (
        <Document>
            <CoverPage data={data} />
            {data.mainAnalysis.infoCandidato.abrangencia === 'Estado' && (
                <AnalysisPage data={data.mainAnalysis} />
            )}
            {data.cityAnalyses.map((cityAnalysis, index) => (
                <AnalysisPage key={index} data={cityAnalysis} />
            ))}
        </Document>
    );
};

const AnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [reportStep, setReportStep] = useState(1);
    const [selectedReportCargo, setSelectedReportCargo] = useState('');
    const [selectedReportElectionYear, setSelectedReportElectionYear] = useState('');
    const [selectedReportScope, setSelectedReportScope] = useState('');
    const [selectedReportCity, setSelectedReportCity] = useState('JOÃO PESSOA');
    const [selectedReportCandidate, setSelectedReportCandidate] = useState('');
    const [loadingData, setLoadingData] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [reportError, setReportError] = useState('');
    const [rawDataForReport, setRawDataForReport] = useState<any[]>([]);
    const [locaisData, setLocaisData] = useState<LocalVotacaoDetalhado[]>([]);
    const [analysisResults, setAnalysisResults] = useState<FullAnalysisReport | null>(null);

    const locaisCarregadosRef = useRef(false);

    useEffect(() => {
        const fetchLocais = async () => {
            if (!isOpen || locaisCarregadosRef.current) return;
            setLoadingData(true);
            setLoadingProgress(10);
            setReportError('');
            try {
                const res = await fetch(`/api/sheets/eleicao/locais`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const json = await res.json();
                const linhas: string[][] = json.data?.slice(1) || [];
                const parsedLocais: LocalVotacaoDetalhado[] = linhas.map(linha => ({
                    'Município': linha[0]?.trim() || '', 'Zona Eleitoral': linha[1]?.trim() || '', 'Seção Eleitoral': linha[2]?.trim() || '', 'Local de Votação': linha[3]?.trim() || '', 'Endereço do Local': linha[5]?.trim() || 'N/A', 'Bairro do Local': linha[6]?.trim() || 'N/A', 'Nome do Local': linha[4]?.trim() || 'N/A',
                }));
                setLocaisData(parsedLocais);
                locaisCarregadosRef.current = true;
                setLoadingProgress(100);
            } catch (error: any) {
                console.error('Erro ao carregar dados da planilha de locais:', error);
                setReportError('Erro ao carregar dados de locais de votação: ' + error.message);
                setLoadingProgress(0);
            } finally {
                setLoadingData(false);
            }
        };
        fetchLocais();
    }, [isOpen]);

    const planilhasPorCargoEAno: PlanilhasPorAno = useMemo(() => ({
        '2018': { Presidente: ['presidente_2018'], 'Presidente 2º turno': ['presidente_2018_2'], Senador: ['senador_2018'], Governador: ['governador_2018'], 'Deputado Federal': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'], 'Deputado Estadual': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'], },
        '2020': { Prefeito: ['prefeito_2020'], Vereador: ['vereador_2020'], },
        '2022': { Presidente: ['presidente'], 'Presidente 2º turno': ['presidente_2'], Senador: ['senador'], Governador: ['governador'], 'Governador 2º turno': ['governador_2'], 'Deputado Federal': ['grupo_federal1', 'grupo_federal2', 'grupo_federal3', 'deputado_federaljp'], 'Deputado Estadual': ['grupo_estadual1', 'grupo_estadual2', 'grupo_estadual3', 'deputado_estadualjp'], },
        '2024': { Prefeito: ['prefeito_2024'], Vereador: ['vereador_2024'], }
    }), []);

    const cargoMap: Record<string, string> = useMemo(() => ({
        'presidente_2018': 'Presidente', 'presidente_2018_2': 'Presidente 2º turno', 'senador_2018': 'Senador', 'governador_2018': 'Governador', 'grupo_federal1_2018': 'Deputado Federal', 'grupo_federal2_2018': 'Deputado Federal', 'grupo_federal3_2018': 'Deputado Federal', 'deputado_federaljp_2018': 'Deputado Federal', 'grupo_estadual1_2018': 'Deputado Estadual', 'grupo_estadual2_2018': 'Deputado Estadual', 'grupo_estadual3_2018': 'Deputado Estadual', 'deputado_estadualjp_2018': 'Deputado Estadual', 'prefeito_2020': 'Prefeito', 'vereador_2020': 'Vereador', 'prefeito_2024': 'Prefeito', 'vereador_2024': 'Vereador', 'presidente': 'Presidente', 'presidente_2': 'Presidente 2º turno', 'senador': 'Senador', 'governador': 'Governador', 'governador_2': 'Governador 2º turno', 'grupo_federal1': 'Deputado Federal', 'grupo_federal2': 'Deputado Federal', 'grupo_federal3': 'Deputado Federal', 'deputado_federaljp': 'Deputado Federal', 'grupo_estadual1': 'Deputado Estadual', 'grupo_estadual2': 'Deputado Estadual', 'grupo_estadual3': 'Deputado Estadual', 'deputado_estadualjp': 'Deputado Estadual',
    }), []);

    const fetchReportDataForCargoAndYear = useCallback(async (
        cargo: string,
        year: string,
        locais: LocalVotacaoDetalhado[],
        controller: AbortController
    ) => {
        setLoadingData(true);
        setLoadingProgress(10);
        setReportError('');
        setRawDataForReport([]);

        try {
            const yearData = planilhasPorCargoEAno[year];
            const ids: string[] | undefined = yearData ? yearData[cargo] : undefined;
            
            if (!ids || ids.length === 0) {
                setReportError('Nenhuma planilha encontrada para o cargo/ano selecionado.');
                setLoadingProgress(0);
                return;
            }

            const allData: any[] = [];
            const totalSheets = ids.length;
            let loadedSheets = 0;

            for (const id of ids) {
                if (controller.signal.aborted) {
                    setLoadingProgress(0);
                    return;
                }
                setLoadingProgress(10 + Math.floor((loadedSheets / totalSheets) * 90));

                const res = await fetch(`/api/sheets/eleicao/${id}`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Falha ao carregar dados da planilha ${id}. Status: ${res.status}`);
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
                        'Eleitores Aptos': safeParseVotes(linha[7]),
                        'Comparecimento': safeParseVotes(linha[8]),
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
            setLoadingData(false);
        }
    }, [planilhasPorCargoEAno, cargoMap]);

    useEffect(() => {
        const controller = new AbortController();
        if (selectedReportCargo && selectedReportElectionYear && locaisData.length > 0) {
            const handler = setTimeout(() => {
                fetchReportDataForCargoAndYear(selectedReportCargo, selectedReportElectionYear, locaisData, controller);
            }, 300);
            return () => { clearTimeout(handler); controller.abort(); };
        } else if (!selectedReportCargo || !selectedReportElectionYear) {
             setRawDataForReport([]);
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
                return Object.keys(cargosForSelectedYear).filter(cargo =>
                    cargo !== 'Visão Geral' && cargo !== 'Visão Geral 2º turno' && cargo !== 'undefined'
                ).sort();
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
        const sortedCities = Array.from(uniqueCities).sort((a, b) => {
            if (a === 'JOÃO PESSOA') return -1;
            if (b === 'JOÃO PESSOA') return 1;
            return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
        });
        return sortedCities;
    }, [rawDataForReport]);
    
    const availableReportCandidates = useMemo(() => {
        if (rawDataForReport.length === 0) return [];
        const uniqueCandidates = new Map<string, CandidatoDropdownOption>();
    
        const filteredData = rawDataForReport.filter(item => {
            if (selectedReportScope === 'Município' && item['Município'] !== selectedReportCity) return false;
            return true;
        });

        filteredData.forEach(item => {
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

    const resetModalState = useCallback(() => {
        setReportStep(1);
        setSelectedReportCargo('');
        setSelectedReportElectionYear('');
        setSelectedReportScope('');
        setSelectedReportCity('JOÃO PESSOA');
        setSelectedReportCandidate('');
        setLoadingData(false);
        setLoadingProgress(0);
        setReportError('');
        setRawDataForReport([]);
        setAnalysisResults(null);
    }, []);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleAdvanceToStep2 = useCallback(() => {
        setReportStep(2);
        setReportError('');
        setSelectedReportCandidate('');
        setAnalysisResults(null);
        if (selectedReportElectionYear === '2020' || selectedReportElectionYear === '2024' || selectedReportCargo.includes('Prefeito') || selectedReportCargo.includes('Vereador')) {
            setSelectedReportScope('Município');
        }
    }, [selectedReportElectionYear, selectedReportCargo]);
    
    const handleAdvanceToStep3 = useCallback(() => {
        setReportStep(3);
        setReportError('');
    }, []);
    
    const handleAdvanceToStep4 = useCallback(() => {
        setReportStep(4);
        setReportError('');
    }, []);

    const handleBackToStep1 = useCallback(() => {
        setReportStep(1);
        setSelectedReportCandidate('');
        setSelectedReportScope('');
        setSelectedReportCity('JOÃO PESSOA');
        setReportError('');
        setRawDataForReport([]);
        setAnalysisResults(null);
    }, []);
    
    const handleBackToStep2 = useCallback(() => {
        setReportStep(2);
        setReportError('');
        setAnalysisResults(null);
        setSelectedReportCandidate('');
    }, []);
    
    const handleBackToStep3 = useCallback(() => {
        setReportStep(3);
        setReportError('');
        setAnalysisResults(null);
    }, []);

    const createAnalysisReport = useCallback((data: any[], scope: string, city: string | undefined, candidateName: string, candidateInfo: CandidatoDropdownOption): AnalysisResults => {
        let filteredData = data;
        if (scope === 'Município' && city) {
            filteredData = data.filter(item => item['Município'] === city);
        }

        const totalVotos = filteredData.filter(item => item['Nome do Candidato/Voto'] === candidateName).reduce((acc, curr) => acc + curr['Quantidade de Votos'], 0);
        let totalValidVotes = 0;
        const allVotesForScope = new Map<string, number>();
        const allLocations = new Set<string>();
        
        filteredData.forEach(item => {
            const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
            const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || (item['Sigla do Partido']?.toLowerCase() === '#nulo#' && nomeCandidato !== candidateName);
            
            const locationKey = `${item['Município']}-${item['Local de Votação']}`;
            allLocations.add(locationKey);

            if (!isBrancoOuNulo) {
                totalValidVotes += item['Quantidade de Votos'];
            }
            
            if (nomeCandidato && nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' && (item['Sigla do Partido']?.toLowerCase() !== '#nulo#' || nomeCandidato === item['Sigla do Partido']?.toUpperCase())) {
                const key = `${item.Cargo}-${nomeCandidato}`;
                allVotesForScope.set(key, (allVotesForScope.get(key) || 0) + item['Quantidade de Votos']);
            }
        });
        
        const sortedAllVotes = Array.from(allVotesForScope.entries()).sort((a, b) => b[1] - a[1]);
        const rankingGeral = sortedAllVotes.findIndex(v => v[0].endsWith(candidateName)) + 1;

        let relatorioDetalhado: RelatorioDetalhadoItem[] = [];
        let totalSecoesComVotos = 0;
        let totalLocaisComVotos = 0;
        let totalCidadesComVotos = 0;
        let rankingPorBairro: VotacaoPorBairro[] = [];
        
        const entityVotes = new Map<string, { totalVotos: number; totalVotosValidos: number; }>;
        const totalVotesPerEntity = new Map<string, number>();
        const totalValidVotesPerEntity = new Map<string, number>();
        const totalVotesPerSection = new Map<string, number>();
        const totalVotesPerBairro = new Map<string, number>();
        const totalElectorsPerEntity = new Map<string, { eleitoresAptos: number, comparecimento: number}>();
        const totalElectorsPerBairro = new Map<string, { eleitoresAptos: number, comparecimento: number}>();

        if (scope === 'Município' && city) {
            filteredData.forEach(item => {
                const entityKey = `${item['Município']}-${item['Local de Votação']}`;
                const sectionKey = `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}`;
                const bairroKey = item['Bairro do Local'] || 'Não Identificado';
                
                if (!entityVotes.has(entityKey)) {
                    entityVotes.set(entityKey, { totalVotos: 0, totalVotosValidos: 0 });
                }
                if (item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName) {
                    entityVotes.get(entityKey)!.totalVotos += item['Quantidade de Votos'];
                    totalVotesPerEntity.set(entityKey, (totalVotesPerEntity.get(entityKey) || 0) + item['Quantidade de Votos']);
                    totalVotesPerSection.set(sectionKey, (totalVotesPerSection.get(sectionKey) || 0) + item['Quantidade de Votos']);
                    totalVotesPerBairro.set(bairroKey, (totalVotesPerBairro.get(bairroKey) || 0) + item['Quantidade de Votos']);
                }
                const isBrancoOuNulo = item['Nome do Candidato/Voto']?.trim().toUpperCase() === 'BRANCO' || item['Nome do Candidato/Voto']?.trim().toUpperCase() === 'NULO' || (item['Sigla do Partido']?.toLowerCase() === '#nulo#' && item['Nome do Candidato/Voto']?.trim().toUpperCase() !== candidateName);
                if (!isBrancoOuNulo) {
                    entityVotes.get(entityKey)!.totalVotosValidos += item['Quantidade de Votos'];
                    totalValidVotesPerEntity.set(entityKey, (totalValidVotesPerEntity.get(entityKey) || 0) + item['Quantidade de Votos']);
                }
                
                const eleitoresAptos = safeParseVotes(item['Eleitores Aptos']);
                const comparecimento = safeParseVotes(item['Comparecimento']);

                if (item['Nome do Candidato/Voto']?.trim().toUpperCase() === '#NULO#') { // Adiciona eleitores apenas para a primeira linha de uma seção/local
                    totalElectorsPerEntity.set(entityKey, {
                        eleitoresAptos: (totalElectorsPerEntity.get(entityKey)?.eleitoresAptos || 0) + eleitoresAptos,
                        comparecimento: (totalElectorsPerEntity.get(entityKey)?.comparecimento || 0) + comparecimento,
                    });
                    totalElectorsPerBairro.set(bairroKey, {
                        eleitoresAptos: (totalElectorsPerBairro.get(bairroKey)?.eleitoresAptos || 0) + eleitoresAptos,
                        comparecimento: (totalElectorsPerBairro.get(bairroKey)?.comparecimento || 0) + comparecimento,
                    });
                }
            });

            const sortedEntities = Array.from(totalVotesPerEntity.entries()).sort((a, b) => b[1] - a[1]);
            relatorioDetalhado = sortedEntities.map(([key, votos], index) => {
                const [municipio, local] = key.split('-');
                const localInfo = locaisData.find(l => 
                    l['Município'] === municipio && l['Local de Votação'] === local
                );
                const nome = localInfo?.['Nome do Local'] || `Local ${local}`;
                const bairro = localInfo?.['Bairro do Local'] || 'N/A';
                const totalVotosValidos = totalValidVotesPerEntity.get(key) || 0;
                const porcentagem = totalVotosValidos > 0 ? (votos / totalVotosValidos) * 100 : 0;
                const eleitoresAptos = totalElectorsPerEntity.get(key)?.eleitoresAptos || 0;
                const comparecimento = totalElectorsPerEntity.get(key)?.comparecimento || 0;
                return { nome, votos, porcentagem, ranking: index + 1, bairro, eleitoresAptos, comparecimento };
            });

            const sortedBairros = Array.from(totalVotesPerBairro.entries()).sort((a, b) => b[1] - a[1]);
            rankingPorBairro = sortedBairros.map(([nome, votos], index) => {
                const eleitoresAptos = totalElectorsPerBairro.get(nome)?.eleitoresAptos || 0;
                const comparecimento = totalElectorsPerBairro.get(nome)?.comparecimento || 0;
                return { nome, votos, ranking: index + 1, eleitoresAptos, comparecimento };
            });

            totalLocaisComVotos = new Set(filteredData.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName).map(item => `${item['Município']}-${item['Local de Votação']}`)).size;
            totalSecoesComVotos = new Set(filteredData.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName).map(item => `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}`)).size;
            totalCidadesComVotos = new Set(filteredData.map(item => item['Município'])).size;

        } else { // 'Estado'
            filteredData.forEach(item => {
                const entityKey = item['Município'];
                const localKey = `${item['Município']}-${item['Local de Votação']}`;
                const sectionKey = `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}`;
                if (!entityVotes.has(entityKey)) {
                    entityVotes.set(entityKey, { totalVotos: 0, totalVotosValidos: 0 });
                }
                if (item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName) {
                    entityVotes.get(entityKey)!.totalVotos += item['Quantidade de Votos'];
                    totalVotesPerEntity.set(entityKey, (totalVotesPerEntity.get(entityKey) || 0) + item['Quantidade de Votos']);
                    totalVotesPerSection.set(sectionKey, (totalVotesPerSection.get(sectionKey) || 0) + item['Quantidade de Votos']);
                }
                const isBrancoOuNulo = item['Nome do Candidato/Voto']?.trim().toUpperCase() === 'BRANCO' || item['Nome do Candidato/Voto']?.trim().toUpperCase() === 'NULO' || (item['Sigla do Partido']?.toLowerCase() === '#nulo#' && item['Nome do Candidato/Voto']?.trim().toUpperCase() !== candidateName);
                if (!isBrancoOuNulo) {
                    entityVotes.get(entityKey)!.totalVotosValidos += item['Quantidade de Votos'];
                    totalValidVotesPerEntity.set(entityKey, (totalValidVotesPerEntity.get(entityKey) || 0) + item['Quantidade de Votos']);
                }
            });

            const sortedEntities = Array.from(totalVotesPerEntity.entries()).sort((a, b) => b[1] - a[1]);
            relatorioDetalhado = sortedEntities.map(([nome, votos], index) => {
                const totalVotosValidos = totalValidVotesPerEntity.get(nome) || 0;
                const porcentagem = totalVotosValidos > 0 ? (votos / totalVotosValidos) * 100 : 0;
                const eleitoresAptos = totalElectorsPerEntity.get(nome)?.eleitoresAptos || 0;
                return { nome, votos, porcentagem, ranking: index + 1, eleitoresAptos };
            });
            totalCidadesComVotos = new Set(filteredData.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName).map(item => item['Município'])).size;
            totalLocaisComVotos = new Set(filteredData.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName).map(item => `${item['Município']}-${item['Local de Votação']}`)).size;
            totalSecoesComVotos = new Set(filteredData.filter(item => item['Nome do Candidato/Voto']?.trim().toUpperCase() === candidateName).map(item => `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}`)).size;
        }
        
        const mediaVotosPorLocal = totalLocaisComVotos > 0 ? totalVotos / totalLocaisComVotos : 0;
        const mediaVotosPorSecao = totalSecoesComVotos > 0 ? totalVotos / totalSecoesComVotos : 0;
        const totalBairrosComVoto = totalVotesPerBairro.size;
        const mediaVotosPorBairro = totalBairrosComVoto > 0 ? totalVotos / totalBairrosComVoto : 0;
        const totalEleitoresAptos = Array.from(totalElectorsPerEntity.values()).reduce((acc, curr) => acc + curr.eleitoresAptos, 0);
        const totalComparecimento = Array.from(totalElectorsPerEntity.values()).reduce((acc, curr) => acc + curr.comparecimento, 0);

        const locaisZeroVoto = allLocations.size - totalLocaisComVotos;

        return {
            totalVotos: totalVotos,
            totalPorcentagem: totalValidVotes > 0 ? (totalVotos / totalValidVotes) * 100 : 0,
            rankingGeral: rankingGeral,
            totalLocaisComVotos: totalLocaisComVotos,
            totalSecoesComVotos: totalSecoesComVotos,
            totalCidadesComVotos: totalCidadesComVotos,
            mediaVotosPorLocal: mediaVotosPorLocal,
            mediaVotosPorSecao: mediaVotosPorSecao,
            mediaVotosPorBairro: mediaVotosPorBairro,
            locaisZeroVoto: locaisZeroVoto,
            relatorioDetalhado: relatorioDetalhado,
            rankingPorBairro: rankingPorBairro,
            infoCandidato: {
                nome: candidateInfo.nome,
                partido: candidateInfo.siglaPartido,
                ano: selectedReportElectionYear,
                cargo: selectedReportCargo,
                abrangencia: scope,
                cidade: city,
            },
            totalEleitoresAptos,
            totalComparecimento
        };
    }, [locaisData, selectedReportElectionYear, selectedReportCargo]);

    const runAnalysisAndSetResults = useCallback(() => {
        if (!rawDataForReport.length || !selectedReportCandidate || !selectedReportScope) {
            setReportError('Dados insuficientes para a análise. Por favor, complete as seleções.');
            return;
        }
        
        setAnalysisResults(null);
        
        const candidateName = selectedReportCandidate.toUpperCase();
        const candidateInfo = availableReportCandidates.find(c => c.nome === candidateName);
        if (!candidateInfo) {
            setReportError('Candidato não encontrado.');
            return;
        }

        let mainAnalysis: AnalysisResults;
        let cityAnalyses: AnalysisResults[] = [];

        if (selectedReportScope === 'Estado') {
            mainAnalysis = createAnalysisReport(rawDataForReport, 'Estado', undefined, candidateName, candidateInfo);
            const citiesWithData = Array.from(new Set(rawDataForReport.map(item => item['Município']))).sort();
            
            cityAnalyses = citiesWithData
                .map(city => createAnalysisReport(rawDataForReport, 'Município', city, candidateName, candidateInfo))
                .filter(analysis => analysis.totalVotos > 0);
        } else {
            if (!selectedReportCity) {
                setReportError('Selecione um município para a análise.');
                return;
            }
            mainAnalysis = createAnalysisReport(rawDataForReport, 'Município', selectedReportCity, candidateName, candidateInfo);
            if (mainAnalysis.totalVotos > 0) {
                cityAnalyses.push(mainAnalysis);
            }
        }

        const fullReport: FullAnalysisReport = {
            mainAnalysis,
            cityAnalyses,
        };

        setAnalysisResults(fullReport);
        handleAdvanceToStep4();
    }, [rawDataForReport, selectedReportCandidate, selectedReportScope, selectedReportCity, availableReportCandidates, handleAdvanceToStep4, createAnalysisReport]);

    const canAdvanceToStep1 = selectedReportElectionYear !== '' && selectedReportCargo !== '' && !loadingData && rawDataForReport.length > 0;
    const canAdvanceToStep2 = selectedReportScope !== '' && (selectedReportScope === 'Estado' || selectedReportCity !== '');
    const canGenerate = selectedReportCandidate !== '' && (selectedReportScope === 'Estado' || selectedReportCity !== '');
    const canDownload = analysisResults !== null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 relative"
                style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    aria-label="Fechar"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Gerar Análise de Votação</h2>

                {loadingData && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 relative overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                        <p className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-semibold text-gray-800">
                            Carregando dados... {loadingProgress}%
                        </p>
                    </div>
                )}

                {reportError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Erro:</strong>
                        <span className="block sm:inline"> {reportError}</span>
                    </div>
                )}
                
                <div className="flex justify-center items-center space-x-2 mb-6">
                    {['Ano/Cargo', 'Abrangência', 'Candidato', 'Download'].map((label, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300
                                    ${reportStep === index + 1 ? 'bg-blue-600 scale-110' : 'bg-gray-300'}
                                    ${reportStep > index + 1 ? 'bg-blue-500' : ''}`}
                                title={label}
                            >
                                {index + 1}
                            </div>
                            {index < 3 && (
                                <div className={`h-1 flex-1 transition-all duration-300 ${reportStep > index + 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-600 mb-6">Etapa: {['Ano/Cargo', 'Abrangência', 'Candidato', 'Download'][reportStep - 1]}</p>

                {reportStep === 1 && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="analysis-year" className="block text-sm font-medium text-gray-700 mb-1">Ano da Eleição:</label>
                            <select id="analysis-year" className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                value={selectedReportElectionYear} onChange={(e) => { setSelectedReportElectionYear(e.target.value); setSelectedReportCargo(''); setRawDataForReport([]); }} disabled={loadingData}>
                                <option value="">Selecione...</option>
                                <option value="2018">2018</option>
                                <option value="2020">2020</option>
                                <option value="2022">2022</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="analysis-cargo" className="block text-sm font-medium text-gray-700 mb-1">Cargo:</label>
                            <select id="analysis-cargo" className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                value={selectedReportCargo} onChange={(e) => setSelectedReportCargo(e.target.value)} disabled={loadingData || !selectedReportElectionYear}>
                                <option value="">Selecione...</option>
                                {availableReportCargos.map(cargo => (<option key={cargo} value={cargo}>{cargo}</option>))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">Cancelar</button>
                            <button onClick={handleAdvanceToStep2} disabled={!canAdvanceToStep1}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 ${!canAdvanceToStep1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Avançar</button>
                        </div>
                    </div>
                )}
                
                {reportStep === 2 && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="analysis-scope" className="block text-sm font-medium text-gray-700 mb-1">Abrangência do Relatório:</label>
                            <select id="analysis-scope" className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                value={selectedReportScope} onChange={(e) => { setSelectedReportScope(e.target.value); setSelectedReportCity('JOÃO PESSOA'); setSelectedReportCandidate(''); }} disabled={loadingData}>
                                <option value="">Selecione...</option>
                                <option value="Estado" disabled={selectedReportElectionYear === '2020' || selectedReportElectionYear === '2024' || selectedReportCargo.includes('Prefeito') || selectedReportCargo.includes('Vereador')}>Estado</option>
                                <option value="Município">Município</option>
                            </select>
                        </div>
                        {selectedReportScope === 'Município' && (
                            <div className="mb-6">
                                <label htmlFor="analysis-city" className="block text-sm font-medium text-gray-700 mb-1">Município:</label>
                                <select id="analysis-city" className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                    value={selectedReportCity} onChange={(e) => setSelectedReportCity(e.target.value)} disabled={loadingData || availableReportCities.length === 0}>
                                    <option value="">Selecione...</option>
                                    {availableReportCities.map(city => (<option key={city} value={city}>{city}</option>))}
                                </select>
                            </div>
                        )}
                        <div className="flex justify-between space-x-3">
                            <button onClick={handleBackToStep1} className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">Voltar</button>
                            <button onClick={handleAdvanceToStep3} disabled={!canAdvanceToStep2}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 ${!canAdvanceToStep2 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Avançar</button>
                        </div>
                    </div>
                )}
                
                {reportStep === 3 && (
                    <div>
                        <div className="mb-6">
                            <label htmlFor="analysis-candidate" className="block text-sm font-medium text-gray-700 mb-1">Candidato:</label>
                            <select id="analysis-candidate" className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                                value={selectedReportCandidate} onChange={(e) => setSelectedReportCandidate(e.target.value)} disabled={loadingData || availableReportCandidates.length === 0}>
                                <option value="">Selecione...</option>
                                {availableReportCandidates.map(c => (<option key={c.nome} value={c.nome}>{`${c.nome} (${c.siglaPartido})`}</option>))}
                            </select>
                        </div>
                        <div className="flex justify-between space-x-3">
                            <button onClick={handleBackToStep2} className="px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">Voltar</button>
                            <button
                                onClick={runAnalysisAndSetResults}
                                disabled={!canGenerate}
                                className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                    !canGenerate ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                Gerar Relatório
                            </button>
                        </div>
                    </div>
                )}
                
                {reportStep === 4 && (
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 w-full text-center" role="alert">
                            <p className="font-bold text-lg">Análise Gerada com Sucesso!</p>
                            <p className="text-lg">Clique no botão abaixo para baixar o PDF.</p>
                        </div>
                        <div className="w-full text-center mt-6">
                            <PDFDownloadLink
                                document={<MyDocument data={analysisResults} />}
                                fileName={`analise_votos_${selectedReportCandidate.replace(/ /g, '_')}_${selectedReportElectionYear}_${selectedReportScope.replace(/ /g, '_')}.pdf`}
                            >
                                {({ loading }) => (
                                    <button
                                        disabled={loading || !canDownload}
                                        className={`px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
                                            (loading || !canDownload) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {loading ? 'Preparando...' : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.29a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06l-1.94 1.94V6.75z" clipRule="evenodd" />
                                                </svg>
                                                Baixar Relatório
                                            </>
                                        )}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        </div>
                        <button
                            onClick={handleBackToStep3}
                            className="mt-4 px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisModal;