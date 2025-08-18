'use client';

import React from 'react';
import { format } from 'date-fns';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    relatorioDetalhado: any[]; // Substitua 'any' por sua interface específica se disponível
    rankingPorBairro: any[]; // Substitua 'any' por sua interface específica se disponível
    infoCandidato: { nome: string; partido: string; ano: string; cargo: string; abrangencia: string; cidade?: string; };
}

interface FullAnalysisReport {
    mainAnalysis: AnalysisResults;
    cityAnalyses: AnalysisResults[];
}

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
        <Text style={{ fontSize: 40, fontFamily: 'Helvetica-Bold', marginBottom: 20 }}>Relatório de Votação</Text>
        <Text style={{ fontSize: 20 }}>{`Eleição: ${data.mainAnalysis.infoCandidato.ano}`}</Text>
        <Text style={{ fontSize: 20 }}>{`Cargo: ${data.mainAnalysis.infoCandidato.cargo}`}</Text>
        <Text style={{ fontSize: 20 }}>{`Candidato: ${data.mainAnalysis.infoCandidato.nome} (${data.mainAnalysis.infoCandidato.partido})`}</Text>
        <Text style={{ fontSize: 12, marginTop: 50 }}>Gerado por: Analisador Eleitoral</Text>
    </Page>
);

const AnalysisPage = ({ data }: { data: AnalysisResults }) => {
    const { totalVotos, totalPorcentagem, rankingGeral, totalSecoesComVotos, totalLocaisComVotos, totalCidadesComVotos, mediaVotosPorLocal, mediaVotosPorSecao, mediaVotosPorBairro, locaisZeroVoto, relatorioDetalhado, rankingPorBairro, infoCandidato } = data;
    const isEstado = infoCandidato.abrangencia === 'Estado';
    const totalEntities = isEstado ? totalCidadesComVotos : totalLocaisComVotos;
    const totalEntitiesLabel = isEstado ? 'Cidades com Votos' : 'Locais com Votos';
    const subtitleText = isEstado
        ? `Candidato: ${infoCandidato.nome} (${infoCandidato.partido}) - Cargo: ${infoCandidato.cargo} - Abrangência: ${infoCandidato.abrangencia}`
        : `Candidato: ${infoCandidato.nome} (${infoCandidato.partido}) - Cargo: ${infoCandidato.cargo} - Abrangência: ${infoCandidato.abrangencia} (${infoCandidato.cidade})`;

    const tableHeaders = isEstado
        ? ['Município', 'Votos Válidos', '% de Válidos', 'Ranking']
        : ['Local de Votação', 'Bairro', 'Votos Válidos', '% de Válidos', 'Ranking'];

    const headerWidths = isEstado
        ? ['50%', '15%', '15%', '15%']
        : ['30%', '20%', '15%', '15%', '10%'];

    return (
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.header}>{`Análise de Votação - ${infoCandidato.ano}`}</Text>
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
                    <Text style={styles.cardTitle}>Seções com Votos</Text>
                    <Text style={styles.cardValue}>{totalSecoesComVotos}</Text>
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
                {/* A média de votos por bairro só é relevante para uma única cidade */}
                {!isEstado && (
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
                        {!isEstado && <Text style={[styles.tableHeaderCell, { width: headerWidths[1] }]}>{tableHeaders[1]}</Text>}
                        <Text style={[styles.tableHeaderCell, { width: !isEstado ? headerWidths[2] : headerWidths[1] }]}>{tableHeaders[2]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: !isEstado ? headerWidths[3] : headerWidths[2] }]}>{tableHeaders[3]}</Text>
                        <Text style={[styles.tableHeaderCell, { width: !isEstado ? headerWidths[4] : headerWidths[3] }]}>{tableHeaders[4]}</Text>
                    </View>
                    {relatorioDetalhado.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: headerWidths[0] }]}>{item.nome}</Text>
                            {!isEstado && <Text style={[styles.tableCell, { width: headerWidths[1] }]}>{item.bairro}</Text>}
                            <Text style={[styles.tableCell, { width: !isEstado ? headerWidths[2] : headerWidths[1] }]}>{item.votos.toLocaleString('pt-BR')}</Text>
                            <Text style={[styles.tableCell, { width: !isEstado ? headerWidths[3] : headerWidths[2] }]}>{`${item.porcentagem.toFixed(2)}%`}</Text>
                            <Text style={[styles.tableCell, { width: !isEstado ? headerWidths[4] : headerWidths[3] }]}>{`${item.ranking}º`}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Apenas para análise por município */}
            {!isEstado && rankingPorBairro.length > 0 && (
                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>
                        Análise de Votação por Bairro
                    </Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Bairro</Text>
                            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Total de Votos</Text>
                            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Ranking</Text>
                        </View>
                        {rankingPorBairro.map((b, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: '60%' }]}>{b.nome}</Text>
                                <Text style={[styles.tableCell, { width: '25%' }]}>{b.votos.toLocaleString('pt-BR')}</Text>
                                <Text style={[styles.tableCell, { width: '15%' }]}>{`${b.ranking}º`}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={{ position: 'absolute', bottom: 30, right: 40, textAlign: 'right' }}>
                <Text style={{ fontSize: 8, color: '#999' }}>
                    {`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Fonte: Dados Eleitorais Agregados`}
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

export default MyDocument;