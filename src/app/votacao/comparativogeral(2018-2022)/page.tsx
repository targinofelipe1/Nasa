// pages/painel-analise-eleitoral/index.tsx
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import GraficoLinhaComparativo from '@/components/ui/GraficoLinhaComparativo';
import MapaVariacaoParaiba from '@/components/ui/MapaVariacaoParaiba';
import FiltroDropdown from '@/components/ui/FiltroDropdown';

interface CandidatoData {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Endereço do Local': string;
  'Bairro do Local': string;
  'Nome do Local': string;
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

interface DadosMetricasComuns {
  eleitoresAptos: number;
  totalComparecimentos: number;
  totalAbstencoes: number;
  taxaAbstencao: number;
  votosValidos: number;
  votosBrancos: number;
  votosNulos: number;
  locais?: number;
  secoes?: number;
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

export default function PainelAnaliseEleitoral() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral Comparativa');
  const [carregando, setCarregando] = useState(true);

  const [dados2018Completos, setDados2018Completos] = useState<CandidatoData[]>([]);
  const [dados2022Completos, setDados2022Completos] = useState<CandidatoData[]>([]);
  const [metricasSecao2018, setMetricasSecao2018] = useState<Map<string, SectionMetrics>>(new Map());
  const [metricasSecao2022, setMetricasSecao2022] = useState<Map<string, SectionMetrics>>(new Map());
  const [dadosLocais, setDadosLocais] = useState<LocalVotacaoDetalhado[]>([]);
  const locaisCarregadosRef = useRef(false);

  const [dadosGerais2018, setDadosGerais2018] = useState<DadosMetricasComuns>({
    eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
    votosValidos: 0, votosBrancos: 0, votosNulos: 0,
  });
  const [dadosGerais2022, setDadosGerais2022] = useState<DadosMetricasComuns>({
    eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
    votosValidos: 0, votosBrancos: 0, votosNulos: 0,
  });
  const [dadosMapaVisaoGeral, setDadosMapaVisaoGeral] = useState<any[]>([]);
  const [tipoMetricaMapa, setTipoMetricaMapa] = useState<'variacao-votos-validos' | 'variacao-abstencao' | 'variacao-comparecimento'>('variacao-votos-validos');
  
  const cargosDisponiveisGeral = useMemo(() => [
    { value: 'Presidente 1T', label: 'Presidente (1º Turno)' },
    { value: 'Presidente 2T', label: 'Presidente (2º Turno)' },
    { value: 'Governador 1T', label: 'Governador (1º Turno)' },
    { value: 'Senador', label: 'Senador' },
    { value: 'Deputado Federal', label: 'Deputado Federal' },
    { value: 'Deputado Estadual', label: 'Deputado Estadual' },
  ], []);

  // Define o estado inicial para "Presidente 1T"
  const [cargoVisaoGeral, setCargoVisaoGeral] = useState('Presidente 1T');
  const [municipioVisaoGeral, setMunicipioVisaoGeral] = useState('Todos os Municípios');

  const abas = ['Visão Geral Comparativa'];

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
      '2018_2T': [], 
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

  const loadSheetDataByYearAndBaseCargoAndTurn = useCallback(async (year: '2018' | '2022', selectedCargoFilterValue: string, signal: AbortSignal) => {
    const allData: CandidatoData[] = [];
    const tempSectionDataForMetrics = new Map<string, SectionMetrics>();

    let baseCargo: string | 'Todos os Cargos' = selectedCargoFilterValue;
    let turnFilter: '1T' | '2T' = '1T'; 

    if (selectedCargoFilterValue.includes(' 1T')) {
      baseCargo = selectedCargoFilterValue.replace(' 1T', '');
      turnFilter = '1T';
    } else if (selectedCargoFilterValue.includes(' 2T')) {
      baseCargo = selectedCargoFilterValue.replace(' 2T', '');
      turnFilter = '2T';
    }

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

    let idsToFetchForCandidates: string[] = []; 

    if (baseCargo === 'Todos os Cargos') {
        // Se "Todos os Cargos" está selecionado, carregue dados apenas do PRIMEIRO TURNO de todos os cargos
        for (const cargoKey in planilhasPorCargo) {
            if (planilhasPorCargo.hasOwnProperty(cargoKey)) {
                const cargoInfo = planilhasPorCargo[cargoKey as keyof typeof planilhasPorCargo];
                // Inclui 1º turno para Presidente/Governador
                if (cargoInfo[`${year}_1T`]) {
                    idsToFetchForCandidates.push(...(cargoInfo[`${year}_1T`] || []));
                }
                // Inclui cargos sem distinção de turno (Senador, Deputados)
                else if (cargoInfo[year as '2018' | '2022']) {
                    idsToFetchForCandidates.push(...(cargoInfo[year as '2018' | '2022'] || []));
                }
            }
        }
    } else {
        // Lógica existente para carregar um cargo específico (incluindo 2º turno se aplicável)
        if (baseCargo === 'Presidente' || baseCargo === 'Governador') {
            if (turnFilter === '1T') {
                idsToFetchForCandidates = planilhasPorCargo[baseCargo]?.[`${year}_1T`] || [];
            } else if (turnFilter === '2T') {
                idsToFetchForCandidates = planilhasPorCargo[baseCargo]?.[`${year}_2T`] || [];
            }
        } else {
            idsToFetchForCandidates = planilhasPorCargo[baseCargo]?.[year] || [];
        }
    }
    
    // O ID da planilha de métricas sempre será do 1º turno de Presidente para garantir consistência
    const metricSheetId = year === '2018' ? 'presidente_2018' : 'presidente';

    try {
      const res = await fetch(`/api/sheets/eleicao/${metricSheetId}`, { signal });
      const json = await res.json();
      const linhas: string[][] = json.data?.slice(1) || [];
      
      for (const linha of linhas) {
        const municipio = linha[0]?.trim();
        const zona = linha[1]?.trim();
        const secao = linha[2]?.trim();
        const local = linha[3]?.trim();

        const aptRow = safeParseVotes(linha[8]);
        const compRow = safeParseVotes(linha[9]);
        const abstRow = safeParseVotes(linha[10]);

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
        console.warn(`Requisição de métricas abortada para ${metricSheetId} (${year})`);
      } else {
        console.error(`Erro ao carregar dados de métricas de ${metricSheetId} (${year}):`, err);
      }
    }

    if (idsToFetchForCandidates.length > 0) {
      for (const id of idsToFetchForCandidates) {
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
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.warn(`Requisição abortada para ${id} (${year})`);
          } else {
            console.error(`Erro ao carregar dados de ${id} (${year}):`, err);
          }
        }
      }
    }

    return { allData, tempSectionDataForMetrics };
  }, [safeParseVotes, dadosLocais, planilhasPorCargo]);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      // Garante que dadosLocais foram carregados antes de tentar carregar dados de candidatos/métricas
      if (dadosLocais.length === 0) {
        setCarregando(true);
        // Resetar estados para evitar o uso de dados incompletos ou antigos
        setDados2018Completos([]);
        setDados2022Completos([]);
        setMetricasSecao2018(new Map());
        setMetricasSecao2022(new Map());
        setDadosGerais2018({
          eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
          votosValidos: 0, votosBrancos: 0, votosNulos: 0,
        });
        setDadosGerais2022({
          eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
          votosValidos: 0, votosBrancos: 0, votosNulos: 0,
        });
        setDadosMapaVisaoGeral([]);
        return;
      }

      setCarregando(true);

      let data2018Result: { allData: CandidatoData[], tempSectionDataForMetrics: Map<string, SectionMetrics> };
      let data2022Result: { allData: CandidatoData[], tempSectionDataForMetrics: Map<string, SectionMetrics> };

      // Sempre carrega os dados com base no cargoVisaoGeral (que agora tem "Presidente 1T" como padrão)
      [data2018Result, data2022Result] = await Promise.all([
        loadSheetDataByYearAndBaseCargoAndTurn('2018', cargoVisaoGeral, signal),
        loadSheetDataByYearAndBaseCargoAndTurn('2022', cargoVisaoGeral, signal),
      ]);
      
      setDados2018Completos(data2018Result.allData);
      setMetricasSecao2018(data2018Result.tempSectionDataForMetrics);

      setDados2022Completos(data2022Result.allData);
      setMetricasSecao2022(data2022Result.tempSectionDataForMetrics);

      setCarregando(false);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [dadosLocais, loadSheetDataByYearAndBaseCargoAndTurn, cargoVisaoGeral]);


  useEffect(() => {
    // Só prossegue com os cálculos se não estiver carregando e houver dados de candidatos
    if (carregando || dados2018Completos.length === 0 || dados2022Completos.length === 0 || dadosLocais.length === 0) {
      setDadosGerais2018({
        eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
        votosValidos: 0, votosBrancos: 0, votosNulos: 0,
      });
      setDadosGerais2022({
        eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
        votosValidos: 0, votosBrancos: 0, votosNulos: 0,
      });
      setDadosMapaVisaoGeral([]);
      return;
    }

    const getBaseCargoFromFilterValue = (filterValue: string) => {
      if (filterValue.includes(' 1T')) return filterValue.replace(' 1T', '');
      if (filterValue.includes(' 2T')) return filterValue.replace(' 2T', '');
      return filterValue;
    };

    const currentBaseCargo = getBaseCargoFromFilterValue(cargoVisaoGeral);

    // Filtra os dados de candidatos/votos com base no cargo selecionado,
    // ou inclui todos se "Todos os Cargos" estiver selecionado.
    const dadosCargo2018Filtrado = cargoVisaoGeral === 'Todos os Cargos' ?
        dados2018Completos.filter(d => (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral)) :
        dados2018Completos.filter(d => d.Cargo === currentBaseCargo && (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral));
    
    const dadosCargo2022Filtrado = cargoVisaoGeral === 'Todos os Cargos' ?
        dados2022Completos.filter(d => (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral)) :
        dados2022Completos.filter(d => d.Cargo === currentBaseCargo && (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral));


    // CÁLCULO PARA DADOS GERAIS (Aptos, Comparecimentos, Abstenções) - SEMPRE DO total da Paraíba OU do Município selecionado
    // Estes cálculos são feitos com base em 'metricasSecao', que são populadas de uma planilha base
    // independentemente do cargo de votos, garantindo que sempre haja dados para eles.
    let aptos2018 = 0, comp2018 = 0, abst2018 = 0;
    const uniqueLocals2018 = new Set<string>();
    const uniqueSecoes2018 = new Set<string>();

    metricasSecao2018.forEach(metric => {
      if (metric.municipio === municipioVisaoGeral || municipioVisaoGeral === 'Todos os Municípios') {
        aptos2018 += metric.aptos;
        comp2018 += metric.comp;
        abst2018 += metric.abst;
        uniqueLocals2018.add(metric.localCode);
        uniqueSecoes2018.add(`${metric.municipio}_${metric.zona}_${metric.secao}`);
      }
    });

    let validos2018 = 0, brancos2018 = 0, nulos2018 = 0;
    dadosCargo2018Filtrado.forEach(item => { // Usa os dados FILTRADOS DE CARGO para votos
      const nome = item['Nome do Candidato/Voto']?.toUpperCase();
      const sigla = item['Sigla do Partido']?.toLowerCase();
      if (nome === 'BRANCO') {
        brancos2018 += item['Quantidade de Votos'];
      } else if (nome === 'NULO' || sigla === '#nulo#') {
        nulos2018 += item['Quantidade de Votos'];
      }
      else {
        validos2018 += item['Quantidade de Votos'];
      }
    });
    setDadosGerais2018({
      eleitoresAptos: aptos2018, totalComparecimentos: comp2018, totalAbstencoes: abst2018,
      taxaAbstencao: aptos2018 > 0 ? (abst2018 / aptos2018) * 100 : 0,
      locais: uniqueLocals2018.size, secoes: uniqueSecoes2018.size,
      votosValidos: validos2018, votosBrancos: brancos2018, votosNulos: nulos2018,
    });

    let aptos2022 = 0, comp2022 = 0, abst2022 = 0;
    const uniqueLocals2022 = new Set<string>();
    const uniqueSecoes2022 = new Set<string>();

    metricasSecao2022.forEach(metric => {
      if (metric.municipio === municipioVisaoGeral || municipioVisaoGeral === 'Todos os Municípios') {
        aptos2022 += metric.aptos;
        comp2022 += metric.comp;
        abst2022 += metric.abst;
        uniqueLocals2022.add(metric.localCode);
        uniqueSecoes2022.add(`${metric.municipio}_${metric.zona}_${metric.secao}`);
      }
    });

    let validos2022 = 0, brancos2022 = 0, nulos2022 = 0;
    dadosCargo2022Filtrado.forEach(item => { // Usa os dados FILTRADOS DE CARGO para votos
      const nome = item['Nome do Candidato/Voto']?.toUpperCase();
      const sigla = item['Sigla do Partido']?.toLowerCase();
      if (nome === 'BRANCO') {
        brancos2022 += item['Quantidade de Votos'];
      } else if (nome === 'NULO' || sigla === '#nulo#') {
        nulos2022 += item['Quantidade de Votos'];
      }
      else {
        validos2022 += item['Quantidade de Votos'];
      }
    });
    setDadosGerais2022({
      eleitoresAptos: aptos2022, totalComparecimentos: comp2022, totalAbstencoes: abst2022,
      taxaAbstencao: aptos2022 > 0 ? (abst2022 / aptos2022) * 100 : 0,
      locais: uniqueLocals2022.size, secoes: uniqueSecoes2022.size,
      votosValidos: validos2022, votosBrancos: brancos2022, votosNulos: nulos2022,
    });

    // CÁLCULO PARA O MAPA
    const municipiosUnicosNaParaiba = getUniqueOptions(dadosLocais, 'Município');
    const aggregatedDataForMap: { [key: string]: { totalValidos2018: number, totalValidos2022: number, aptos2018: number, aptos2022: number, abst2018: number, abst2022: number, comp2018: number, comp2022: number } } = {};

    municipiosUnicosNaParaiba.forEach(mun => {
      aggregatedDataForMap[mun] = {
        totalValidos2018: 0, totalValidos2022: 0,
        aptos2018: 0, aptos2022: 0,
        abst2018: 0, abst2022: 0,
        comp2018: 0, comp2022: 0,
      };
    });
    
    // Agrega dados de votos para o mapa
    const mapFilter2018 = cargoVisaoGeral === 'Todos os Cargos' ? dados2018Completos : dados2018Completos.filter(d => d.Cargo === currentBaseCargo);
    const mapFilter2022 = cargoVisaoGeral === 'Todos os Cargos' ? dados2022Completos : dados2022Completos.filter(d => d.Cargo === currentBaseCargo);

    mapFilter2018.forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        // Soma votos se não forem BRANCO ou NULO
        if (aggregatedDataForMap[item['Município']] && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#nulo#') {
            aggregatedDataForMap[item['Município']].totalValidos2018 += item['Quantidade de Votos'];
        }
    });
    mapFilter2022.forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        // Soma votos se não forem BRANCO ou NULO
        if (aggregatedDataForMap[item['Município']] && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#nulo#') {
            aggregatedDataForMap[item['Município']].totalValidos2022 += item['Quantidade de Votos'];
        }
    });

    metricasSecao2018.forEach(metric => {
      if (aggregatedDataForMap[metric.municipio]) {
        aggregatedDataForMap[metric.municipio].aptos2018 += metric.aptos;
        aggregatedDataForMap[metric.municipio].abst2018 += metric.abst;
        aggregatedDataForMap[metric.municipio].comp2018 += metric.comp;
      }
    });
    metricasSecao2022.forEach(metric => {
      if (aggregatedDataForMap[metric.municipio]) {
        aggregatedDataForMap[metric.municipio].aptos2022 += metric.aptos;
        aggregatedDataForMap[metric.municipio].abst2022 += metric.abst;
        aggregatedDataForMap[metric.municipio].comp2022 += metric.comp;
      }
    });

    const mapData = municipiosUnicosNaParaiba.map(mun => {
      const data = aggregatedDataForMap[mun];
      const value2018 = data?.totalValidos2018 || 0;
      const value2022 = data?.totalValidos2022 || 0;

      const aptos2018_map = data?.aptos2018 || 0;
      const aptos2022_map = data?.aptos2022 || 0;
      const abst2018_map = data?.abst2018 || 0;
      const abst2022_map = data?.abst2022 || 0;
      const comp2018_map = data?.comp2018 || 0;
      const comp2022_map = data?.comp2022 || 0;

      let percentageChange: number = 0;
      let infoContent: string = '';

      switch (tipoMetricaMapa) {
        case 'variacao-votos-validos':
          if (value2018 > 0) {
            percentageChange = ((value2022 - value2018) / value2018) * 100;
          } else if (value2022 > 0) {
            percentageChange = 100; // Se 2018 for zero e 2022 for maior que zero, é um aumento de 100% ou mais
          } else {
            percentageChange = 0;
          }
          infoContent = `Votos Válidos 2018: ${value2018.toLocaleString('pt-BR')}<br/>Votos Válidos 2022: ${value2022.toLocaleString('pt-BR')}<br/>Variação: ${percentageChange.toFixed(2)}%`;
          break;
        case 'variacao-abstencao':
          const abstPct2018 = aptos2018_map > 0 ? (abst2018_map / aptos2018_map) * 100 : 0;
          const abstPct2022 = aptos2022_map > 0 ? (abst2022_map / aptos2022_map) * 100 : 0;
          percentageChange = abstPct2022 - abstPct2018; // Variação em pontos percentuais
          infoContent = `Abstenção 2018: ${abstPct2018.toFixed(2)}%<br/>Abstenção 2022: ${abstPct2022.toFixed(2)}%<br/>Variação: ${percentageChange.toFixed(2)} p.p.`;
          break;
        case 'variacao-comparecimento':
          const compPct2018 = aptos2018_map > 0 ? (comp2018_map / aptos2018_map) * 100 : 0;
          const compPct2022 = aptos2022_map > 0 ? (comp2022_map / aptos2022_map) * 100 : 0;
          percentageChange = compPct2022 - compPct2018; // Variação em pontos percentuais
          infoContent = `Comparecimento 2018: ${compPct2018.toFixed(2)}%<br/>Comparecimento 2022: ${compPct2022.toFixed(2)}%<br/>Variação: ${percentageChange.toFixed(2)} p.p.`;
          break;
      }

      let color = '#CCCCCC';

      const red = [255, 0, 0]; // Perda ou aumento de abstenção/queda de comparecimento
      const yellow = [255, 255, 0]; // Estabilidade
      const green = [0, 128, 0]; // Ganho ou queda de abstenção/aumento de comparecimento

      let minRange = -20;
      let maxRange = 20;

      if (tipoMetricaMapa === 'variacao-abstencao' || tipoMetricaMapa === 'variacao-comparecimento') {
        minRange = -10;
        maxRange = 10;
      }

      if (percentageChange < 0) {
        color = interpolateColor(percentageChange, minRange, 0, red, yellow);
      } else if (percentageChange > 0) {
        color = interpolateColor(percentageChange, 0, maxRange, yellow, green);
      } else {
        color = 'rgb(255, 255, 150)'; // Amarelo claro para variação zero
      }

      return {
        name: mun,
        value2018: value2018,
        value2022: value2022,
        percentageChange: percentageChange,
        color: color,
        infoContent: infoContent,
      };
    }).filter(m => m.value2018 !== undefined || m.value2022 !== undefined); // Filtra municípios sem dados válidos para o mapa

    setDadosMapaVisaoGeral(mapData);

  }, [carregando, dados2018Completos, dados2022Completos, metricasSecao2018, metricasSecao2022, getUniqueOptions, dadosLocais, cargoVisaoGeral, municipioVisaoGeral, tipoMetricaMapa]);


  const handleMunicipioVisaoGeralChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMunicipioVisaoGeral(e.target.value);
  }, []);

  const handleCargoVisaoGeralChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setCargoVisaoGeral(selectedValue);
    setMunicipioVisaoGeral('Todos os Municípios'); // Reinicia o município ao trocar o cargo
    setTipoMetricaMapa('variacao-votos-validos'); // Reinicia a métrica do mapa
  }, []);

  const municipiosDisponiveisParaFiltro = useMemo(() => {
    return getUniqueOptions(dadosLocais, 'Município').map(mun => ({ value: mun, label: mun }));
  }, [dadosLocais, getUniqueOptions]);

  const cargosParaDropdown = useMemo(() => {
    return cargosDisponiveisGeral.map(cargo => ({ value: cargo.value, label: cargo.label }));
  }, [cargosDisponiveisGeral]);


  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto" style={{ zoom: '80%' }}>
          <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-black font-medium">Painel</span> /
              <span className="text-gray-400"> Análise Eleitoral</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel de Análise Eleitoral</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
              {abas.map((aba) => (
                <button
                  key={aba}
                  onClick={() => {
                    setAbaAtiva(aba);
                    // Resetar tudo para o estado inicial da visão geral: "Presidente 1T"
                    setCargoVisaoGeral('Presidente 1T'); 
                    setMunicipioVisaoGeral('Todos os Municípios');
                    setTipoMetricaMapa('variacao-votos-validos');
                  }}
                  className={`pb-2 text-base font-medium transition-colors cursor-pointer ${
                    abaAtiva === aba
                      ? 'border-b-2 border-blue-900 text-blue-900'
                      : 'text-gray-700 hover:text-blue-900'
                  }`}
                >
                  {aba}
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
                <p className="text-xl font-semibold mt-4">Carregando dados...</p>
                <p className="text-sm mt-2">Isso pode levar alguns instantes.</p>
              </div>
            ) : (
              <>
                {abaAtiva === 'Visão Geral Comparativa' && (
                  <>
                    <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros para Visão Geral</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FiltroDropdown
                          id="cargo-visao-geral"
                          label="Cargo"
                          value={cargoVisaoGeral}
                          options={cargosParaDropdown}
                          onChange={handleCargoVisaoGeralChange}
                          disabled={carregando}
                        />
                        <FiltroDropdown
                          id="municipio-visao-geral"
                          label="Município"
                          value={municipioVisaoGeral}
                          options={[{ value: 'Todos os Municípios', label: 'Todos os Municípios' }, ...municipiosDisponiveisParaFiltro]}
                          onChange={handleMunicipioVisaoGeralChange}
                          disabled={carregando}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GraficoLinhaComparativo
                        titulo="Eleitores Aptos"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.eleitoresAptos}
                        valor2022={dadosGerais2022.eleitoresAptos}
                        isLoading={carregando}
                        unidade=" eleitores"
                        height="400px"
                      />
                      <GraficoLinhaComparativo
                        titulo="Total de Comparecimentos"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.totalComparecimentos}
                        valor2022={dadosGerais2022.totalComparecimentos}
                        isLoading={carregando}
                        unidade=" comparecimentos"
                        height="400px"
                      />
                      <GraficoLinhaComparativo
                        titulo="Total de Abstenções"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.totalAbstencoes}
                        valor2022={dadosGerais2022.totalAbstencoes}
                        isLoading={carregando}
                        unidade=" abstenções"
                        height="400px"
                      />
                      <GraficoLinhaComparativo
                        titulo="Votos Válidos"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.votosValidos}
                        valor2022={dadosGerais2022.votosValidos}
                        isLoading={carregando}
                        unidade=" votos"
                        height="400px"
                      />
                      <GraficoLinhaComparativo
                        titulo="Votos Brancos"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.votosBrancos}
                        valor2022={dadosGerais2022.votosBrancos}
                        isLoading={carregando}
                        unidade=" votos"
                        height="400px"
                      />
                      <GraficoLinhaComparativo
                        titulo="Votos Nulos"
                        label2018="2018"
                        label2022="2022"
                        valor2018={dadosGerais2018.votosNulos}
                        valor2022={dadosGerais2022.votosNulos}
                        isLoading={carregando}
                        unidade=" votos"
                        height="400px"
                      />
                    </div>

                    <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Variação no Mapa por Município</h3>
                      <div className="mb-4">
                        <FiltroDropdown
                          id="tipo-metrica-mapa"
                          label="Métrica para Variação no Mapa"
                          value={tipoMetricaMapa}
                          options={[
                            { value: 'variacao-votos-validos', label: 'Variação de Votos Válidos (%)' },
                            { value: 'variacao-abstencao', label: 'Variação da Taxa de Abstenção (p.p.)' },
                            { value: 'variacao-comparecimento', label: 'Variação da Taxa de Comparecimento (p.p.)' },
                          ]}
                          onChange={(e) => setTipoMetricaMapa(e.target.value as any)}
                          disabled={carregando}
                        />
                      </div>
                      <MapaVariacaoParaiba
                        dadosMunicipios={dadosMapaVisaoGeral}
                        isLoading={carregando}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}