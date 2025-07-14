'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import EleitoradoCards from '@/components/ui/EleitoradoCards';
import MapaParaibaEleitorado from '@/components/ui/MapaParaibaEleitorado';
import FiltrosEleitorado from '@/components/ui/FiltrosEleitorado';
import RankingEleitorado from '@/components/ui/RankingEleitorado';
import GraficoDinamicoEleitorado from '@/components/ui/GraficoDinamicoEleitorado';

interface LocalVotacaoDetalhado {
  'Município': string;
  'Zona Eleitoral': string;
  'Seção Eleitoral': string;
  'Local de Votação': string;
  'Nome do Local': string;
}

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

interface MapMunicipioMetrics {
  totalEleitores: number;
  percMulheres: number;
  percJovens: number;
  percAdultos: number;
  percIdosos: number;
  percMasculino: number;
  percFeminino: number;
  percAnalfabetos: number;
  totalJovens: number;
  totalAdultos: number;
  totalIdosos: number;
  totalMulheres: number;
  totalHomens: number;
  totalAnalfabetos: number;
}

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const safeParseNumber = (value: any): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const normalizedValue = value.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function PainelEleitorado() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState('TODOS OS MUNICÍPIOS');
  const [zonaSelecionada, setZonaSelecionada] = useState('TODAS AS ZONAS');
  const [secaoSelecionada, setSecaoSelecionada] = useState('TODAS AS SEÇÕES');
  const [localSelecionado, setLocalSelecionado] = useState('TODOS OS LOCAIS');
  const [termoBuscaLocal, setTermoBuscaLocal] = useState('');

  const [generoSelecionado, setGeneroSelecionado] = useState('Todos os Gêneros');
  const [estadoCivilSelecionado, setEstadoCivilSelecionado] = useState('Todos os Estados Civis');
  const [faixaEtariaSelecionada, setFaixaEtariaSelecionada] = useState('Todas as Faixas Etárias');
  const [escolaridadeSelecionada, setEscolaridadeSelecionada] = useState('Todas as Escolaridades');
  const [racaCorSelecionada, setRacaCorSelecionada] = useState('Todas as Raças/Cores');
  const [identidadeGeneroSelecionada, setIdentidadeGeneroSelecionada] = useState('Todos os Identidades de Gênero');
  const [incluirQuilombola, setIncluirQuilombola] = useState(false);
  const [incluirInterpreteLibras, setIncluirInterpreteLibras] = useState(false);
  const [incluirComBiometria, setIncluirComBiometria] = useState(false);
  const [incluirComDeficiencia, setIncluirComDeficiencia] = useState(false);
  const [incluirComNomeSocial, setIncluirComNomeSocial] = useState(false);

  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);

  const [generosDisponiveis, setGenerosDisponiveis] = useState<string[]>([]);
  const [estadosCivisDisponiveis, setEstadosCivisDisponiveis] = useState<string[]>([]);
  const [faixasEtariasDisponiveis, setFaixasEtariasDisponiveis] = useState<string[]>([]);
  const [escolaridadesDisponiveis, setEscolaridadesDisponiveis] = useState<string[]>([]);
  const [racasCoresDisponiveis, setRacasCoresDisponiveis] = useState<string[]>([]);
  const [identidadesGeneroDisponiveis, setIdentidadesGeneroDisponiveis] = useState<string[]>([]);

  const [dadosCompletos, setDadosCompletos] = useState<EleitoradoAgregado[]>([]);
  const [dadosFiltradosParaExibicao, setDadosFiltradosParaExibicao] = useState<EleitoradoAgregado[]>([]);
  const [locaisVotacaoFiltradosParaExibicao, setLocaisVotacaoFiltradosParaExibicao] = useState<LocalVotacaoDetalhado[]>([]);

  const [carregandoEleitorado, setCarregandoEleitorado] = useState(false); // Inicia como false
  const carregando = carregandoEleitorado;

  const [totaisEleitoradoGeral, setTotaisEleitoradoGeral] = useState({
    totalEleitores: 0,
    totalBiometria: 0,
    totalDeficiencia: 0,
    totalNomeSocial: 0,
    totalQuilombola: 0,
    totalInterpreteLibras: 0,
    totalMulheres: 0,
    totalHomens: 0,
    totalJovens: 0,
    totalAdultos: 0,
    totalIdosos: 0,
    totalAnalfabetos: 0,
  });

  const [totaisParaCardsPorCategoria, setTotaisParaCardsPorCategoria] = useState({
    totalEleitores: 0,
    totalBiometria: 0,
    totalDeficiencia: 0,
    totalNomeSocial: 0,
    totalQuilombola: 0,
    totalInterpreteLibras: 0,
    totalMulheres: 0,
    totalHomens: 0,
    totalJovens: 0,
    totalAdultos: 0,
    totalIdosos: 0,
    totalAnalfabetos: 0,
  });

  const resumoCacheRef = useRef<Record<string, any>>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('eleitoradoResumoGlobal') || '{}')
      : {}
  );

  const [forceReloadCounter, setForceReloadCounter] = useState(0); 

  const abas = ['Visão Geral', 'Gênero', 'Estado Civil', 'Faixa Etária', 'Escolaridade', 'Raça/Cor', 'Identidade de Gênero'];

  const planilhasEleitorado = useMemo(() => [
    'masculino_solteiro', 'masculino_casado', 'masculino_separado_judicialmente',
    'masculino_divorciado', 'masculino_viuvo', "masculino_nao_informado", 'feminino_casado',
    'feminino_viuvo', 'feminino_divorciado', 'feminino_separado_judicialmente',
    'feminino_solteiro'
  ], []);

  const [paginaAtualTabela, setPaginaAtualTabela] = useState(1);
  const [itensPorPaginaTabela, setItensPorPaginaTabela] = useState(25);

  const getUniqueOptions = useCallback((data: any[], key: string, sort = true) => {
    const options = new Set<string>();
    data.forEach((item: any) => {
      const value = item[key]?.trim().toUpperCase();
      if (value && value !== 'N/A' && value !== 'NÃO SE APLICA') {
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

  const calcularTotaisGeraisEleitorado = useCallback((dados: EleitoradoAgregado[]) => {
    let totalEleitoresGeral = 0;
    let totalBiometriaGeral = 0;
    let totalDeficienciaGeral = 0;
    let totalNomeSocialGeral = 0;
    let totalQuilombolaGeral = 0;
    let totalInterpreteLibrasGeral = 0;
    let totalMulheresGeral = 0;
    let totalHomensGeral = 0;
    let totalJovensGeral = 0;
    let totalAdultosGeral = 0;
    let totalIdososGeral = 0;
    let totalAnalfabetosGeral = 0;

    dados.forEach((item: EleitoradoAgregado) => {
      totalEleitoresGeral += item['Qtd. Eleitores'];
      totalBiometriaGeral += item['Qtd. com Biometria'];
      totalDeficienciaGeral += item['Qtd. com Deficiência'];
      totalNomeSocialGeral += item['Qtd. com Nome Social'];
      if (item['Quilombola']?.toUpperCase().trim() === 'SIM') totalQuilombolaGeral += item['Qtd. Eleitores'];
      if (item['Intérprete de Libras']?.toUpperCase().trim() === 'SIM') totalInterpreteLibrasGeral += item['Qtd. Eleitores'];
      
      const genero = item['Gênero']?.toUpperCase().trim();
      if (genero === 'FEMININO') totalMulheresGeral += item['Qtd. Eleitores'];
      if (genero === 'MASCULINO') totalHomensGeral += item['Qtd. Eleitores'];

      const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim();
      if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
        totalJovensGeral += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
        totalAdultosGeral += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
        totalIdososGeral += item['Qtd. Eleitores'];
      }

      const escolaridade = item['Escolaridade']?.toUpperCase().trim();
      if (escolaridade === 'ANALFABETO') {
        totalAnalfabetosGeral += item['Qtd. Eleitores'];
      }
    });

    const resumoParaCards = {
      totalEleitores: totalEleitoresGeral,
      totalBiometria: totalBiometriaGeral,
      totalDeficiencia: totalDeficienciaGeral,
      totalNomeSocial: totalNomeSocialGeral,
      totalQuilombola: totalQuilombolaGeral,
      totalInterpreteLibras: totalInterpreteLibrasGeral,
      totalMulheres: totalMulheresGeral,
      totalHomens: totalHomensGeral,
      totalJovens: totalJovensGeral,
      totalAdultos: totalAdultosGeral,
      totalIdosos: totalIdososGeral,
      totalAnalfabetos: totalAnalfabetosGeral,
    };

    return resumoParaCards;
  }, []);

  const filtrosEstaoAtivos = useMemo(() => {
    return (
      municipioSelecionado !== 'TODOS OS MUNICÍPIOS' ||
      zonaSelecionada !== 'TODAS AS ZONAS' ||
      secaoSelecionada !== 'TODAS AS SEÇÕES' ||
      localSelecionado !== 'TODOS OS LOCAIS' ||
      generoSelecionado !== 'Todos os Gêneros' ||
      estadoCivilSelecionado !== 'Todos os Estados Civis' ||
      faixaEtariaSelecionada !== 'Todas as Faixas Etárias' ||
      escolaridadeSelecionada !== 'Todas as Escolaridades' ||
      racaCorSelecionada !== 'Todas as Raças/Cores' ||
      identidadeGeneroSelecionada !== 'Todos os Identidades de Gênero' ||
      incluirQuilombola ||
      incluirInterpreteLibras ||
      incluirComBiometria ||
      incluirComDeficiencia ||
      incluirComNomeSocial
    );
  }, [
    municipioSelecionado, zonaSelecionada, secaoSelecionada, localSelecionado,
    generoSelecionado, estadoCivilSelecionado, faixaEtariaSelecionada,
    escolaridadeSelecionada, racaCorSelecionada, identidadeGeneroSelecionada,
    incluirQuilombola, incluirInterpreteLibras, incluirComBiometria,
    incluirComDeficiencia, incluirComNomeSocial
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    let isMounted = true; 

    // Função para resetar todos os estados relevantes para o carregamento inicial/troca de aba
    const resetAllDataStates = (setLoadingToTrue = false) => {
      setDadosCompletos([]);
      setMunicipiosDisponiveis([]);
      setGenerosDisponiveis([]);
      setEstadosCivisDisponiveis([]);
      setFaixasEtariasDisponiveis([]);
      setEscolaridadesDisponiveis([]);
      setRacasCoresDisponiveis([]);
      setIdentidadesGeneroDisponiveis([]);
      setTotaisEleitoradoGeral({
        totalEleitores: 0, totalBiometria: 0, totalDeficiencia: 0,
        totalNomeSocial: 0, totalQuilombola: 0, totalInterpreteLibras: 0,
        totalMulheres: 0, totalHomens: 0, totalJovens: 0, totalAdultos: 0,
        totalIdosos: 0, totalAnalfabetos: 0,
      });
      setTotaisParaCardsPorCategoria({
        totalEleitores: 0, totalBiometria: 0, totalDeficiencia: 0,
        totalNomeSocial: 0, totalQuilombola: 0, totalInterpreteLibras: 0,
        totalMulheres: 0, totalHomens: 0, totalJovens: 0, totalAdultos: 0,
        totalIdosos: 0, totalAnalfabetos: 0,
      });
      setCarregandoEleitorado(setLoadingToTrue); // Define o carregamento baseado no parâmetro
    };

    const CACHE_KEY_DATA = `eleitoradoCompletos_geral`; 
    const CACHE_KEY_RESUMO = `eleitoradoResumoGlobal`; 

    const fetchData = async (forceFetchFromAPI: boolean) => {
      let dataFromCache = null;
      let resumoFromCache = null;
      let dataLoadedFromCache = false;

      if (!forceFetchFromAPI && typeof window !== 'undefined') {
        const cachedDataString = localStorage.getItem(CACHE_KEY_DATA);
        const cachedResumoString = localStorage.getItem(CACHE_KEY_RESUMO);

        if (cachedDataString && cachedResumoString) {
          try {
            dataFromCache = JSON.parse(cachedDataString);
            resumoFromCache = JSON.parse(cachedResumoString);
            if (dataFromCache.length > 0 && resumoFromCache) {
              console.log("[PainelEleitorado] Servindo dados e resumo do cache (localStorage).");
              if (isMounted) {
                setDadosCompletos(dataFromCache);
                setTotaisEleitoradoGeral(resumoFromCache);
                setMunicipiosDisponiveis(getUniqueOptions(dataFromCache, 'Município'));
                setGenerosDisponiveis(getUniqueOptions(dataFromCache, 'Gênero'));
                setEstadosCivisDisponiveis(getUniqueOptions(dataFromCache, 'Estado Civil'));
                setFaixasEtariasDisponiveis(getUniqueOptions(dataFromCache, 'Faixa Etária'));
                setEscolaridadesDisponiveis(getUniqueOptions(dataFromCache, 'Escolaridade'));
                setRacasCoresDisponiveis(getUniqueOptions(dataFromCache, 'Raça/Cor'));
                setIdentidadesGeneroDisponiveis(getUniqueOptions(dataFromCache, 'Identidade de Gênero'));
                setCarregandoEleitorado(false); // Carregado do cache, então não está "carregando"
                dataLoadedFromCache = true;
              }
            } else {
              localStorage.removeItem(CACHE_KEY_DATA);
              localStorage.removeItem(CACHE_KEY_RESUMO);
            }
          } catch (e) {
            console.error("Erro ao analisar dados do cache:", e);
            localStorage.removeItem(CACHE_KEY_DATA);
            localStorage.removeItem(CACHE_KEY_RESUMO);
          }
        }
      }

      if (dataLoadedFromCache) {
          return; // Já carregou do cache, nada mais a fazer aqui
      }
      
      // Se chegamos aqui, ou forceFetchFromAPI é true, ou não havia cache válido
      if (isMounted) {
          setCarregandoEleitorado(true); // Ativa o spinner de carregamento, pois vamos buscar da API
      }

      console.log("[PainelEleitorado] Buscando dados da API...");
      const todosOsDadosBrutos: EleitoradoAgregado[] = [];
      
      const fetchPromises = planilhasEleitorado.map(async (id) => {
        try {
          const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
          const json = await res.json();
          return json.data?.slice(1) || [];
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return [];
          }
          console.error(`Erro ao carregar dados da planilha ${id}:`, err);
          return [];
        }
      });

      const allLines = await Promise.all(fetchPromises);
      const combinedLines = allLines.flat();

      if (!isMounted) {
          return; 
      }

      if (combinedLines.length === 0) {
        console.warn("[PainelEleitorado] Nenhuma linha de dados recebida da API.");
        if (isMounted) {
          resetAllDataStates(); // Reseta estados e prepara para mostrar aviso de erro
        }
        return;
      }

      for (const linha of combinedLines) {
        todosOsDadosBrutos.push({
          'Município': linha[0]?.trim().toUpperCase() || 'N/A',
          'Zona Eleitoral': linha[1]?.trim().toUpperCase() || 'N/A',
          'Seção Eleitoral': linha[2]?.trim().toUpperCase() || 'N/A',
          'Local de Votação': linha[3]?.trim().toUpperCase() || 'N/A',
          'Gênero': linha[4]?.trim() || 'N/A',
          'Estado Civil': linha[5]?.trim() || 'N/A',
          'Faixa Etária': linha[6]?.trim() || 'N/A',
          'Escolaridade': linha[7]?.trim() || 'N/A',
          'Raça/Cor': linha[8]?.trim() || 'N/A',
          'Identidade de Gênero': linha[9]?.trim() || 'N/A',
          'Quilombola': linha[10]?.trim() || 'N/A',
          'Intérprete de Libras': linha[11]?.trim() || 'N/A',
          'Qtd. Eleitores': safeParseNumber(linha[12]),
          'Qtd. com Biometria': safeParseNumber(linha[13]),
          'Qtd. com Deficiência': safeParseNumber(linha[14]),
          'Qtd. com Nome Social': safeParseNumber(linha[15]),
          'Tipo de Escolaridade Detalhado': linha[16]?.trim() || 'N/A',
        });
      }
      console.log("[PainelEleitorado] Dados da API carregados e processados:", todosOsDadosBrutos.length);
      
      if (isMounted) {
        setDadosCompletos(todosOsDadosBrutos);
        const totaisCalculados = calcularTotaisGeraisEleitorado(todosOsDadosBrutos);
        setTotaisEleitoradoGeral(totaisCalculados);

        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY_DATA, JSON.stringify(todosOsDadosBrutos));
            localStorage.setItem(CACHE_KEY_RESUMO, JSON.stringify(totaisCalculados));
          }
        } catch (e) {
          console.warn('Erro ao salvar no cache (provavelmente QuotaExceededError):', e);
        }
        
        setMunicipiosDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Município'));
        setGenerosDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Gênero'));
        setEstadosCivisDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Estado Civil'));
        setFaixasEtariasDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Faixa Etária'));
        setEscolaridadesDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Escolaridade'));
        setRacasCoresDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Raça/Cor'));
        setIdentidadesGeneroDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Identidade de Gênero'));

        setCarregandoEleitorado(false);
      }
    };

    // Lógica principal do useEffect para o carregamento de dados
    // Sempre zera os dados e mostra o aviso amarelo, a menos que esteja forçando um reload
    if (forceReloadCounter === 0 && dadosCompletos.length === 0) {
        resetAllDataStates(false); // Mostra o aviso amarelo
    }

    // Dispara a busca de dados apenas se o forceReloadCounter > 0
    if (forceReloadCounter > 0) {
        fetchData(true); // Força um fetch da API
        if (isMounted) setForceReloadCounter(0); // Reseta o contador
    } else if (dadosCompletos.length === 0 && !carregandoEleitorado) {
        // Se não estamos carregando, não temos dados, e não é um forceReload
        // (i.e., acabamos de entrar na página ou trocar de aba),
        // resetamos e mostramos o aviso amarelo (isso já foi feito acima, mas reforça)
        // A chamada a fetchData(false) será feita abaixo se necessário
        if (isMounted) setCarregandoEleitorado(false); 
    }
    
    // Na primeira montagem ou troca de aba, tente carregar do cache.
    // Isso é separado do forceReloadCounter para permitir que o cache carregue sem um clique inicial,
    // mas ainda permite que o clique force um novo fetch.
    if (forceReloadCounter === 0) { // Se não é um forceReload, tenta carregar
        fetchData(false); 
    }


    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [abaAtiva, forceReloadCounter, getUniqueOptions, planilhasEleitorado, calcularTotaisGeraisEleitorado]);


  const mapMunicipioMetrics = useMemo(() => {
    const metrics: Record<string, Omit<MapMunicipioMetrics, 'percMulheres' | 'percJovens' | 'percAdultos' | 'percIdosos' | 'percMasculino' | 'percFeminino' | 'percAnalfabetos'>> = {};

    dadosCompletos.forEach(item => {
      const municipio = item['Município'];
      if (!metrics[municipio]) {
        metrics[municipio] = {
          totalEleitores: 0,
          totalMulheres: 0,
          totalHomens: 0,
          totalJovens: 0,
          totalAdultos: 0,
          totalIdosos: 0,
          totalAnalfabetos: 0,
        };
      }

      metrics[municipio].totalEleitores += item['Qtd. Eleitores'];
      
      const genero = item['Gênero']?.toUpperCase().trim();
      if (genero === 'FEMININO') metrics[municipio].totalMulheres += item['Qtd. Eleitores'];
      if (genero === 'MASCULINO') metrics[municipio].totalHomens += item['Qtd. Eleitores'];

      const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim();
      if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
        metrics[municipio].totalJovens += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
        metrics[municipio].totalAdultos += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
        metrics[municipio].totalIdosos += item['Qtd. Eleitores'];
      }
      
      const escolaridade = item['Escolaridade']?.toUpperCase().trim();
      if (escolaridade === 'ANALFABETO') {
        metrics[municipio].totalAnalfabetos += item['Qtd. Eleitores'];
      }
    });

    const finalMetrics: Record<string, MapMunicipioMetrics> = {};
    for (const municipio in metrics) {
      const m = metrics[municipio];
      const totalEleitores = m.totalEleitores || 1;
      finalMetrics[municipio] = {
        ...m,
        percFeminino: (m.totalMulheres / totalEleitores) * 100,
        percMulheres: (m.totalMulheres / totalEleitores) * 100,
        percMasculino: (m.totalHomens / totalEleitores) * 100,
        percJovens: (m.totalJovens / totalEleitores) * 100,
        percAdultos: (m.totalAdultos / totalEleitores) * 100,
        percIdosos: (m.totalIdosos / totalEleitores) * 100,
        percAnalfabetos: (m.totalAnalfabetos / totalEleitores) * 100,
      };
    }
    return finalMetrics;
  }, [dadosCompletos]);

  useEffect(() => {
    if (carregandoEleitorado || dadosCompletos.length === 0) {
      setDadosFiltradosParaExibicao([]);
      setLocaisVotacaoFiltradosParaExibicao([]);
      setZonasDisponiveis([]);
      setSecoesDisponiveis([]);
      setLocaisDisponiveis([]);
      setTotaisParaCardsPorCategoria({
        totalEleitores: 0, totalBiometria: 0, totalDeficiencia: 0,
        totalNomeSocial: 0, totalQuilombola: 0, totalInterpreteLibras: 0,
        totalMulheres: 0, totalHomens: 0, totalJovens: 0, totalAdultos: 0,
        totalIdosos: 0, totalAnalfabetos: 0,
      });
      return;
    }

    let dadosAtuaisFiltrados: EleitoradoAgregado[] = [...dadosCompletos];
    let dadosParaOpcoesGeograficas: EleitoradoAgregado[] = [...dadosCompletos];

    if (municipioSelecionado !== 'TODOS OS MUNICÍPIOS') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Município'] === municipioSelecionado);
      dadosParaOpcoesGeograficas = dadosParaOpcoesGeograficas.filter((item: EleitoradoAgregado) => item['Município'] === municipioSelecionado);
    }

    const newZonas = getUniqueOptions(dadosParaOpcoesGeograficas, 'Zona Eleitoral', false);
    setZonasDisponiveis(newZonas);

    if (zonaSelecionada !== 'TODAS AS ZONAS') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Zona Eleitoral'] === zonaSelecionada);
      dadosParaOpcoesGeograficas = dadosParaOpcoesGeograficas.filter((item: EleitoradoAgregado) => item['Zona Eleitoral'] === zonaSelecionada);
    }

    const newLocais = getUniqueOptions(dadosParaOpcoesGeograficas, 'Local de Votação');
    setLocaisDisponiveis(newLocais);

    if (localSelecionado !== 'TODOS OS LOCAIS') {
      const localNormalizado = localSelecionado.trim().toUpperCase();
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) =>
        dado['Local de Votação']?.trim().toUpperCase() === localNormalizado
      );
      dadosParaOpcoesGeograficas = dadosParaOpcoesGeograficas.filter((item: EleitoradoAgregado) =>
        item['Local de Votação']?.trim().toUpperCase() === localNormalizado
      );
    }

    const newSecoes = getUniqueOptions(dadosParaOpcoesGeograficas, 'Seção Eleitoral', false);
    setSecoesDisponiveis(newSecoes);

    if (secaoSelecionada !== 'TODAS AS SEÇÕES') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) =>
        dado['Seção Eleitoral'] === secaoSelecionada
      );
    }

    if (generoSelecionado !== 'Todos os Gêneros') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Gênero']?.toUpperCase().trim() === generoSelecionado.toUpperCase().trim()); }
    if (estadoCivilSelecionado !== 'Todos os Estados Civis') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Estado Civil']?.toUpperCase().trim() === estadoCivilSelecionado.toUpperCase().trim()); }
    if (faixaEtariaSelecionada !== 'Todas as Faixas Etárias') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Faixa Etária']?.toUpperCase().trim() === faixaEtariaSelecionada.toUpperCase().trim()); }
    if (escolaridadeSelecionada !== 'Todas as Escolaridades') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Escolaridade']?.toUpperCase().trim() === escolaridadeSelecionada.toUpperCase().trim()); }
    if (racaCorSelecionada !== 'Todas as Raças/Cores') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Raça/Cor']?.toUpperCase().trim() === racaCorSelecionada.toUpperCase().trim()); }
    if (identidadeGeneroSelecionada !== 'Todos os Identidades de Gênero') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Identidade de Gênero']?.toUpperCase().trim() === identidadeGeneroSelecionada.toUpperCase().trim()); }
    if (incluirQuilombola) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Quilombola']?.toUpperCase().trim() === 'SIM'); }
    if (incluirInterpreteLibras) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Intérprete de Libras']?.toUpperCase().trim() === 'SIM'); }
    if (incluirComBiometria) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Biometria'] > 0); }
    if (incluirComDeficiencia) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Deficiência'] > 0); } 
    if (incluirComNomeSocial) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Nome Social'] > 0); }

    setGenerosDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Gênero'));
    setEstadosCivisDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Estado Civil'));
    setFaixasEtariasDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Faixa Etária'));
    setEscolaridadesDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Escolaridade'));
    setRacasCoresDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Raça/Cor'));
    setIdentidadesGeneroDisponiveis(getUniqueOptions(dadosParaOpcoesGeograficas, 'Identidade de Gênero'));

    const locaisParaExibirUnicos: LocalVotacaoDetalhado[] = [];
    const nomesLocaisJaExibidos = new Set<string>();
    const termoLocalNormalizado = removerAcentos(termoBuscaLocal.toUpperCase());

    dadosParaOpcoesGeograficas.forEach((item: EleitoradoAgregado) => {
      const localDetalhado: LocalVotacaoDetalhado = {
        'Município': item['Município'],
        'Zona Eleitoral': item['Zona Eleitoral'],
        'Seção Eleitoral': item['Seção Eleitoral'],
        'Local de Votação': item['Local de Votação'],
        'Nome do Local': item['Local de Votação'], 
      };

      const matchesTermoBusca = !termoBuscaLocal || removerAcentos(localDetalhado['Nome do Local']).includes(termoLocalNormalizado);
      const uniqueKey = `${localDetalhado['Município']}-${localDetalhado['Zona Eleitoral']}-${localDetalhado['Seção Eleitoral']}-${localDetalhado['Local de Votação']}`;
      if (matchesTermoBusca && !nomesLocaisJaExibidos.has(uniqueKey)) {
        locaisParaExibirUnicos.push(localDetalhado);
        nomesLocaisJaExibidos.add(uniqueKey);
      }
    });
    setLocaisVotacaoFiltradosParaExibicao(locaisParaExibirUnicos);

    setDadosFiltradosParaExibicao(dadosAtuaisFiltrados);
    setPaginaAtualTabela(1);

    const currentTotalEleitores = dadosAtuaisFiltrados.reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);
    const currentTotalBiometria = dadosAtuaisFiltrados.reduce((sum, item) => sum + item['Qtd. com Biometria'], 0);
    const currentTotalDeficiencia = dadosAtuaisFiltrados.reduce((sum, item) => sum + item['Qtd. com Deficiência'], 0);
    const currentTotalNomeSocial = dadosAtuaisFiltrados.reduce((sum, item) => sum + item['Qtd. com Nome Social'], 0);
    const currentTotalQuilombola = dadosAtuaisFiltrados.filter(item => item['Quilombola']?.toUpperCase().trim() === 'SIM').reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);
    const currentTotalInterpreteLibras = dadosAtuaisFiltrados.filter(item => item['Intérprete de Libras']?.toUpperCase().trim() === 'SIM').reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);
    const currentTotalMulheres = dadosAtuaisFiltrados.filter(item => item['Gênero']?.toUpperCase().trim() === 'FEMININO').reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);
    const currentTotalHomens = dadosAtuaisFiltrados.filter(item => item['Gênero']?.toUpperCase().trim() === 'MASCULINO').reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);

    let currentTotalJovens = 0;
    let currentTotalAdultos = 0;
    let currentTotalIdosos = 0;
    dadosAtuaisFiltrados.forEach(item => {
        const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim();
        if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
            currentTotalJovens += item['Qtd. Eleitores'];
        } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
            currentTotalAdultos += item['Qtd. Eleitores'];
        } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
            currentTotalIdosos += item['Qtd. Eleitores'];
        }
    });
    const currentTotalAnalfabetos = dadosAtuaisFiltrados.filter(item => item['Escolaridade']?.toUpperCase().trim() === 'ANALFABETO').reduce((sum, item) => sum + item['Qtd. Eleitores'], 0);


    setTotaisParaCardsPorCategoria({
      totalEleitores: currentTotalEleitores,
      totalBiometria: currentTotalBiometria,
      totalDeficiencia: currentTotalDeficiencia,
      totalNomeSocial: currentTotalNomeSocial,
      totalQuilombola: currentTotalQuilombola,
      totalInterpreteLibras: currentTotalInterpreteLibras,
      totalMulheres: currentTotalMulheres,
      totalHomens: currentTotalHomens,
      totalJovens: currentTotalJovens,
      totalAdultos: currentTotalAdultos,
      totalIdosos: currentTotalIdosos,
      totalAnalfabetos: currentTotalAnalfabetos,
    });
  }, [
    municipioSelecionado,
    zonaSelecionada,
    secaoSelecionada,
    localSelecionado,
    termoBuscaLocal,
    generoSelecionado,
    estadoCivilSelecionado,
    faixaEtariaSelecionada,
    escolaridadeSelecionada,
    racaCorSelecionada,
    identidadeGeneroSelecionada,
    incluirQuilombola,
    incluirInterpreteLibras,
    incluirComBiometria,
    incluirComDeficiencia,
    incluirComNomeSocial,
    dadosCompletos, 
    carregandoEleitorado, 
    getUniqueOptions
  ]);

  const handleRecarregarDados = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`eleitoradoCompletos_geral`);
      localStorage.removeItem('eleitoradoResumoGlobal');
    }
    setForceReloadCounter(prev => prev + 1); 
  };

  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto" style={{ zoom: '80%' }}>
          <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-black font-medium">Painel</span> /
              <span className="text-gray-400"> Eleitorado</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel do Eleitorado</h1>
            <div className="flex justify-between items-center mt-5 border-b border-gray-300">
              <div className="flex space-x-10">
                {abas.map((aba) => (
                  <button
                    key={aba}
                    onClick={() => {
                      setAbaAtiva(aba);
                      setMunicipioSelecionado('TODOS OS MUNICÍPIOS');
                      setZonaSelecionada('TODAS AS ZONAS');
                      setSecaoSelecionada('TODAS AS SEÇÕES');
                      setLocalSelecionado('TODOS OS LOCAIS');
                      setTermoBuscaLocal('');
                      setGeneroSelecionado('Todos os Gêneros');
                      setEstadoCivilSelecionado('Todos os Estados Civis');
                      setFaixaEtariaSelecionada('Todas as Faixas Etárias');
                      setEscolaridadeSelecionada('Todas as Escolaridades');
                      setRacaCorSelecionada('Todas as Raças/Cores');
                      setIdentidadeGeneroSelecionada('Todos os Identidades de Gênero');
                      setIncluirQuilombola(false);
                      setIncluirInterpreteLibras(false);
                      setIncluirComBiometria(false);
                      setIncluirComDeficiencia(false);
                      setIncluirComNomeSocial(false);
                      setPaginaAtualTabela(1);
                      // Ao trocar de aba, resetamos os dados e ativamos o aviso amarelo
                      if (dadosCompletos.length > 0) { // Se já havia dados carregados
                         setDadosCompletos([]); // Zera os dados para que o aviso amarelo apareça
                         setCarregandoEleitorado(false); // Garante que o spinner não apareça inicialmente
                      }
                      // Forçar um reload do useEffect (mesmo sem incrementar forceReloadCounter)
                      // para que a lógica de "tenta cache, se não tiver, mostra aviso" seja re-avaliada.
                      // Se queremos *sempre* a mensagem amarela, é preciso zerar dadosCompletos.
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
              <button
                onClick={handleRecarregarDados}
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644A4.491 4.491 0 0 0 7.5 21h11.218A2.25 2.25 0 0 0 21 18.75V10.5m-1.5 3.75-.612 1.44m-.227.56L14.75 19.5m-5.834-11.832-.894-.894V6m-1.5 1.5-.75-.75m5.25-5.25-.75-.75V3.75M12 21v-3.75m-4.5-5.25L5.75 12.75M12 3v3.75M15.75 9L17.25 7.5" />
                </svg>
                Recarregar Dados
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {!carregando && dadosCompletos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                <svg className="h-8 w-8 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.176 3.374 1.9 3.374h14.71c1.724 0 2.766-1.874 1.9-3.376L12.9 3.426c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-xl font-semibold mt-4">Dados não carregados.</p>
                <p className="text-sm mt-2">Para visualizar as informações do eleitorado, clique no botão "Recarregar Dados" no canto superior direito ou abaixo.</p>
                <button
                  onClick={handleRecarregarDados}
                  className="mt-4 inline-flex items-center rounded-md border border-yellow-300 bg-yellow-600 text-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644A4.491 4.491 0 0 0 7.5 21h11.218A2.25 2.25 0 0 0 21 18.75V10.5m-1.5 3.75-.612 1.44m-.227.56L14.75 19.5m-5.834-11.832-.894-.894V6m-1.5 1.5-.75-.75m5.25-5.25-.75-.75V3.75M12 21v-3.75m-4.5-5.25L5.75 12.75M12 3v3.75M15.75 9L17.25 7.5" />
                  </svg>
                  Recarregar Dados Agora
                </button>
              </div>
            ) : carregando ? (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                <svg className="animate-spin h-8 w-8 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl font-semibold mt-4">Carregando dados do eleitorado...</p>
                <p className="text-sm mt-2">Isso pode levar alguns instantes.</p>
              </div>
            ) : (
              <>
                <MapaParaibaEleitorado
                  apiData={dadosCompletos}
                  abaAtiva={abaAtiva}
                  isDataLoading={carregando}
                />

                <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Filtros Geográficos:</h3>
                  <FiltrosEleitorado
                    municipioSelecionado={municipioSelecionado}
                    setMunicipioSelecionado={(value: string) => {
                      setMunicipioSelecionado(value);
                      setZonaSelecionada('TODAS AS ZONAS');
                      setLocalSelecionado('TODOS OS LOCAIS');
                      setSecaoSelecionada('TODAS AS SEÇÕES');
                    }}
                    municipiosDisponiveis={municipiosDisponiveis}
                    zonaSelecionada={zonaSelecionada}
                    setZonaSelecionada={(value: string) => {
                      setZonaSelecionada(value);
                      setLocalSelecionado('TODOS OS LOCAIS');
                      setSecaoSelecionada('TODAS AS SEÇÕES');
                    }}
                    zonasDisponiveis={zonasDisponiveis}
                    localSelecionado={localSelecionado}
                    setLocalSelecionado={(value: string) => {
                      setLocalSelecionado(value);
                      setSecaoSelecionada('TODAS AS SEÇÕES');
                    }}
                    locaisDisponiveis={locaisDisponiveis}
                    secaoSelecionada={secaoSelecionada}
                    setSecaoSelecionada={setSecaoSelecionada}
                    secoesDisponiveis={secoesDisponiveis}
                    carregando={carregando}
                  />
                </div>

                <EleitoradoCards
                  abaAtiva={abaAtiva}
                  carregando={carregando}
                  totalEleitores={totaisParaCardsPorCategoria.totalEleitores}
                  totalBiometria={totaisParaCardsPorCategoria.totalBiometria}
                  totalDeficiencia={totaisParaCardsPorCategoria.totalDeficiencia}
                  totalNomeSocial={totaisParaCardsPorCategoria.totalNomeSocial}
                  totalQuilombola={totaisParaCardsPorCategoria.totalQuilombola}
                  totalInterpreteLibras={totaisParaCardsPorCategoria.totalInterpreteLibras}
                  totalMulheres={totaisParaCardsPorCategoria.totalMulheres}
                  totalHomens={totaisParaCardsPorCategoria.totalHomens}
                  totalJovens={totaisParaCardsPorCategoria.totalJovens}
                  totalAdultos={totaisParaCardsPorCategoria.totalAdultos}
                  totalIdosos={totaisParaCardsPorCategoria.totalIdosos}
                  totalAnalfabetos={totaisParaCardsPorCategoria.totalAnalfabetos}
                  totalEleitoresGeral={totaisEleitoradoGeral.totalEleitores}
                  totalBiometriaGeral={totaisEleitoradoGeral.totalBiometria}
                  totalDeficienciaGeral={totaisEleitoradoGeral.totalDeficiencia}
                  totalNomeSocialGeral={totaisEleitoradoGeral.totalNomeSocial}
                  totalQuilombolaGeral={totaisEleitoradoGeral.totalQuilombola}
                  totalInterpreteLibrasGeral={totaisEleitoradoGeral.totalInterpreteLibras}
                  totalMulheresGeral={totaisEleitoradoGeral.totalMulheres}
                  totalHomensGeral={totaisEleitoradoGeral.totalHomens}
                  totalJovensGeral={totaisEleitoradoGeral.totalJovens}
                  totalAdultosGeral={totaisEleitoradoGeral.totalAdultos}
                  totalIdososGeral={totaisEleitoradoGeral.totalIdosos}
                  totalAnalfabetosGeral={totaisEleitoradoGeral.totalAnalfabetos}
                  filtrosAtivos={filtrosEstaoAtivos}
                />

              {abaAtiva === 'Visão Geral' ? (
                  <RankingEleitorado
                      mapMunicipioMetrics={mapMunicipioMetrics}
                      carregando={carregando}
                    />
                ) : (
                  <GraficoDinamicoEleitorado
                    dadosFiltrados={dadosFiltradosParaExibicao}
                    abaAtiva={abaAtiva}
                    carregando={carregando}
                  />
                )}

              </>
            )}

            {!carregando && dadosCompletos.length === 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 w-full">
                Não foi possível carregar os dados do eleitorado. Verifique a fonte dos dados e as rotas de API.
                <button
                  onClick={handleRecarregarDados}
                  className="mt-2 inline-flex items-center rounded-md border border-red-300 bg-red-500 text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Tentar Recarregar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}