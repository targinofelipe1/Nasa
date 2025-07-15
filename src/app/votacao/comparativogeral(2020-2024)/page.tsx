// pages/painel-vereador-prefeito/index.tsx
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import GraficoLinhaComparativo from '@/components/ui/GraficoLinhaComparativo'; // Corrigido o typo aqui de GraficoLincoComparativo
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

export default function PainelVereadorPrefeito() {
  const [cargoAtivo, setCargoAtivo] = useState('Prefeito'); 
  const [carregando, setCarregando] = useState(true);

  const [dados2020Completos, setDados2020Completos] = useState<CandidatoData[]>([]);
  const [metricasSecao2020, setMetricasSecao2020] = useState<Map<string, SectionMetrics>>(new Map());

  const [dados2024Completos, setDados2024Completos] = useState<CandidatoData[]>([]);
  const [metricasSecao2024, setMetricasSecao2024] = useState<Map<string, SectionMetrics>>(new Map());
  
  const [dadosLocais, setDadosLocais] = useState<LocalVotacaoDetalhado[]>([]);
  const locaisCarregadosRef = useRef(false);

  const [dadosGerais2020, setDadosGerais2020] = useState<DadosMetricasComuns>({
    eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
    votosValidos: 0, votosBrancos: 0, votosNulos: 0,
  });
  const [dadosGerais2024, setDadosGerais2024] = useState<DadosMetricasComuns>({
    eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0,
    votosValidos: 0, votosBrancos: 0, votosNulos: 0,
  });
  
  const [dadosMapaVisaoGeral, setDadosMapaVisaoGeral] = useState<any[]>([]);
  const [tipoMetricaMapa, setTipoMetricaMapa] = useState<'variacao-votos-validos' | 'variacao-abstencao' | 'variacao-comparecimento'>('variacao-votos-validos');
  const [municipioVisaoGeral, setMunicipioVisaoGeral] = useState('Todos os Municípios');
  
  const cargosDisponiveisVP = useMemo(() => ['Prefeito', 'Vereador'], []); 

  const planilhasPorCargoVP: Record<string, { '2020': string[]; '2024': string[] }> = useMemo(() => ({
    Vereador: {
      '2020': ['vereador_2020'],
      '2024': ['vereador_2024'],
    },
    Prefeito: {
      '2020': ['prefeito_2020'],
      '2024': ['prefeito_2024'],
    },
  }), []);

  // Removido o estado `cargoFilterUserInteracted` e sua lógica associada.


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

  const loadSheetDataByYearAndCargo = useCallback(async (year: '2020' | '2024', cargoUnico: string, signal: AbortSignal) => {
    const allData: CandidatoData[] = [];
    const tempSectionDataForMetrics = new Map<string, SectionMetrics>();

    const cargoMap: Record<string, string> = {
        'vereador_2020': 'Vereador', 'prefeito_2020': 'Prefeito',
        'vereador_2024': 'Vereador', 'prefeito_2024': 'Prefeito',
    };

    let idsToFetch: string[] | undefined;
    idsToFetch = planilhasPorCargoVP[cargoUnico]?.[year];
    
    // CARREGA DADOS DE MÉTRICAS GERAIS (Eleitores Aptos, Comparecimento, Abstenção)
    // Para eleições municipais, podemos usar a planilha de Prefeito como base para métricas gerais.
    const metricSheetId = year === '2020' ? 'prefeito_2020' : 'prefeito_2024';

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

    // Carrega dados específicos de CANDIDATOS/VOTOS
    if (idsToFetch) { // Apenas se houver planilhas para o cargo específico
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
  }, [safeParseVotes, dadosLocais, planilhasPorCargoVP]);


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDataForSelectedCargo = async () => {
      if (dadosLocais.length === 0) {
        setCarregando(true);
        return;
      }

      setCarregando(true);
      setDados2020Completos([]);
      setDados2024Completos([]);
      setMetricasSecao2020(new Map());
      setMetricasSecao2024(new Map());
      setDadosMapaVisaoGeral([]);
      // Não resetamos municipioVisaoGeral aqui para manter o filtro de município ativo se o usuário já o selecionou
      // setMunicipioVisaoGeral('Todos os Municípios'); 

      const [data2020Result, data2024Result] = await Promise.all([
        loadSheetDataByYearAndCargo('2020', cargoAtivo, signal),
        loadSheetDataByYearAndCargo('2024', cargoAtivo, signal),
      ]);
      
      setDados2020Completos(data2020Result.allData);
      setMetricasSecao2020(data2020Result.tempSectionDataForMetrics);

      setDados2024Completos(data2024Result.allData);
      setMetricasSecao2024(data2024Result.tempSectionDataForMetrics);

      setCarregando(false);
    };

    fetchDataForSelectedCargo();

    return () => {
      controller.abort();
    };
  }, [dadosLocais, cargoAtivo, loadSheetDataByYearAndCargo]);


  useEffect(() => {
    if (carregando || dadosLocais.length === 0) {
      // Zera os dados se estiver carregando ou sem locais
      setDadosGerais2020({ eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0, votosValidos: 0, votosBrancos: 0, votosNulos: 0 });
      setDadosGerais2024({ eleitoresAptos: 0, totalComparecimentos: 0, totalAbstencoes: 0, taxaAbstencao: 0, votosValidos: 0, votosBrancos: 0, votosNulos: 0 });
      setDadosMapaVisaoGeral([]);
      return;
    }

    // Calcula dadosGerais2020 e dadosGerais2024 para os gráficos principais
    let aptos2020Geral = 0, comp2020Geral = 0, abst2020Geral = 0;
    let validos2020Geral = 0, brancos2020Geral = 0, nulos2020Geral = 0;
    
    // Filtra dados para o cargo ativo e município selecionado
    const dados2020Filtrados = dados2020Completos.filter(d => 
        d.Cargo === cargoAtivo && 
        (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral)
    );
    const dados2024Filtrados = dados2024Completos.filter(d => 
        d.Cargo === cargoAtivo && 
        (municipioVisaoGeral === 'Todos os Municípios' || d['Município'] === municipioVisaoGeral)
    );

    // Soma métricas de seção (aptos, comparecimentos, abstenções)
    metricasSecao2020.forEach(metric => {
        if (metric.municipio === municipioVisaoGeral || municipioVisaoGeral === 'Todos os Municípios') {
            aptos2020Geral += metric.aptos;
            comp2020Geral += metric.comp;
            abst2020Geral += metric.abst;
        }
    });
    // Soma votos válidos, brancos, nulos para 2020
    dados2020Filtrados.forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        if (nome === 'BRANCO') {
            brancos2020Geral += item['Quantidade de Votos'];
        } else if (nome === 'NULO' || sigla === '#nulo#') {
            nulos2020Geral += item['Quantidade de Votos'];
        } else {
            validos2020Geral += item['Quantidade de Votos'];
        }
    });
    setDadosGerais2020({
        eleitoresAptos: aptos2020Geral, totalComparecimentos: comp2020Geral, totalAbstencoes: abst2020Geral,
        taxaAbstencao: aptos2020Geral > 0 ? (abst2020Geral / aptos2020Geral) * 100 : 0,
        votosValidos: validos2020Geral, votosBrancos: brancos2020Geral, votosNulos: nulos2020Geral,
    });

    let aptos2024Geral = 0, comp2024Geral = 0, abst2024Geral = 0;
    let validos2024Geral = 0, brancos2024Geral = 0, nulos2024Geral = 0;

    // Soma métricas de seção (aptos, comparecimentos, abstenções) para 2024
    metricasSecao2024.forEach(metric => {
        if (metric.municipio === municipioVisaoGeral || municipioVisaoGeral === 'Todos os Municípios') {
            aptos2024Geral += metric.aptos;
            comp2024Geral += metric.comp;
            abst2024Geral += metric.abst;
        }
    });
    // Soma votos válidos, brancos, nulos para 2024
    dados2024Filtrados.forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        if (nome === 'BRANCO') {
            brancos2024Geral += item['Quantidade de Votos'];
        } else if (nome === 'NULO' || sigla === '#nulo#') {
            nulos2024Geral += item['Quantidade de Votos'];
        } else {
            validos2024Geral += item['Quantidade de Votos'];
        }
    });
    setDadosGerais2024({
        eleitoresAptos: aptos2024Geral, totalComparecimentos: comp2024Geral, totalAbstencoes: abst2024Geral,
        taxaAbstencao: aptos2024Geral > 0 ? (abst2024Geral / aptos2024Geral) * 100 : 0,
        votosValidos: validos2024Geral, votosBrancos: brancos2024Geral, votosNulos: nulos2024Geral,
    });

    // CÁLCULO PARA O MAPA
    const municipiosUnicosNaParaiba = getUniqueOptions(dadosLocais, 'Município');
    const aggregatedDataForMap: { 
      [key: string]: { 
        totalValidos2020: number, totalValidos2024: number, 
        aptos2020: number, aptos2024: number, 
        abst2020: number, abst2024: number, 
        comp2020: number, comp2024: number 
      } 
    } = {};

    municipiosUnicosNaParaiba.forEach(mun => {
      aggregatedDataForMap[mun] = {
        totalValidos2020: 0, totalValidos2024: 0,
        aptos2020: 0, aptos2024: 0,
        abst2020: 0, abst2024: 0,
        comp2020: 0, comp2024: 0,
      };
    });

    // Agrega dados de votos para o mapa pelo cargo ativo
    dados2020Completos.filter(d => d.Cargo === cargoAtivo).forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        if (aggregatedDataForMap[item['Município']] && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#nulo#') {
            aggregatedDataForMap[item['Município']].totalValidos2020 += item['Quantidade de Votos'];
        }
    });
    dados2024Completos.filter(d => d.Cargo === cargoAtivo).forEach(item => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        if (aggregatedDataForMap[item['Município']] && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#nulo#') {
            aggregatedDataForMap[item['Município']].totalValidos2024 += item['Quantidade de Votos'];
        }
    });

    // Métricas de seção para o mapa são sempre baseadas no que está disponível nas metricasSecao
    metricasSecao2020.forEach(metric => {
      if (aggregatedDataForMap[metric.municipio]) {
        aggregatedDataForMap[metric.municipio].aptos2020 += metric.aptos;
        aggregatedDataForMap[metric.municipio].abst2020 += metric.abst;
        aggregatedDataForMap[metric.municipio].comp2020 += metric.comp;
      }
    });
    metricasSecao2024.forEach(metric => {
      if (aggregatedDataForMap[metric.municipio]) {
        aggregatedDataForMap[metric.municipio].aptos2024 += metric.aptos;
        aggregatedDataForMap[metric.municipio].abst2024 += metric.abst;
        aggregatedDataForMap[metric.municipio].comp2024 += metric.comp;
      }
    });

    const mapData = municipiosUnicosNaParaiba.map(mun => {
      const data = aggregatedDataForMap[mun];
      const value2020 = data?.totalValidos2020 || 0;
      const value2024 = data?.totalValidos2024 || 0;

      const aptos2020_map = data?.aptos2020 || 0;
      const aptos2024_map = data?.aptos2024 || 0;
      const abst2020_map = data?.abst2020 || 0;
      const abst2024_map = data?.abst2024 || 0;
      const comp2020_map = data?.comp2020 || 0;
      const comp2024_map = data?.comp2024 || 0;

      let percentageChange: number = 0;
      let infoContent: string = '';

      switch (tipoMetricaMapa) {
        case 'variacao-votos-validos':
          if (value2020 > 0) {
            percentageChange = ((value2024 - value2020) / value2020) * 100;
          } else if (value2024 > 0) {
            percentageChange = 100;
          } else {
            percentageChange = 0;
          }
          infoContent = `Votos Válidos 2020: ${value2020.toLocaleString('pt-BR')}<br/>Votos Válidos 2024: ${value2024.toLocaleString('pt-BR')}<br/>Variação: ${percentageChange.toFixed(2)}%`;
          break;
        case 'variacao-abstencao':
          const abstPct2020 = aptos2020_map > 0 ? (abst2020_map / aptos2020_map) * 100 : 0;
          const abstPct2024 = aptos2024_map > 0 ? (abst2024_map / aptos2024_map) * 100 : 0;
          percentageChange = abstPct2024 - abstPct2020;
          infoContent = `Abstenção 2020: ${abstPct2020.toFixed(2)}%<br/>Abstenção 2024: ${abstPct2024.toFixed(2)}%<br/>Variação: ${percentageChange.toFixed(2)} p.p.`;
          break;
        case 'variacao-comparecimento':
          const compPct2020 = aptos2020_map > 0 ? (comp2020_map / aptos2020_map) * 100 : 0;
          const compPct2024 = aptos2024_map > 0 ? (comp2024_map / aptos2024_map) * 100 : 0;
          percentageChange = compPct2024 - compPct2020;
          infoContent = `Comparecimento 2020: ${compPct2020.toFixed(2)}%<br/>Comparecimento 2024: ${compPct2024.toFixed(2)}%<br/>Variação: ${percentageChange.toFixed(2)} p.p.`;
          break;
      }

      let color = '#CCCCCC';

      const red = [255, 0, 0];
      const yellow = [255, 255, 0];
      const green = [0, 128, 0];

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
        color = 'rgb(255, 255, 150)';
      }

      return {
        name: mun,
        value2018: value2020, // Reutilizando a prop value2018 para 2020
        value2022: value2024, // Reutilizando a prop value2022 para 2024
        percentageChange: percentageChange,
        color: color,
        infoContent: infoContent,
      };
    }).filter(m => m.value2018 !== undefined || m.value2022 !== undefined);

    setDadosMapaVisaoGeral(mapData);

  }, [carregando, dados2020Completos, dados2024Completos, metricasSecao2020, metricasSecao2024, getUniqueOptions, dadosLocais, cargoAtivo, municipioVisaoGeral, tipoMetricaMapa]);


  const handleMunicipioVisaoGeralChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMunicipioVisaoGeral(e.target.value);
  }, []);

  const handleCargoAtivoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCargoAtivo(e.target.value);
    setMunicipioVisaoGeral('Todos os Municípios');
    setTipoMetricaMapa('variacao-votos-validos');
    // Removida a linha `setCargoFilterUserInteracted(true);`
  }, []);

  const municipiosDisponiveisParaFiltro = useMemo(() => {
    return getUniqueOptions(dadosLocais, 'Município').map(mun => ({ value: mun, label: mun }));
  }, [dadosLocais, getUniqueOptions]);

  const cargosParaDropdownVP = useMemo(() => {
    return cargosDisponiveisVP.map(cargo => ({ value: cargo, label: cargo }));
  }, [cargosDisponiveisVP]);

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
              <span className="text-gray-400"> Análise Eleitoral Municipal</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel de Análise Eleitoral Municipal</h1>
          </div>

          <div className="p-6 space-y-10">
            {carregando ? (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                <svg className="animate-spin h-8 w-8 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-semibold mt-4">Carregando dados para {cargoAtivo}...</p>
                <p className="text-sm mt-2">Isso pode levar alguns instantes.</p>
              </div>
            ) : (
              <>
                <div className="mb-8 p-6 bg-white shadow-md rounded-lg">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros para Visão Geral ({cargoAtivo})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FiltroDropdown
                        id="cargo-selecionado-vp"
                        label="Cargo Selecionado"
                        value={cargoAtivo}
                        options={cargosParaDropdownVP}
                        onChange={handleCargoAtivoChange}
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

                {/* Exibe os 6 gráficos, SEMPRE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GraficoLinhaComparativo
                    titulo="Eleitores Aptos"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.eleitoresAptos}
                    valor2022={dadosGerais2024.eleitoresAptos}
                    isLoading={carregando}
                    unidade=" eleitores"
                    height="400px" 
                  />
                  <GraficoLinhaComparativo
                    titulo="Total de Comparecimentos"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.totalComparecimentos}
                    valor2022={dadosGerais2024.totalComparecimentos}
                    isLoading={carregando}
                    unidade=" comparecimentos"
                    height="400px" 
                  />
                  <GraficoLinhaComparativo
                    titulo="Total de Abstenções"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.totalAbstencoes}
                    valor2022={dadosGerais2024.totalAbstencoes}
                    isLoading={carregando}
                    unidade=" abstenções"
                    height="400px" 
                  />
                  <GraficoLinhaComparativo
                    titulo="Votos Válidos"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.votosValidos}
                    valor2022={dadosGerais2024.votosValidos}
                    isLoading={carregando}
                    unidade=" votos"
                    height="400px" 
                  />
                  <GraficoLinhaComparativo
                    titulo="Votos Brancos"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.votosBrancos}
                    valor2022={dadosGerais2024.votosBrancos}
                    isLoading={carregando}
                    unidade=" votos"
                    height="400px" 
                  />
                  <GraficoLinhaComparativo
                    titulo="Votos Nulos"
                    label2018="2020"
                    label2022="2024"
                    valor2018={dadosGerais2020.votosNulos}
                    valor2022={dadosGerais2024.votosNulos}
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
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}