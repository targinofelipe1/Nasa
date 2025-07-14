// pages/comparativo-cargos/index.tsx
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import MapaVariacaoParaiba from '@/components/ui/MapaVariacaoParaiba';
import TabelaComparativoCandidatos from '@/components/ui/TabelaComparativoCandidatos';
import FiltroDropdown from '@/components/ui/FiltroDropdown';

interface CandidatoData {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Nome do Local': string;
  'Endereço do Local': string;
  'Bairro do Local': string;
  'Numero do Candidato': string;
  'Nome do Candidato/Voto': string;
  'Quantidade de Votos': number;
  'Sigla do Partido': string;
  'Cargo': string;
}

interface SectionMetrics {
  aptos: number;
  comp: number;
  abst: number;
  localCode: string;
  municipio: string;
  zona: string;
  secao: string;
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

interface ComparativoCandidatoDataParaTabela {
  municipio: string;
  zona: string;
  secao: string;
  totalVotos2018: number;
  totalVotos2022: number;
  porcentagem2018: number;
  porcentagem2022: number;
  variacaoVotos: number;
  variacaoPorcentagem: number;
  localNome: string;
  localEndereco: string;
  localBairro: string;
}

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const interpolateColor = (value: number, min: number, max: number, minColor: number[], maxColor: number[]): string => {
  if (value <= min) return `rgb(${minColor[0]},${minColor[1]},${minColor[2]})`;
  if (value >= max) return `rgb(${maxColor[0]},${maxColor[1]},${maxColor[2]})`; 

  const ratio = (value - min) / (max - min);
  const r = Math.round(minColor[0] + (maxColor[0] - minColor[0]) * ratio);
  const g = Math.round(minColor[1] + (maxColor[1] - minColor[1]) * ratio);
  const b = Math.round(minColor[2] + (maxColor[2] - minColor[2]) * ratio);
  return `rgb(${r},${g},${b})`;
};

const CACHE_VERSION_LOCAL_STORAGE = '1.0'; 

export default function ComparativoCargos() {
  const [carregando, setCarregando] = useState(true);

  // Estados principais para os dados brutos e métricas (carregados por cargo)
  const [dados2018Completos, setDados2018Completos] = useState<CandidatoData[]>([]);
  const [dados2022Completos, setDados2022Completos] = useState<CandidatoData[]>([]);
  const [metricasSecao2018, setMetricasSecao2018] = useState<Map<string, SectionMetrics>>(new Map());
  const [metricasSecao2022, setMetricasSecao2022] = useState<Map<string, SectionMetrics>>(new Map());
  
  const [dadosLocais, setDadosLocais] = useState<LocalVotacaoDetalhado[]>([]);
  const locaisCarregadosRef = useRef(false);

  // Estados da lógica de Comparativo de Candidatos
  const [cargoComparativo, setCargoComparativo] = useState('Presidente'); // Cargo ativo na aba
  const [anoComparativoSelecionado, setAnoComparativoSelecionado] = useState<'2018' | '2022' | 'ambos'>('ambos');
  const [candidato1Selecionado, setCandidato1Selecionado] = useState('');
  const [candidato2Selecionado, setCandidato2Selecionado] = useState('');
  const [candidatosDisponiveis, setCandidatosDisponiveis] = useState<any[]>([]);
  const [comparativoPorLocalTabela, setComparativoPorLocalTabela] = useState<ComparativoCandidatoDataParaTabela[]>([]);
  const [municipioComparativoSelecionado, setMunicipioComparativoSelecionado] = useState('Todos os Municípios');
  const [dadosMapaComparativoCandidato, setDadosMapaComparativoCandidato] = useState<any[]>([]);

  const [paginaAtualComparativo, setPaginaAtualComparativo] = useState(1);
  const [itensPorPaginaComparativo, setItensPorPaginaComparativo] = useState(10);

  // Cargos disponíveis que serão as "abas"
  const cargosDisponiveis = ['Presidente', 'Governador', 'Senador', 'Deputado Federal', 'Deputado Estadual'];
  const anosDisponiveisComparativo = [
    { value: 'ambos', label: 'Entre 2018 e 2022' },
    { value: '2018', label: 'Apenas 2018' },
    { value: '2022', label: 'Apenas 2022' }
  ];

  const planilhasPorCargo: Record<string, { '2018': string[]; '2022': string[]; '2018_1T': string[]; '2022_1T': string[]; '2018_2T'?: string[]; '2022_2T'?: string[] }> = useMemo(() => ({
    Presidente: {
      '2018': ['presidente_2018', 'presidente_2018_2'],
      '2022': ['presidente', 'presidente_2'],
      '2018_1T': ['presidente_2018'],
      '2022_1T': ['presidente'],
      '2018_2T': ['presidente_2018_2'],
      '2022_2T': ['presidente_2'],
    },
    Governador: {
      '2018': ['governador_2018'],
      '2022': ['governador', 'governador_2'],
      '2018_1T': ['governador_2018'],
      '2022_1T': ['governador'],
      '2022_2T': ['governador_2'],
    },
    Senador: {
      '2018': ['senador_2018'],
      '2022': ['senador'],
      '2018_1T': ['senador_2018'],
      '2022_1T': ['senador'],
    },
    'Deputado Federal': {
      '2018': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'],
      '2022': ['grupo_federal1', 'grupo_federal2', 'grupo_federal3', 'deputado_federaljp'],
      '2018_1T': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'],
      '2022_1T': ['grupo_federal1', 'grupo_federal2', 'grupo_federal3', 'deputado_federaljp'],
    },
    'Deputado Estadual': {
      '2018': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'],
      '2022': ['grupo_estadual1', 'grupo_estadual2', 'grupo_estadual3', 'deputado_estadualjp'],
      '2018_1T': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'],
      '2022_1T': ['grupo_estadual1', 'grupo_estadual2', 'grupo_estadual3', 'deputado_estadualjp'],
    },
  }), []);

  const safeParseVotes = useCallback((value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/\./g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

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
    }
    return sortedOptions;
  }, []);

  // Carregamento de dados de locais (mantido no localStorage, pois é leve)
  useEffect(() => {
    const fetchLocais = async () => {
      if (locaisCarregadosRef.current) return;

      const cachedLocais = localStorage.getItem('locaisEleicao');
      const cachedVersion = localStorage.getItem('locaisEleicaoVersion');

      if (cachedLocais && cachedVersion === CACHE_VERSION_LOCAL_STORAGE) {
        setDadosLocais(JSON.parse(cachedLocais));
        locaisCarregadosRef.current = true;
        return;
      }

      try {
        const res = await fetch(`/api/sheets/eleicao/locais`);
        const json = await res.json();
        const linhas: string[][] = json.data?.slice(1) || [];

        const parsedLocais: LocalVotacaoDetalhado[] = linhas.map(linha => ({
          'Município': linha[0]?.trim(),
          'Zona Eleitoral': linha[1]?.trim(),
          'Seção Eleitoral': linha[2]?.trim(),
          'Local de Votação': linha[3]?.trim(),
          'Endereço do Local': linha[5]?.trim() || 'N/A',
          'Bairro do Local': linha[6]?.trim() || 'N/A',
          'Nome do Local': linha[4]?.trim() || 'N/A',
        }));
        setDadosLocais(parsedLocais);
        locaisCarregadosRef.current = true;

        localStorage.setItem('locaisEleicao', JSON.stringify(parsedLocais));
        localStorage.setItem('locaisEleicaoVersion', CACHE_VERSION_LOCAL_STORAGE);

      } catch (error) {
        console.error('Erro ao carregar dados da planilha de locais:', error);
      }
    };
    fetchLocais();
  }, []);

  // Função para carregar dados de planilha por ano e lista de cargos
  // Agora recebe um `cargoUnico` para focar a busca.
  const loadSheetDataByYearAndCargo = useCallback(async (year: '2018' | '2022', cargoUnico: string, signal: AbortSignal, useFirstTurnDataOnly: boolean = false) => {
    const allData: CandidatoData[] = [];
    const tempSectionDataForMetrics = new Map<string, SectionMetrics>();

    const cargoMap: Record<string, string> = {
      'presidente_2018': 'Presidente', 'presidente_2018_2': 'Presidente',
      'senador_2018': 'Senador', 'governador_2018': 'Governador', 'governador_2018_2': 'Governador',
      'grupo_federal1_2018': 'Deputado Federal', 'grupo_federal2_2018': 'Deputado Federal',
      'grupo_federal3_2018': 'Deputado Federal', 'deputado_federaljp_2018': 'Deputado Federal',
      'grupo_estadual1_2018': 'Deputado Estadual', 'grupo_estadual2_2018': 'Deputado Estadual',
      'grupo_estadual3_2018': 'Deputado Estadual', 'deputado_estadualjp_2018': 'Deputado Estadual',
      'presidente': 'Presidente', 'presidente_2': 'Presidente',
      'governador': 'Governador', 'governador_2': 'Governador',
      'senador': 'Senador',
      'grupo_federal1': 'Deputado Federal', 'grupo_federal2': 'Deputado Federal',
      'grupo_federal3': 'Deputado Federal', 'deputado_federaljp': 'Deputado Federal',
      'grupo_estadual1': 'Deputado Estadual', 'grupo_estadual2': 'Deputado Estadual',
      'grupo_estadual3': 'Deputado Estadual', 'deputado_estadualjp': 'Deputado Estadual',
    };

    let idsToFetch: string[] | undefined;
    if (useFirstTurnDataOnly) {
        idsToFetch = planilhasPorCargo[cargoUnico]?.[`${year}_1T`];
    } else {
        idsToFetch = planilhasPorCargo[cargoUnico]?.[year];
    }

    if (!idsToFetch) return { allData: [], tempSectionDataForMetrics: new Map() }; // Retorna vazio se não houver IDs

    for (const id of idsToFetch) {
      try {
        const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
        const json = await res.json();
        const linhas: string[][] = json.data?.slice(1) || [];

        const cargoDoRegistro = cargoMap[id] || 'Desconhecido';

        for (const linha of linhas) {
          const municipio = linha[0]?.trim();
          const zona = linha[1]?.trim();
          const secao = linha[2]?.trim();
          const local = linha[3]?.trim();

          const aptRow = safeParseVotes(linha[8]);
          const compRow = safeParseVotes(linha[9]);
          const abstRow = safeParseVotes(linha[10]);

          const numeroCandidato = linha[11]?.trim() || 'N/A';
          const votos = safeParseVotes(linha[13]);
          const sigla = (linha[6] || '').trim();
          const nome = (linha[12] || '').trim().toUpperCase();

          const infoLocal = dadosLocais.find(l =>
            l['Município'] === municipio &&
            l['Zona Eleitoral'] === zona &&
            l['Seção Eleitoral'] === secao &&
            l['Local de Votação'] === local
          );

          allData.push({
            'Município': municipio,
            'Zona Eleitoral': zona,
            'Seção Eleitoral': secao,
            'Local de Votação': local,
            'Endereço do Local': infoLocal?.['Endereço do Local'] || 'N/A',
            'Bairro do Local': infoLocal?.['Bairro do Local'] || 'N/A',
            'Nome do Local': infoLocal?.['Nome do Local'] || 'N/A',
            'Numero do Candidato': numeroCandidato,
            'Nome do Candidato/Voto': nome,
            'Quantidade de Votos': votos,
            'Sigla do Partido': sigla,
            Cargo: cargoDoRegistro,
          });

          const sectionKey = `${municipio}_${zona}_${secao}`;
          if (!tempSectionDataForMetrics.has(sectionKey)) {
            tempSectionDataForMetrics.set(sectionKey, {
              aptos: aptRow, comp: compRow, abst: abstRow,
              localCode: local, municipio: municipio, zona: zona, secao: secao,
            });
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`Requisição abortada para ${id} (${year})`);
        } else {
          console.error(`Erro ao carregar dados de ${id} (${year}):`, err);
        }
      }
    }
    return { allData, tempSectionDataForMetrics };
  }, [safeParseVotes, dadosLocais, planilhasPorCargo]);

  // useEffect para carregar os dados completos para o cargo comparativo selecionado
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDataForSelectedCargo = async () => {
      // Garante que dadosLocais foi carregado antes de prosseguir
      if (dadosLocais.length === 0) {
        setCarregando(true);
        return;
      }

      setCarregando(true);
      // Limpa os dados anteriores ao carregar um novo cargo
      setDados2018Completos([]);
      setDados2022Completos([]);
      setMetricasSecao2018(new Map());
      setMetricasSecao2022(new Map());
      setCandidato1Selecionado('');
      setCandidato2Selecionado('');
      setComparativoPorLocalTabela([]);
      setDadosMapaComparativoCandidato([]);

      const [data2018Result, data2022Result] = await Promise.all([
        loadSheetDataByYearAndCargo('2018', cargoComparativo, signal, false),
        loadSheetDataByYearAndCargo('2022', cargoComparativo, signal, false),
      ]);
      
      setDados2018Completos(data2018Result.allData);
      setMetricasSecao2018(data2018Result.tempSectionDataForMetrics);

      setDados2022Completos(data2022Result.allData);
      setMetricasSecao2022(data2022Result.tempSectionDataForMetrics);

      setCarregando(false);
    };

    fetchDataForSelectedCargo();

    return () => {
      controller.abort();
    };
  }, [dadosLocais, cargoComparativo, loadSheetDataByYearAndCargo, planilhasPorCargo]);


  // useEffect para processar os dados dos candidatos e gerar a tabela/mapa comparativo
  useEffect(() => {
    // Só roda se os dados completos dos anos foram carregados e não está carregando no geral.
    if (carregando || dados2018Completos.length === 0 || dados2022Completos.length === 0) {
      setCandidatosDisponiveis([]); 
      setComparativoPorLocalTabela([]);
      setDadosMapaComparativoCandidato([]);
      return;
    }

    let dadosCandidatosBase: CandidatoData[] = [];
    if (anoComparativoSelecionado === '2018') {
      dadosCandidatosBase = dados2018Completos;
    } else if (anoComparativoSelecionado === '2022') {
      dadosCandidatosBase = dados2022Completos;
    } else {
      dadosCandidatosBase = [...dados2018Completos, ...dados2022Completos];
    }

    const candidatosDoCargo = dadosCandidatosBase.filter(d =>
      d.Cargo === cargoComparativo &&
      d['Nome do Candidato/Voto'] !== 'BRANCO' &&
      d['Nome do Candidato/Voto'] !== 'NULO' &&
      d['Sigla do Partido']?.toLowerCase() !== '#nulo#' &&
      d['Nome do Candidato/Voto']?.trim().toUpperCase() !== d['Sigla do Partido']?.trim().toUpperCase()
    ).map(d => {
      let anoLabel = '';
      const is2018 = dados2018Completos.some(item =>
        item['Nome do Candidato/Voto'] === d['Nome do Candidato/Voto'] &&
        item.Cargo === d.Cargo &&
        item['Sigla do Partido'] === d['Sigla do Partido']
      );
      const is2022 = dados2022Completos.some(item =>
        item['Nome do Candidato/Voto'] === d['Nome do Candidato/Voto'] &&
        item.Cargo === d.Cargo &&
        item['Sigla do Partido'] === d['Sigla do Partido']
      );

      if (is2018 && is2022) {
        anoLabel = '2018/2022';
      } else if (is2018) {
        anoLabel = '2018';
      } else if (is2022) {
        anoLabel = '2022';
      }

      let turnoLabel = '';
      if (d.Cargo === 'Presidente' || d.Cargo === 'Governador') {
        const currentYear = anoLabel.includes('2018') ? '2018' : '2022';
        const hasSecondTurnData = planilhasPorCargo[d.Cargo]?.[`${currentYear}_2T`];

        if (d['Numero do Candidato'].length === 2 && d['Numero do Candidato'] !== '95' && d['Numero do Candidato'] !== '96') {
          turnoLabel = '(1º Turno)';
        } else if (hasSecondTurnData && d['Numero do Candidato'] !== '95' && d['Numero do Candidato'] !== '96') {
          turnoLabel = '(2º Turno)';
        }
      }
      const displayLabel = `${d['Nome do Candidato/Voto']} (${d['Sigla do Partido']}) - ${d.Cargo} ${anoLabel ? `(${anoLabel})` : ''} ${turnoLabel}`;
      return { value: `${d['Nome do Candidato/Voto']} (${d['Sigla do Partido']})_${d.Cargo}_${anoLabel}_${turnoLabel}`, label: displayLabel };
    });

    setCandidatosDisponiveis(
      Array.from(new Map(candidatosDoCargo.map(item => [item.value, item])).values())
        .sort((a, b) => a.label.localeCompare(b.label))
    );

    if (candidato1Selecionado && candidato2Selecionado) {
      const parseCandidatoString = (candidatoStr: string) => {
        const parts = candidatoStr.split(' (');
        const nomeCompleto = parts[0];
        const siglaPartidoMatch = candidatoStr.match(/\((.*?)\)/);
        const siglaPartido = siglaPartidoMatch ? siglaPartidoMatch[1] : '';
        const anoMatch = candidatoStr.match(/\((\d{4}(?:|\/\d{4}))\)/);
        const ano = anoMatch ? (anoMatch[1].includes('/') ? 'ambos' : anoMatch[1]) : '';
        const turnoMatch = candidatoStr.match(/(1º Turno|2º Turno)/);
        const turno = turnoMatch ? turnoMatch[1] : '';
        const cargoMatch = candidatoStr.match(/-\s(Presidente|Governador|Senador|Deputado Federal|Deputado Estadual)/);
        const cargo = cargoMatch ? cargoMatch[1] : '';
        return { nome: nomeCompleto.toUpperCase(), sigla: siglaPartido.toUpperCase(), ano: ano, turno: turno, cargo: cargo };
      };

      const cand1Info = parseCandidatoString(candidato1Selecionado);
      const cand2Info = parseCandidatoString(candidato2Selecionado);

      let dadosParaCand1: CandidatoData[];
      let dadosParaCand2: CandidatoData[];

      if (cand1Info.ano === '2018' || cand1Info.ano === 'ambos') {
        dadosParaCand1 = dados2018Completos;
      } else {
        dadosParaCand1 = dados2022Completos;
      }

      if (cand2Info.ano === '2022' || cand2Info.ano === 'ambos') {
        dadosParaCand2 = dados2022Completos;
      } else {
        dadosParaCand2 = dados2018Completos;
      }

      const getTurnoFilter = (turno: string) => {
        if (turno === '(1º Turno)') return (d: CandidatoData) => d['Numero do Candidato'].length === 2 && d['Numero do Candidato'] !== '95' && d['Numero do Candidato'] !== '96';
        if (turno === '(2º Turno)') return (d: CandidatoData) => d['Numero do Candidato'].length !== 2 && d['Numero do Candidato'] !== '95' && d['Numero do Candidato'] !== '96';
        return () => true;
      };

      const filterCandidatoData = (dataArray: CandidatoData[], candInfo: ReturnType<typeof parseCandidatoString>) => {
        return dataArray.filter(d =>
          d.Cargo === cargoComparativo &&
          d['Nome do Candidato/Voto'].toUpperCase() === candInfo.nome &&
          (candInfo.sigla === '' || d['Sigla do Partido'].toUpperCase() === candInfo.sigla) &&
          getTurnoFilter(candInfo.turno)(d) &&
          (municipioComparativoSelecionado === 'Todos os Municípios' || d['Município'] === municipioComparativoSelecionado)
        );
      };

      const dadosFiltradosCandidato1 = filterCandidatoData(dadosParaCand1, cand1Info);
      const dadosFiltradosCandidato2 = filterCandidatoData(dadosParaCand2, cand2Info);

      const aggregatedComparativo: { [key: string]: ComparativoCandidatoDataParaTabela } = {};
      const totalValidVotesPerSection1: { [key: string]: number } = {};
      const totalValidVotesPerSection2: { [key: string]: number } = {};

      const filterAndAggregateValidVotes = (data: CandidatoData[], targetMap: { [key: string]: number }, candInfo: ReturnType<typeof parseCandidatoString>) => {
        data.filter(d => d.Cargo === cargoComparativo &&
          (municipioComparativoSelecionado === 'Todos os Municípios' || d['Município'] === municipioComparativoSelecionado) &&
          (d['Nome do Candidato/Voto'] !== 'BRANCO' && d['Nome do Candidato/Voto'] !== 'NULO' && d['Sigla do Partido']?.toLowerCase() !== '#nulo#') &&
          getTurnoFilter(candInfo.turno)(d)
        )
          .forEach(item => {
            const sectionKey = `${item['Município']}_${item['Zona Eleitoral']}_${item['Seção Eleitoral']}`;
            targetMap[sectionKey] = (targetMap[sectionKey] || 0) + item['Quantidade de Votos'];
          });
      };

      filterAndAggregateValidVotes(dadosParaCand1, totalValidVotesPerSection1, cand1Info);
      filterAndAggregateValidVotes(dadosParaCand2, totalValidVotesPerSection2, cand2Info);

      dadosFiltradosCandidato1.forEach(item => {
        const sectionKey = `${item['Município']}_${item['Zona Eleitoral']}_${item['Seção Eleitoral']}`;
        const infoLocal = dadosLocais.find(l =>
          l['Município'] === item['Município'] &&
          l['Zona Eleitoral'] === item['Zona Eleitoral'] &&
          l['Seção Eleitoral'] === item['Seção Eleitoral'] &&
          l['Local de Votação'] === item['Local de Votação']
        );

        if (!aggregatedComparativo[sectionKey]) {
          aggregatedComparativo[sectionKey] = {
            municipio: item['Município'],
            zona: item['Zona Eleitoral'],
            secao: item['Seção Eleitoral'],
            localNome: infoLocal?.['Nome do Local'] || 'N/A',
            localEndereco: infoLocal?.['Endereço do Local'] || 'N/A',
            localBairro: infoLocal?.['Bairro do Local'] || 'N/A',
            totalVotos2018: 0,
            totalVotos2022: 0,
            porcentagem2018: 0,
            porcentagem2022: 0,
            variacaoVotos: 0,
            variacaoPorcentagem: 0,
          };
        }
        aggregatedComparativo[sectionKey].totalVotos2018 += item['Quantidade de Votos'];
      });

      dadosFiltradosCandidato2.forEach(item => {
        const sectionKey = `${item['Município']}_${item['Zona Eleitoral']}_${item['Seção Eleitoral']}`;
        const infoLocal = dadosLocais.find(l =>
          l['Município'] === item['Município'] &&
          l['Zona Eleitoral'] === item['Zona Eleitoral'] &&
          l['Seção Eleitoral'] === item['Seção Eleitoral'] &&
          l['Local de Votação'] === item['Local de Votação']
        );

        if (!aggregatedComparativo[sectionKey]) {
          aggregatedComparativo[sectionKey] = {
            municipio: item['Município'],
            zona: item['Zona Eleitoral'],
            secao: item['Seção Eleitoral'],
            localNome: infoLocal?.['Nome do Local'] || 'N/A',
            localEndereco: infoLocal?.['Endereço do Local'] || 'N/A',
            localBairro: infoLocal?.['Bairro do Local'] || 'N/A',
            totalVotos2018: 0,
            totalVotos2022: 0,
            porcentagem2018: 0,
            porcentagem2022: 0,
            variacaoVotos: 0,
            variacaoPorcentagem: 0,
          };
        }
        aggregatedComparativo[sectionKey].totalVotos2022 += item['Quantidade de Votos'];
      });


      const finalComparativoParaTabela: ComparativoCandidatoDataParaTabela[] = Object.values(aggregatedComparativo).map(item => {
        const sectionKey = `${item.municipio}_${item.zona}_${item.secao}`;
        const totalValidosSecao1 = totalValidVotesPerSection1[sectionKey] || 0;
        const totalValidosSecao2 = totalValidVotesPerSection2[sectionKey] || 0;

        item.porcentagem2018 = totalValidosSecao1 > 0 ? (item.totalVotos2018 / totalValidosSecao1) * 100 : 0;
        item.porcentagem2022 = totalValidosSecao2 > 0 ? (item.totalVotos2022 / totalValidosSecao2) * 100 : 0;

        item.variacaoVotos = item.totalVotos2022 - item.totalVotos2018;
        item.variacaoPorcentagem = item.porcentagem2022 - item.porcentagem2018;
        return item;
      }).sort((a, b) => a.municipio.localeCompare(b.municipio) || a.zona.localeCompare(b.zona) || a.secao.localeCompare(b.secao));

      setComparativoPorLocalTabela(finalComparativoParaTabela);
      setPaginaAtualComparativo(1);

      const municipiosUnicosNaParaiba = getUniqueOptions(dadosLocais, 'Município');
      const aggregatedDataForCandidateMap: { [key: string]: { totalVotosCandidato1: number, totalVotosCandidato2: number, totalValidosMunicipio1: number, totalValidosMunicipio2: number } } = {};

      municipiosUnicosNaParaiba.forEach(mun => {
        aggregatedDataForCandidateMap[mun] = {
          totalVotosCandidato1: 0,
          totalVotosCandidato2: 0,
          totalValidosMunicipio1: 0,
          totalValidosMunicipio2: 0,
        };
      });

      dadosFiltradosCandidato1.forEach(item => {
        if (aggregatedDataForCandidateMap[item['Município']]) {
          aggregatedDataForCandidateMap[item['Município']].totalVotosCandidato1 += item['Quantidade de Votos'];
        }
      });
      dadosFiltradosCandidato2.forEach(item => {
        if (aggregatedDataForCandidateMap[item['Município']]) {
          aggregatedDataForCandidateMap[item['Município']].totalVotosCandidato2 += item['Quantidade de Votos'];
        }
      });

      dadosParaCand1.filter(d =>
        d.Cargo === cargoComparativo &&
        (d['Nome do Candidato/Voto'] !== 'BRANCO' && d['Nome do Candidato/Voto'] !== 'NULO' && d['Sigla do Partido']?.toLowerCase() !== '#nulo#')
      ).forEach(item => {
        if (aggregatedDataForCandidateMap[item['Município']]) {
          aggregatedDataForCandidateMap[item['Município']].totalValidosMunicipio1 += item['Quantidade de Votos'];
        }
      });

      dadosParaCand2.filter(d =>
        d.Cargo === cargoComparativo &&
        (d['Nome do Candidato/Voto'] !== 'BRANCO' && d['Nome do Candidato/Voto'] !== 'NULO' && d['Sigla do Partido']?.toLowerCase() !== '#nulo#')
      ).forEach(item => {
        if (aggregatedDataForCandidateMap[item['Município']]) {
          aggregatedDataForCandidateMap[item['Município']].totalValidosMunicipio2 += item['Quantidade de Votos'];
        }
      });


      const finalMapDataCandidato = municipiosUnicosNaParaiba.map(mun => {
        const munData = aggregatedDataForCandidateMap[mun];

        const porcentagemCandidato1 = munData.totalValidosMunicipio1 > 0 ? (munData.totalVotosCandidato1 / munData.totalValidosMunicipio1) * 100 : 0;
        const porcentagemCandidato2 = munData.totalValidosMunicipio2 > 0 ? (munData.totalVotosCandidato2 / munData.totalValidosMunicipio2) * 100 : 0;

        const percentageChange = porcentagemCandidato2 - porcentagemCandidato1;

        let color = '#CCCCCC';
        const red = [255, 0, 0];
        const yellow = [255, 255, 0];
        const green = [0, 128, 0];
        const minRange = -20;
        const maxRange = 20;

        if (percentageChange < 0) {
          color = interpolateColor(percentageChange, minRange, 0, red, yellow);
        } else if (percentageChange > 0) {
          color = interpolateColor(percentageChange, 0, maxRange, yellow, green);
        } else {
          color = 'rgb(255, 255, 150)';
        }

        return {
          name: mun,
          value2018: munData.totalVotosCandidato1,
          value2022: munData.totalVotosCandidato2,
          percentageChange: percentageChange,
          color: color,
          infoContent: `Votos ${cand1Info.nome} (${cand1Info.ano === 'ambos' ? '2018' : cand1Info.ano} ${cand1Info.turno}): ${munData.totalVotosCandidato1.toLocaleString('pt-BR')} (${porcentagemCandidato1.toFixed(2)}%)<br/>Votos ${cand2Info.nome} (${cand2Info.ano === 'ambos' ? '2022' : cand2Info.ano} ${cand2Info.turno}): ${munData.totalVotosCandidato2.toLocaleString('pt-BR')} (${porcentagemCandidato2.toFixed(2)}%)<br/>Variação %: ${percentageChange.toFixed(2)} p.p.`,
        };
      }).filter(m => m.value2018 !== undefined || m.value2022 !== undefined);

      setDadosMapaComparativoCandidato(finalMapDataCandidato);
    } else {
      setComparativoPorLocalTabela([]);
      setDadosMapaComparativoCandidato([]);
    }

  }, [carregando, dados2018Completos, dados2022Completos, cargoComparativo, anoComparativoSelecionado, candidato1Selecionado, candidato2Selecionado, municipioComparativoSelecionado, getUniqueOptions, dadosLocais, planilhasPorCargo]);

  const setPaginaAtualParaTabela = useCallback((pagina: number) => {
    setPaginaAtualComparativo(pagina);
  }, []);

  const totalPaginasComparativo = Math.ceil(
    useMemo(() => {
      const uniqueMunicipios = new Set<string>();
      comparativoPorLocalTabela.forEach(item => {
        uniqueMunicipios.add(item.municipio);
      });
      return uniqueMunicipios.size;
    }, [comparativoPorLocalTabela]) / itensPorPaginaComparativo
  );


  const irParaProximaPaginaComparativo = useCallback(() => {
    setPaginaAtualComparativo(prev => Math.min(prev + 1, totalPaginasComparativo));
  }, [totalPaginasComparativo]);

  const irParaPaginaAnteriorComparativo = useCallback(() => {
    setPaginaAtualComparativo(prev => Math.max(prev - 1, 1));
  }, []);

  const handleCargoComparativoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCargoComparativo(e.target.value);
    setAnoComparativoSelecionado('ambos');
    setCandidato1Selecionado(''); // Resetar seleção de candidatos ao mudar o cargo
    setCandidato2Selecionado('');
    setMunicipioComparativoSelecionado('Todos os Municípios');
    setPaginaAtualComparativo(1);
  }, []);

  const handleAnoComparativoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnoComparativoSelecionado(e.target.value as '2018' | '2022' | 'ambos');
    setCandidato1Selecionado(''); // Resetar seleção de candidatos ao mudar o ano
    setCandidato2Selecionado('');
    setMunicipioComparativoSelecionado('Todos os Municípios');
    setPaginaAtualComparativo(1);
  }, []);

  const handleMunicipioComparativoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMunicipioComparativoSelecionado(e.target.value);
    setPaginaAtualComparativo(1);
  }, []);

  const municipiosDisponiveisParaFiltro = useMemo(() => {
    return getUniqueOptions(dadosLocais, 'Município').map(mun => ({ value: mun, label: mun }));
  }, [dadosLocais, getUniqueOptions]);

  const cargosParaDropdown = useMemo(() => {
    return cargosDisponiveis.map(cargo => ({ value: cargo, label: cargo }));
  }, [cargosDisponiveis]);

  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto" style={{ zoom: '80%' }}>
          <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-black font-medium">Painel</span> /
              <span className="text-gray-400"> Comparativo de Cargos</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Comparativo Eleitoral por Cargo</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
              {cargosDisponiveis.map((cargo) => (
                <button
                  key={cargo}
                  onClick={() => setCargoComparativo(cargo)}
                  className={`pb-2 text-base font-medium transition-colors cursor-pointer ${
                    cargoComparativo === cargo
                      ? 'border-b-2 border-blue-900 text-blue-900'
                      : 'text-gray-700 hover:text-blue-900'
                  }`}
                >
                  {cargo}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-10">
            {carregando ? (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                <svg className="animate-spin h-8 w-8 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-semibold mt-4">Carregando dados para {cargoComparativo}...</p>
                <p className="text-sm mt-2">Isso pode levar alguns instantes.</p>
              </div>
            ) : (
              <>
                <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros para Comparativo de Candidatos ({cargoComparativo})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FiltroDropdown
                      id="cargo-comparativo"
                      label="Cargo"
                      value={cargoComparativo}
                      options={cargosParaDropdown}
                      onChange={handleCargoComparativoChange}
                      disabled={carregando}
                    />
                    <FiltroDropdown
                      id="ano-comparativo"
                      label="Ano da Comparação"
                      value={anoComparativoSelecionado}
                      options={anosDisponiveisComparativo}
                      onChange={handleAnoComparativoChange}
                      disabled={carregando}
                    />
                    <FiltroDropdown
                      id="candidato-1"
                      label="Candidato 1"
                      value={candidato1Selecionado}
                      options={candidatosDisponiveis}
                      onChange={(e) => setCandidato1Selecionado(e.target.value)}
                      disabled={carregando || candidatosDisponiveis.length === 0}
                      placeholder="Selecione o primeiro candidato"
                    />
                    <FiltroDropdown
                      id="candidato-2"
                      label="Candidato 2"
                      value={candidato2Selecionado}
                      options={candidatosDisponiveis}
                      onChange={(e) => setCandidato2Selecionado(e.target.value)}
                      disabled={carregando || candidatosDisponiveis.length === 0}
                      placeholder="Selecione o segundo candidato"
                    />
                    <div className="md:col-span-2 lg:col-span-1">
                      <FiltroDropdown
                        id="municipio-comparativo"
                        label="Filtrar por Município (Tabela e Mapa)"
                        value={municipioComparativoSelecionado}
                        options={[{ value: 'Todos os Municípios', label: 'Todos os Municípios' }, ...municipiosDisponiveisParaFiltro]}
                        onChange={handleMunicipioComparativoChange}
                        disabled={carregando}
                      />
                    </div>
                  </div>
                </div>

                {(candidato1Selecionado && candidato2Selecionado) ? (
                  <>
                    <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Variação de Votos dos Candidatos no Mapa por Município</h3>
                      <MapaVariacaoParaiba
                        dadosMunicipios={dadosMapaComparativoCandidato}
                        isLoading={carregando}
                        tituloLoading="Carregando mapa de variação dos candidatos..."
                      />
                    </div>

                    <TabelaComparativoCandidatos
                      data={comparativoPorLocalTabela}
                      nomeCandidato1={candidato1Selecionado.split(' (')[0]}
                      nomeCandidato2={candidato2Selecionado.split(' (')[0]}
                      isLoading={carregando}
                      paginaAtual={paginaAtualComparativo}
                      totalPaginas={totalPaginasComparativo}
                      irParaProximaPagina={irParaProximaPaginaComparativo}
                      irParaPaginaAnterior={irParaPaginaAnteriorComparativo}
                      itensPorPagina={itensPorPaginaComparativo}
                      setItensPorPagina={setItensPorPaginaComparativo}
                      setPaginaAtual={setPaginaAtualParaTabela}
                    />
                  </>
                ) : (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                    Selecione dois candidatos para ver o comparativo detalhado.
                  </div>
                )}

                {(candidato1Selecionado || candidato2Selecionado) && comparativoPorLocalTabela.length === 0 && !carregando && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                    Não foram encontrados dados comparativos para os candidatos e filtros selecionados.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
