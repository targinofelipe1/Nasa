'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import EleitoradoCards from '@/components/ui/EleitoradoCards';
import MapaParaibaEleitorado from '@/components/ui/MapaParaibaEleitorado';
import FiltrosDemograficos from '@/components/ui/FiltrosDemograficos';
import TabelaEleitorado from '@/components/ui/TabelaEleitorado';
import FiltrosEleitorado from '@/components/ui/FiltrosEleitorado';
import RankingEleitorado from '@/components/ui/RankingEleitorado';
import GraficoDinamicoEleitorado from '@/components/ui/GraficoDinamicoEleitorado';

// --- INTERFACES ---
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
// --- FIM INTERFACES ---

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

  const [carregandoEleitorado, setCarregandoEleitorado] = useState(true);
  const [carregandoLocais, setCarregandoLocais] = useState(false);

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
      // Padroniza o valor antes de adicionar às opções únicas
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

    setCarregandoEleitorado(true);

    setDadosCompletos([]);
    setMunicipioSelecionado('TODOS OS MUNICÍPIOS');
    setZonaSelecionada('TODAS AS ZONAS');
    setSecaoSelecionada('TODAS AS SEÇÕES');
    setLocalSelecionado('TODOS OS LOCAIS');
    setTermoBuscaLocal('');
    setGenerosDisponiveis([]);
    setEstadosCivisDisponiveis([]);
    setFaixasEtariasDisponiveis([]);
    setEscolaridadesDisponiveis([]);
    setRacasCoresDisponiveis([]);
    setIdentidadesGeneroDisponiveis([]);
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

    const fetchData = async () => {
      const todosOsDadosBrutos: EleitoradoAgregado[] = [];
      const cacheKey = `eleitoradoCompletos_${planilhasEleitorado.join('_')}`;

      try {
        if (typeof window !== 'undefined') {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsedCache: EleitoradoAgregado[] = JSON.parse(cachedData);
            setDadosCompletos(parsedCache);

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

            parsedCache.forEach(item => {
              totalEleitoresGeral += item['Qtd. Eleitores'];
              totalBiometriaGeral += item['Qtd. com Biometria'];
              totalDeficienciaGeral += item['Qtd. com Deficiência'];
              totalNomeSocialGeral += item['Qtd. com Nome Social'];
              if (item['Quilombola']?.toUpperCase().trim() === 'SIM') totalQuilombolaGeral += item['Qtd. Eleitores'];
              if (item['Intérprete de Libras']?.toUpperCase().trim() === 'SIM') totalInterpreteLibrasGeral += item['Qtd. Eleitores'];
              
              const genero = item['Gênero']?.toUpperCase().trim();
              if (genero === 'FEMININO') totalMulheresGeral += item['Qtd. Eleitores'];
              if (genero === 'MASCULINO') totalHomensGeral += item['Qtd. Eleitores'];

              const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
              if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
                totalJovensGeral += item['Qtd. Eleitores'];
              } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
                totalAdultosGeral += item['Qtd. Eleitores'];
              } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
                totalIdososGeral += item['Qtd. Eleitores'];
              }

              const escolaridade = item['Escolaridade']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
              if (escolaridade === 'ANALFABETO') {
                totalAnalfabetosGeral += item['Qtd. Eleitores'];
              }
            });

            setTotaisEleitoradoGeral({
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
            });

            setMunicipiosDisponiveis(getUniqueOptions(parsedCache, 'Município'));
            setGenerosDisponiveis(getUniqueOptions(parsedCache, 'Gênero'));
            setEstadosCivisDisponiveis(getUniqueOptions(parsedCache, 'Estado Civil'));
            setFaixasEtariasDisponiveis(getUniqueOptions(parsedCache, 'Faixa Etária'));
            setEscolaridadesDisponiveis(getUniqueOptions(parsedCache, 'Escolaridade'));
            setRacasCoresDisponiveis(getUniqueOptions(parsedCache, 'Raça/Cor'));
            setIdentidadesGeneroDisponiveis(getUniqueOptions(parsedCache, 'Identidade de Gênero'));

            setCarregandoEleitorado(false);
            return;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dados do cache, buscando dados novos:", e);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(cacheKey);
        }
      }

      const fetchPromises = planilhasEleitorado.map(async (id) => {
        try {
          const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
          const json = await res.json();
          return json.data?.slice(1) || [];
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.warn('Requisição abortada para planilha:', id);
          } else {
            console.error(`Erro ao carregar dados da planilha ${id}:`, err);
          }
          return [];
        }
      });

      const allLines = await Promise.all(fetchPromises);
      const combinedLines = allLines.flat();

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

      setDadosCompletos(todosOsDadosBrutos);

      setMunicipiosDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Município'));
      setGenerosDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Gênero'));
      setEstadosCivisDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Estado Civil'));
      setFaixasEtariasDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Faixa Etária'));
      setEscolaridadesDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Escolaridade'));
      setRacasCoresDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Raça/Cor'));
      setIdentidadesGeneroDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Identidade de Gênero'));

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

      todosOsDadosBrutos.forEach((item: EleitoradoAgregado) => {
        totalEleitoresGeral += item['Qtd. Eleitores'];
        totalBiometriaGeral += item['Qtd. com Biometria'];
        totalDeficienciaGeral += item['Qtd. com Deficiência'];
        totalNomeSocialGeral += item['Qtd. com Nome Social'];
        if (item['Quilombola']?.toUpperCase().trim() === 'SIM') {
          totalQuilombolaGeral += item['Qtd. Eleitores'];
        }
        if (item['Intérprete de Libras']?.toUpperCase().trim() === 'SIM') {
          totalInterpreteLibrasGeral += item['Qtd. Eleitores'];
        }
        
        const genero = item['Gênero']?.toUpperCase().trim();
        if (genero === 'FEMININO') totalMulheresGeral += item['Qtd. Eleitores'];
        if (genero === 'MASCULINO') totalHomensGeral += item['Qtd. Eleitores'];

        const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
        if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
          totalJovensGeral += item['Qtd. Eleitores'];
        } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
          totalAdultosGeral += item['Qtd. Eleitores'];
        } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
          totalIdososGeral += item['Qtd. Eleitores'];
        }

        const escolaridade = item['Escolaridade']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
        if (escolaridade === 'ANALFABETO') {
          totalAnalfabetosGeral += item['Qtd. Eleitores'];
        }
      });

      setTotaisEleitoradoGeral({
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
      });

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(todosOsDadosBrutos));
        }
      } catch (e) {
        console.warn('Erro ao salvar no cache (provavelmente QuotaExceededError):', e);
      }
      setCarregandoEleitorado(false);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [getUniqueOptions, planilhasEleitorado]);

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

      const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
      if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
        metrics[municipio].totalJovens += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
        metrics[municipio].totalAdultos += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
        metrics[municipio].totalIdosos += item['Qtd. Eleitores'];
      }
      
      const escolaridade = item['Escolaridade']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
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

    // Filtros Demográficos - Garante que as comparações usem valores padronizados
    if (generoSelecionado !== 'Todos os Gêneros') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Gênero']?.toUpperCase().trim() === generoSelecionado.toUpperCase().trim()); }
    if (estadoCivilSelecionado !== 'Todos os Estados Civis') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Estado Civil']?.toUpperCase().trim() === estadoCivilSelecionado.toUpperCase().trim()); }
    if (faixaEtariaSelecionada !== 'Todas as Faixas Etárias') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Faixa Etária']?.toUpperCase().trim() === faixaEtariaSelecionada.toUpperCase().trim()); } // Corrigido: .toUpperCase()
    if (escolaridadeSelecionada !== 'Todas as Escolaridades') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Escolaridade']?.toUpperCase().trim() === escolaridadeSelecionada.toUpperCase().trim()); }
    if (racaCorSelecionada !== 'Todas as Raças/Cores') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Raça/Cor']?.toUpperCase().trim() === racaCorSelecionada.toUpperCase().trim()); }
    if (identidadeGeneroSelecionada !== 'Todos os Identidades de Gênero') { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Identidade de Gênero']?.toUpperCase().trim() === identidadeGeneroSelecionada.toUpperCase().trim()); }
    if (incluirQuilombola) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Quilombola']?.toUpperCase().trim() === 'SIM'); }
    if (incluirInterpreteLibras) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Intérprete de Libras']?.toUpperCase().trim() === 'SIM'); }
    if (incluirComBiometria) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Biometria'] > 0); }
    if (incluirComDeficiencia) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Deficiência'] > 0); }
    if (incluirComNomeSocial) { dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: EleitoradoAgregado) => dado['Qtd. com Nome Social'] > 0); }

    setGenerosDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Gênero'));
    setEstadosCivisDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Estado Civil'));
    setFaixasEtariasDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Faixa Etária'));
    setEscolaridadesDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Escolaridade'));
    setRacasCoresDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Raça/Cor'));
    setIdentidadesGeneroDisponiveis(getUniqueOptions(dadosAtuaisFiltrados, 'Identidade de Gênero'));

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

    let dadosGeograficosFiltradosParaCards: EleitoradoAgregado[] = [...dadosCompletos];

    if (municipioSelecionado !== 'TODOS OS MUNICÍPIOS') {
      dadosGeograficosFiltradosParaCards = dadosGeograficosFiltradosParaCards.filter(
        (dado: EleitoradoAgregado) => dado['Município'] === municipioSelecionado
      );
    }
    if (zonaSelecionada !== 'TODAS AS ZONAS') {
      dadosGeograficosFiltradosParaCards = dadosGeograficosFiltradosParaCards.filter(
        (dado: EleitoradoAgregado) => dado['Zona Eleitoral'] === zonaSelecionada
      );
    }
    if (localSelecionado !== 'TODOS OS LOCAIS') {
      dadosGeograficosFiltradosParaCards = dadosGeograficosFiltradosParaCards.filter(
        (dado: EleitoradoAgregado) => dado['Local de Votação']?.trim().toUpperCase() === localSelecionado.trim().toUpperCase()
      );
    }
    if (secaoSelecionada !== 'TODAS AS SEÇÕES') {
      dadosGeograficosFiltradosParaCards = dadosGeograficosFiltradosParaCards.filter(
        (dado: EleitoradoAgregado) => dado['Seção Eleitoral']?.trim() === secaoSelecionada.trim()
      );
    }

    let currentTotalEleitores = 0;
    let currentTotalBiometria = 0;
    let currentTotalDeficiencia = 0;
    let currentTotalNomeSocial = 0;
    let currentTotalQuilombola = 0;
    let currentTotalInterpreteLibras = 0;
    let currentTotalMulheres = 0;
    let currentTotalHomens = 0;
    let currentTotalJovens = 0;
    let currentTotalAdultos = 0;
    let currentTotalIdosos = 0;
    let currentTotalAnalfabetos = 0;


    dadosGeograficosFiltradosParaCards.forEach((item: EleitoradoAgregado) => {
      currentTotalEleitores += item['Qtd. Eleitores'];
      currentTotalBiometria += item['Qtd. com Biometria'];
      currentTotalDeficiencia += item['Qtd. com Deficiência'];
      currentTotalNomeSocial += item['Qtd. com Nome Social'];
      if (item['Quilombola']?.toUpperCase().trim() === 'SIM') currentTotalQuilombola += item['Qtd. Eleitores'];
      if (item['Intérprete de Libras']?.toUpperCase().trim() === 'SIM') currentTotalInterpreteLibras += item['Qtd. Eleitores'];
      
      const genero = item['Gênero']?.toUpperCase().trim();
      if (genero === 'FEMININO') currentTotalMulheres += item['Qtd. Eleitores'];
      if (genero === 'MASCULINO') currentTotalHomens += item['Qtd. Eleitores'];

      const faixaEtaria = item['Faixa Etária']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
      if (faixaEtaria === '16 A 17 ANOS' || faixaEtaria === '18 A 20 ANOS' || faixaEtaria === '21 A 24 ANOS') {
        currentTotalJovens += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '25 A 29 ANOS' || faixaEtaria === '30 A 34 ANOS' || faixaEtaria === '35 A 39 ANOS' || faixaEtaria === '40 A 44 ANOS' || faixaEtaria === '45 A 49 ANOS' || faixaEtaria === '50 A 54 ANOS' || faixaEtaria === '55 A 59 ANOS') {
        currentTotalAdultos += item['Qtd. Eleitores'];
      } else if (faixaEtaria === '60 A 64 ANOS' || faixaEtaria === '65 A 69 ANOS' || faixaEtaria === '70 A 74 ANOS' || faixaEtaria === '75 A 79 ANOS' || faixaEtaria === '80 A 84 ANOS' || faixaEtaria === '85 A 89 ANOS' || faixaEtaria === '90 A 94 ANOS' || faixaEtaria === '95 A 99 ANOS' || faixaEtaria === 'SUPERIOR A 100 ANOS') {
        currentTotalIdosos += item['Qtd. Eleitores'];
      }

      const escolaridade = item['Escolaridade']?.toUpperCase().trim(); // Corrigido: .toUpperCase()
      if (escolaridade === 'ANALFABETO') {
        currentTotalAnalfabetos += item['Qtd. Eleitores'];
      }
    });

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
    municipioSelecionado, zonaSelecionada, secaoSelecionada, localSelecionado, termoBuscaLocal,
    generoSelecionado, estadoCivilSelecionado, faixaEtariaSelecionada, escolaridadeSelecionada,
    racaCorSelecionada, identidadeGeneroSelecionada, incluirQuilombola, incluirInterpreteLibras,
    incluirComBiometria, incluirComDeficiencia, incluirComNomeSocial,
    dadosCompletos, carregandoEleitorado, getUniqueOptions
  ]);

  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto">
          <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200 px-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="text-black font-medium">Painel</span> /
              <span className="text-gray-400"> Eleitorado</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel do Eleitorado</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
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
                    setGenerosDisponiveis([]);
                    setEstadosCivisDisponiveis([]);
                    setFaixasEtariasDisponiveis([]);
                    setEscolaridadesDisponiveis([]);
                    setRacasCoresDisponiveis([]);
                    setIdentidadesGeneroDisponiveis([]);
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

          <div className="p-6 space-y-4">
            {carregando ? (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}