'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import MapaParaibaCandidato from '../../../components/ui/MapaParaibaCandidato';
import CandidatoCard from '@/components/ui/CandidatoCard';
import VotacaoCards from '@/components/ui/VotacaoCards';
const HeatmapParaibaVotos = dynamic(
  () => import('@/components/ui/HeatmapParaibaVotos'),
  {
    ssr: false, 
    loading: () => <p>Carregando mapa de calor...</p>, 
  }
);
import dynamic from 'next/dynamic';
import CandidatoPerformanceViz from '@/components/ui/CandidatoPerformanceViz';
import RankingCandidatoCidade from '@/components/ui/RankingCandidatoCidade';

interface VotoAgregadoCandidato {
  nome: string;
  totalVotos: number;
  siglaPartido: string;
}

interface CandidatoDropdownOption {
  nome: string;
  siglaPartido: string;
  numeroCandidato?: string;
}

interface VotoAgregadoCandidatoRanking extends VotoAgregadoCandidato {
  porcentagem: number;
  cargo: string;
  municipio: string;
  numeroCandidato: string;
  posicaoRanking: number;
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

interface SectionMetrics {
  aptos: number;
  comp: number;
  abst: number;
  localCode: string;
  municipio: string;
  zona: string;
  secao: string;
}

interface VotoCandidatoPorLocal {
  nome: string;
  totalVotos: number;
  siglaPartido: string;
  localVotacao: string;
  nomeLocal: string;
  enderecoLocal: string;
  bairroLocal: string;
  porcentagem: number;
  posicaoRankingLocal: number;
  secaoEleitoral?: string;
}

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PainelVotacao() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [zonaSelecionada, setZonaSelecionada] = useState('Todas as Zonas');
  const [secaoSelecionada, setSecaoSelecionada] = useState('Todas as Seções');
  const [siglaSelecionada, setSiglaSelecionada] = useState('Todas as Siglas');
  const [termoBuscaCandidato, setTermoBuscaCandidato] = useState('Todos os Candidatos');
  const [localSelecionado, setLocalSelecionado] = useState('Todos os Locais');
  const [termoBuscaLocal, setTermoBuscaLocal] = useState('');


  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]);
  const [siglasDisponiveis, setSiglasDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveisDropdown, setLocaisDisponiveisDropdown] = useState<{ id: string, label: string }[]>([]);

  const [votosCandidatoPorLocal, setVotosCandidatoPorLocal] = useState<VotoCandidatoPorLocal[]>([]);
  const [locaisVotacaoFiltradosParaExibicao, setLocaisVotacaoFiltradosParaExibicao] = useState<LocalVotacaoDetalhado[]>([]);
  const [votosAgrupadosCandidatos, setVotosAgrupadosCandidatos] = useState<VotoAgregadoCandidato[]>([]);

  const [dadosGeraisAbaAtiva, setDadosGeraisAbaAtiva] = useState({
    eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
    locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
  });
  const [dadosGeraisFiltrados, setDadosGeraisFiltrados] = useState({
    eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
    locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
  });

  const [dadosCompletosParaMapa, setDadosCompletosParaMapa] = useState<any[]>([]);
  const [dadosFiltradosSemBuscaCandidatoOuPartido, setDadosFiltradosSemBuscaCandidatoOuPartido] = useState<any[]>([]);
  const [dadosFinalFiltrados, setDadosFinalFiltrados] = useState<any[]>([]);
  const [allSectionMetrics, setAllSectionMetrics] = useState<Map<string, SectionMetrics>>(new Map());

  const [carregando, setCarregando] = useState(true);
  const [algumFiltroAplicado, setAlgumFiltroAplicado] = useState(false);
  const [algumFiltroGeograficoAplicado, setAlgumFiltroGeograficoAplicado] = useState(false);

  const [cargoRankingSelecionado, setCargoRankingSelecionado] = useState('Presidente');
  const [municipioRankingSelecionado, setMunicipioRankingSelecionado] = useState('JOÃO PESSOA');
  const [siglaRankingSelecionada, setSiglaRankingSelecionada] = useState('Todas as Siglas');
  const [candidatoRankingSelecionado, setCandidatoRankingSelecionado] = useState('Todos os Candidatos');
  const [candidatosRankingDropdown, setCandidatosRankingDropdown] = useState<CandidatoDropdownOption[]>([]);
  const [ordenacaoColunaRanking, setOrdenacaoColunaRanking] = useState('totalVotos');
  const [ordenacaoDirecaoRanking, setOrdenacaoDirecaoRanking] = useState<'asc' | 'desc'>('desc');
  const [candidatosRanking, setCandidatosRanking] = useState<VotoAgregadoCandidatoRanking[]>([]);

  const [paginaAtualRanking, setPaginaAtualRanking] = useState(1);
  const [itensPorPaginaRanking, setItensPorPaginaRanking] = useState(10);
  const [paginaAtualVotosLocal, setPaginaAtualVotosLocal] = useState(1);
  const [itensPorPaginaVotosLocal, setItensPorPaginaVotosLocal] = useState(10);

  const [candidatosParaDetalheLocalDropdown, setCandidatosParaDetalheLocalDropdown] = useState<CandidatoDropdownOption[]>([]);
  const [candidatoDetalheLocalSelecionado, setCandidatoDetalheLocalSelecionado] = useState('Todos os Candidatos');
  const [votosCandidatoPorLocalDetalhado, setVotosCandidatoPorLocalDetalhado] = useState<VotoCandidatoPorLocal[]>([]);
  const [paginaAtualVotosLocalDetalhado, setPaginaAtualVotosLocalDetalhado] = useState(1);
  const [itensPorPaginaVotosLocalDetalhado, setItensPorPaginaVotosLocalDetalhado] = useState(10);
  const [municipioDetalheLocalSelecionado, setMunicipioDetalheLocalSelecionado] = useState('JOÃO PESSOA');
  const [ordenacaoColunaDetalheLocal, setOrdenacaoColunaDetalheLocal] = useState('totalVotos');
  const [ordenacaoDirecaoDetalheLocal, setOrdenacaoDirecaoDetalheLocal] = useState<'asc' | 'desc'>('desc');
  const [bairroDetalheLocalSelecionado, setBairroDetalheLocalSelecionado] = useState('Todos os Bairros');
  const [bairrosDisponiveisDetalheLocal, setBairrosDisponiveisDetalheLocal] = useState<string[]>([]);
  const [candidatosRankingDropdownFiltrado, setCandidatosRankingDropdownFiltrado] = useState<CandidatoDropdownOption[]>([]); 
  const [candidatosFiltroPrincipalDropdown, setCandidatosFiltroPrincipalDropdown] = useState<CandidatoDropdownOption[]>([]); 
  const resumoCacheRef = useRef<Record<string, any>>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('votacaoResumo') || '{}')
      : {}
  );
  const municipioAnteriorRef = useRef(municipioSelecionado);
  const localAnteriorRef = useRef(localSelecionado);
  const zonaAnteriorRef = useRef(zonaSelecionada);
  const secaoAnteriorRef = useRef(secaoSelecionada);
  const [paginaAtualCandidatoCards, setPaginaAtualCandidatoCards] = useState(1);
  const [itensPorPaginaCandidatoCards, setItensPorPaginaCandidatoCards] = useState(12); 


  const abas = ['Visão Geral', 'Visão Geral 2º turno','Presidente', 'Presidente 2º turno', 'Senador', 'Governador', 'Deputado Federal', 'Deputado Estadual'];
  const planilhasPorCargo: Record<string, string[]> = {
    'Visão Geral': [
      'presidente_2018', 'senador_2018', 'governador_2018',
      'grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018',
      'grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018',
    ],
    'Visão Geral 2º turno': ['presidente_2018_2'],
    Presidente: ['presidente_2018'],
    'Presidente 2º turno': ['presidente_2018_2'],
    Senador: ['senador_2018'],
    Governador: ['governador_2018'],
    'Deputado Federal': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'],
    'Deputado Estadual': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'],
  };
  const cargosDisponiveisParaRanking = useMemo(() => {
    let cargos = abas.filter(aba => aba !== 'Visão Geral' && aba !== 'Visão Geral 2º turno');
    if (abaAtiva === 'Visão Geral') {
      cargos = cargos.filter(cargo => cargo !== 'Presidente 2º turno');
    }
    if (abaAtiva === 'Visão Geral 2º turno') {
        cargos = ['Presidente 2º turno'];
    }
    return cargos;
  }, [abaAtiva, abas]);
  const [municipiosDisponiveisParaRanking, setMunicipiosDisponiveisParaRanking] = useState<string[]>([]);

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

  

  const safeParseVotes = useCallback((value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

  const [dadosLocais, setDadosLocais] = useState<LocalVotacaoDetalhado[]>([]);
  const locaisCarregadosRef = useRef(false);

  useEffect(() => {
    const fetchLocais = async () => {
      if (locaisCarregadosRef.current) return;

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
      } catch (error) {
        console.error('Erro ao carregar dados da planilha de locais:', error);
      }
    };
    fetchLocais();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setCarregando(true);
    setDadosCompletosParaMapa([]);
    setVotosAgrupadosCandidatos([]);
    setDadosFiltradosSemBuscaCandidatoOuPartido([]);
    setLocaisVotacaoFiltradosParaExibicao([]);
    setVotosCandidatoPorLocal([]);
    setDadosFinalFiltrados([]);

    setLocalSelecionado('Todos os Locais');
    setZonaSelecionada('Todas as Zonas');
    setSecaoSelecionada('Todas as Seções');
    setSiglaSelecionada('Todas as Siglas');
    setTermoBuscaCandidato('Todos os Candidatos');
    setTermoBuscaLocal('');
    setAlgumFiltroAplicado(false);
    setAlgumFiltroGeograficoAplicado(false);

    setMunicipiosDisponiveis([]);
    setZonasDisponiveis([]);
    setSecoesDisponiveis([]);
    setLocaisDisponiveis([]);
    setLocaisDisponiveisDropdown([]);

    setSiglaRankingSelecionada('Todas as Siglas');
    setCandidatoRankingSelecionado('Todos os Candidatos');
    setOrdenacaoColunaRanking('totalVotos');
    setOrdenacaoDirecaoRanking('desc');
    setCandidatosRanking([]);
    setPaginaAtualRanking(1);
    setPaginaAtualVotosLocal(1);
    setCandidatoDetalheLocalSelecionado('Todos os Candidatos');
    setMunicipioDetalheLocalSelecionado('JOÃO PESSOA');
    setVotosCandidatoPorLocalDetalhado([]);
    setPaginaAtualVotosLocalDetalhado(1);
    setOrdenacaoColunaDetalheLocal('totalVotos');
    setOrdenacaoDirecaoDetalheLocal('desc');


    const resumoSalvo = resumoCacheRef.current[abaAtiva];
    const dadosCompletosCache = typeof window !== 'undefined' ? localStorage.getItem(`votacaoCompletos-${abaAtiva}`) : null;

    const fetchData = async () => {
      const ids = planilhasPorCargo[abaAtiva];
      const todosOsDadosBrutos: any[] = [];
      const tempSectionDataForMetrics = new Map<string, SectionMetrics>();

      let dadosPrimeiroTurnoPresidente: any[] = [];
      if (abaAtiva === 'Visão Geral 2º turno') {
          try {
              const res1T = await fetch(`/api/sheets/eleicao/presidente_2018`, { signal });
              const json1T = await res1T.json();
              const linhas1T: string[][] = json1T.data?.slice(1) || [];
              dadosPrimeiroTurnoPresidente = linhas1T.map(linha => ({
                  'Município': linha[0]?.trim(),
                  'Zona Eleitoral': linha[1]?.trim(),
                  'Seção Eleitoral': linha[2]?.trim(),
                  'Local de Votação': linha[3]?.trim(),
                  'Nome do Candidato/Voto': (linha[12] || '').trim().toUpperCase(),
                  'Quantidade de Votos': safeParseVotes(linha[13]),
                  'Sigla do Partido': (linha[6] || '').trim(),
                  Cargo: 'Presidente',
              }));
          } catch (err) {
              if ((err as any).name === 'AbortError') {
                console.warn('Requisição do 1º turno abortada.');
              } else {
                console.error('Erro ao carregar dados do 1º turno para insights:', err);
              }
          }
      }

      for (const id of ids) {
        try {
          const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
          const json = await res.json();
          const linhas: string[][] = json.data?.slice(1) || [];

          const cargoMap: Record<string, string> = {
            'presidente_2018': 'Presidente',
            'presidente_2018_2': 'Presidente 2º turno',
            'senador_2018': 'Senador',
            'governador_2018': 'Governador',
            'grupo_federal1_2018': 'Deputado Federal',
            'grupo_federal2_2018': 'Deputado Federal',
            'grupo_federal3_2018': 'Deputado Federal',
            'deputado_federaljp_2018': 'Deputado Federal',
            'grupo_estadual1_2018': 'Deputado Estadual',
            'grupo_estadual2_2018': 'Deputado Estadual',
            'grupo_estadual3_2018': 'Deputado Estadual',
            'deputado_estadualjp_2018': 'Deputado Estadual',
          };
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

            const sectionKey = `${municipio}_${zona}_${secao}`;
            if (!tempSectionDataForMetrics.has(sectionKey)) {
              tempSectionDataForMetrics.set(sectionKey, {
                aptos: aptRow, comp: compRow, abst: abstRow,
                localCode: local, municipio: municipio, zona: zona, secao: secao,
              });
            }

            const infoLocal = dadosLocais.find(l =>
              l['Município'] === municipio &&
              l['Zona Eleitoral'] === zona &&
              l['Seção Eleitoral'] === secao &&
              l['Local de Votação'] === local
            );

            todosOsDadosBrutos.push({
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
            console.warn('Requisição abortada:', id);
            return;
          } else {
            console.error('Erro ao carregar dados:', err);
          }
        }
      }
      setAllSectionMetrics(tempSectionDataForMetrics);

      const uniqueMunicipalities = getUniqueOptions(todosOsDadosBrutos, 'Município');
      setMunicipiosDisponiveis(uniqueMunicipalities);
      setMunicipiosDisponiveisParaRanking(uniqueMunicipalities);
      setDadosCompletosParaMapa(todosOsDadosBrutos);

      const siglasDoCargo = getUniqueOptions(todosOsDadosBrutos, 'Sigla do Partido');
      const filteredSiglasDoCargo = siglasDoCargo.filter((sigla: string) => sigla.toLowerCase() !== '#nulo#');
      setSiglasDisponiveis(filteredSiglasDoCargo);

      let finalAptos = 0;
      let finalComp = 0;
      let finalAbst = 0;
      const finalUniqueLocalsCount = new Set<string>();
      tempSectionDataForMetrics.forEach(metric => {
          finalAptos += metric.aptos;
          finalComp += metric.comp;
          finalAbst += metric.abst;
          finalUniqueLocalsCount.add(metric.localCode);
      });

      let finalValidos = 0;
      let finalBrancos = 0;
      let finalNulos = 0;
      todosOsDadosBrutos.forEach((item: any) => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        const votos = item['Quantidade de Votos'] || 0;
        if (nome === 'BRANCO') {
          finalBrancos += votos;
        } else if (nome === 'NULO' || sigla === '#nulo#') {
          finalNulos += votos;
        } else {
          finalValidos += votos;
        }
      });

      const resumoParaCards = {
        eleitoresAptos: finalAptos, comparecimentos: finalComp, abstencoes: finalAbst,
        taxaAbstencao: finalAptos > 0 ? (finalAbst / finalAptos) * 100 : 0,
        locais: finalUniqueLocalsCount.size, secoes: tempSectionDataForMetrics.size,
        validos: finalValidos, brancos: finalBrancos, nulos: finalNulos,
      };
      setDadosGeraisAbaAtiva(resumoParaCards);
      setDadosGeraisFiltrados(resumoParaCards);


      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`votacaoCompletos-${abaAtiva}`, JSON.stringify(todosOsDadosBrutos));
        }

        if (typeof window == 'undefined') {
          console.warn('Cache excedido na verdade é undefined')
        }
      } catch {
        console.warn('Cache excedido para:', abaAtiva);
      }

      resumoCacheRef.current[abaAtiva] = resumoParaCards;
      if (typeof window !== 'undefined') {
        localStorage.setItem('votacaoResumo', JSON.stringify(resumoCacheRef.current));
      }

      setCarregando(false);
    };

    let shouldFetch = true;
    if (resumoSalvo && dadosLocais.length > 0) {
      setDadosGeraisAbaAtiva(resumoSalvo);
      setDadosGeraisFiltrados(resumoSalvo);
      if (dadosCompletosCache) {
        try {
          const cachedData = JSON.parse(dadosCompletosCache);
          const processedCachedDataWithLocais = cachedData.map((dado: any) => {
            const infoLocal = dadosLocais.find(l =>
              l['Município'] === dado['Município'] &&
              l['Zona Eleitoral'] === dado['Zona Eleitoral'] &&
              l['Seção Eleitoral'] === dado['Seção Eleitoral'] &&
              l['Local de Votação'] === dado['Local de Votação']
            );
            return {
              ...dado,
              'Quantidade de Votos': safeParseVotes(dado['Quantidade de Votos']),
              'Endereço do Local': infoLocal?.['Endereço do Local'] || 'N/A',
              'Bairro do Local': infoLocal?.['Bairro do Local'] || 'N/A',
              'Nome do Local': infoLocal?.['Nome do Local'] || 'N/A',
            };
          });

          const uniqueMunicipalities = getUniqueOptions(processedCachedDataWithLocais, 'Município');
          setMunicipiosDisponiveis(uniqueMunicipalities);
          setMunicipiosDisponiveisParaRanking(uniqueMunicipalities);
          setDadosCompletosParaMapa(processedCachedDataWithLocais);

          const siglasDoCargo = getUniqueOptions(processedCachedDataWithLocais, 'Sigla do Partido');
          const filteredSiglasDoCargo = siglasDoCargo.filter((sigla: string) => sigla.toLowerCase() !== '#nulo#');
          setSiglasDisponiveis(filteredSiglasDoCargo);


          shouldFetch = false;
        } catch (e) {
          console.error("Erro ao analisar dados do cache, buscando dados novos:", e);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`votacaoCompletos-${abaAtiva}`);
          }
        }
      }
    }

    if (shouldFetch && dadosLocais.length > 0) {
      fetchData();
    } else if (shouldFetch && dadosLocais.length === 0) {
      setCarregando(true);
    } else {
      setCarregando(false);
    }

    return () => {
      controller.abort();
    };
  }, [abaAtiva, getUniqueOptions, safeParseVotes, dadosLocais]);

  const getPaginationNumbers = useCallback((currentPage: number, totalPages: number, siblingCount = 1) => {
    const totalPageNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalPageNumbers + 2;

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

      let pagesToProcess: (number | string)[] = [];

      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;

      pagesToProcess.push(1);

      if (hasLeftSpill) {
        pagesToProcess.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pagesToProcess.push(i);
      }

      if (hasRightSpill) {
        pagesToProcess.push('...');
      }

      if (totalPages > 1 && !pagesToProcess.includes(totalPages)) {
        pagesToProcess.push(totalPages);
      }

      const uniqueAndSortedPages: (number | string)[] = [];
      const seenNumbers = new Set<number>();
      
      if (totalPages >= 1 && !pagesToProcess.includes(1)) {
          uniqueAndSortedPages.push(1);
          seenNumbers.add(1);
      }

      pagesToProcess.forEach(page => {
          if (typeof page === 'number') {
              if (!seenNumbers.has(page)) {
                  uniqueAndSortedPages.push(page);
                  seenNumbers.add(page);
              }
          } else if (page === '...') {
              uniqueAndSortedPages.push('...');
          }
      });

      const finalCleanedPages: (number | string)[] = [];
      for (let i = 0; i < uniqueAndSortedPages.length; i++) {
          if (uniqueAndSortedPages[i] === '...') {
              if (typeof uniqueAndSortedPages[i-1] === 'number' && typeof uniqueAndSortedPages[i+1] === 'number' &&
                  (uniqueAndSortedPages[i+1] as number) - (uniqueAndSortedPages[i-1] as number) <= (siblingCount * 2 + 2) + 1 ) { 
              } else {
                  finalCleanedPages.push('...');
              }
          } else {
              finalCleanedPages.push(uniqueAndSortedPages[i]);
          }
      }
      
      const finalFilteredAndOrdered: (number | string)[] = [];
      let lastPushed: number | string | null = null;

      finalCleanedPages.forEach((item, index) => {
          if (item === '...') {
              if (lastPushed !== '...') {
                  const prevNum = typeof lastPushed === 'number' ? (lastPushed as number) : null;
                  const nextNum = typeof finalCleanedPages[index+1] === 'number' ? (finalCleanedPages[index+1] as number) : null;

                  if (prevNum !== null && nextNum !== null && nextNum - prevNum === 2) {
                      finalFilteredAndOrdered.push(prevNum + 1);
                  } else {
                      finalFilteredAndOrdered.push('...');
                  }
              }
          } else {
              finalFilteredAndOrdered.push(item);
          }
          lastPushed = item;
      });

      if (finalFilteredAndOrdered.length > 1 && finalFilteredAndOrdered[0] === '...' && finalFilteredAndOrdered[1] === 1) {
          finalFilteredAndOrdered.shift();
      }
      if (finalFilteredAndOrdered.length > 1 && finalFilteredAndOrdered[finalFilteredAndOrdered.length - 1] === '...' && finalFilteredAndOrdered[finalFilteredAndOrdered.length - 2] === totalPages) {
          finalFilteredAndOrdered.pop();
      }
      const noConsecutiveEllipses = finalFilteredAndOrdered.filter((item, index, arr) => !(item === '...' && arr[index - 1] === '...'));

      return noConsecutiveEllipses;

    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, []);

  
useEffect(() => {
    if (carregando || dadosCompletosParaMapa.length === 0) {
      setDadosFiltradosSemBuscaCandidatoOuPartido([]);
      setVotosAgrupadosCandidatos([]);
      setVotosCandidatoPorLocal([]);
      setLocaisVotacaoFiltradosParaExibicao([]);
      setZonasDisponiveis([]);
      setSecoesDisponiveis([]);
      setLocaisDisponiveis([]);
      setLocaisDisponiveisDropdown([]);
      setDadosGeraisFiltrados({
        eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
        locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
      });
      setDadosFinalFiltrados([]);
      return;
    }

    const isAnyGeographicFilterApplied =
      municipioSelecionado !== 'Todos os Municípios' ||
      zonaSelecionada !== 'Todas as Zonas' ||
      localSelecionado !== 'Todos os Locais' ||
      secaoSelecionada !== 'Todas as Seções' ||
      termoBuscaLocal !== '';
    setAlgumFiltroGeograficoAplicado(isAnyGeographicFilterApplied);

    const isAnyFilterApplied = isAnyGeographicFilterApplied || siglaSelecionada !== 'Todas as Siglas' || termoBuscaCandidato !== 'Todos os Candidatos';
    setAlgumFiltroAplicado(isAnyFilterApplied);

    municipioAnteriorRef.current = municipioSelecionado;
    zonaAnteriorRef.current = zonaSelecionada;
    localAnteriorRef.current = localSelecionado;
    secaoAnteriorRef.current = secaoSelecionada;

    let dadosComTodosFiltrosGeograficosAplicados = [...dadosCompletosParaMapa];
    let locaisParaPopularDropdowns = [...dadosLocais];

    if (municipioSelecionado !== 'Todos os Municípios') {
      dadosComTodosFiltrosGeograficosAplicados = dadosComTodosFiltrosGeograficosAplicados.filter(dado => dado['Município'] === municipioSelecionado);
      locaisParaPopularDropdowns = locaisParaPopularDropdowns.filter(local => local['Município'] === municipioSelecionado);
    }

    const newZonas = (municipioSelecionado !== 'Todos os Municípios')
      ? getUniqueOptions(locaisParaPopularDropdowns, 'Zona Eleitoral', false)
      : [];
    setZonasDisponiveis(newZonas);

    if (zonaSelecionada !== 'Todas as Zonas') {
      dadosComTodosFiltrosGeograficosAplicados = dadosComTodosFiltrosGeograficosAplicados.filter(dado => dado['Zona Eleitoral'] === zonaSelecionada);
      locaisParaPopularDropdowns = locaisParaPopularDropdowns.filter(local => local['Zona Eleitoral'] === zonaSelecionada);
    }

    const computedLocaisDataForDropdown = (municipioSelecionado !== 'Todos os Municípios' && zonaSelecionada !== 'Todas as Zonas')
      ? locaisParaPopularDropdowns.map(local => ({
            id: local['Local de Votação'],
            label: local['Nome do Local'] && local['Nome do Local'] !== 'N/A'
                ? `${local['Nome do Local']} (${local['Local de Votação']})`
                : local['Local de Votação']
          }))
      : [];

    const uniqueDropdownItems = Array.from(new Map(computedLocaisDataForDropdown.map(item => [item.id, item])).values());
    setLocaisDisponiveisDropdown(uniqueDropdownItems);
    setLocaisDisponiveis(uniqueDropdownItems.map(l => l.id));

    if (localSelecionado !== 'Todos os Locais') {
      dadosComTodosFiltrosGeograficosAplicados = dadosComTodosFiltrosGeograficosAplicados.filter(dado => dado['Local de Votação'] === localSelecionado);
      locaisParaPopularDropdowns = locaisParaPopularDropdowns.filter(local => local['Local de Votação'] === localSelecionado);
    }

    const newSecoes = (municipioSelecionado !== 'Todos os Municípios' && zonaSelecionada !== 'Todas as Zonas' && localSelecionado !== 'Todos os Locais')
      ? getUniqueOptions(locaisParaPopularDropdowns, 'Seção Eleitoral', false)
      : [];
    setSecoesDisponiveis(newSecoes);

    if (secaoSelecionada !== 'Todas as Seções') {
      dadosComTodosFiltrosGeograficosAplicados = dadosComTodosFiltrosGeograficosAplicados.filter(dado => dado['Seção Eleitoral'] === secaoSelecionada);
      locaisParaPopularDropdowns = locaisParaPopularDropdowns.filter(local => local['Seção Eleitoral'] === secaoSelecionada);
    }

    const termoLocalNormalizado = removerAcentos(termoBuscaLocal.toUpperCase());
    if (termoBuscaLocal) {
        dadosComTodosFiltrosGeograficosAplicados = dadosComTodosFiltrosGeograficosAplicados.filter(dado => {
            const nomeLocal = dado['Nome do Local']?.trim().toUpperCase();
            return nomeLocal && removerAcentos(nomeLocal).includes(termoLocalNormalizado);
        });
        locaisParaPopularDropdowns = locaisParaPopularDropdowns.filter(local => {
            const nomeLocal = local['Nome do Local']?.trim().toUpperCase();
            return nomeLocal && removerAcentos(nomeLocal).includes(termoLocalNormalizado);
        });
    }
    const uniqueCandidatosParaFiltroPrincipal = new Map<string, CandidatoDropdownOption>();
    dadosComTodosFiltrosGeograficosAplicados.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      if (nomeCandidato && siglaPartido &&
          nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
          siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatosParaFiltroPrincipal.has(key)) {
          uniqueCandidatosParaFiltroPrincipal.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    const sortedCandidatosParaFiltroPrincipal = Array.from(uniqueCandidatosParaFiltroPrincipal.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    setCandidatosFiltroPrincipalDropdown(sortedCandidatosParaFiltroPrincipal); 

    setLocaisVotacaoFiltradosParaExibicao(locaisParaPopularDropdowns);

    const siglasFiltradasGeograficamente = getUniqueOptions(dadosComTodosFiltrosGeograficosAplicados, 'Sigla do Partido');
    const filteredSiglasGeograficamente = siglasFiltradasGeograficamente.filter((sigla: string) => sigla.toLowerCase() !== '#nulo#');
    setSiglasDisponiveis(filteredSiglasGeograficamente);

    let dadosParaCalculoDeSiglasECandidatos = [...dadosComTodosFiltrosGeograficosAplicados];

    if (siglaSelecionada !== 'Todas as Siglas') {
      dadosParaCalculoDeSiglasECandidatos = dadosParaCalculoDeSiglasECandidatos.filter(dado => dado['Sigla do Partido'] === siglaSelecionada);
    }

    setDadosFiltradosSemBuscaCandidatoOuPartido(dadosParaCalculoDeSiglasECandidatos);

  
    
    if (termoBuscaCandidato !== 'Todos os Candidatos' && !sortedCandidatosParaFiltroPrincipal.some(c => c.nome === termoBuscaCandidato)) {
        setTermoBuscaCandidato('Todos os Candidatos');
    }

   

    let dadosFinalProcessados = [...dadosParaCalculoDeSiglasECandidatos];
    if (termoBuscaCandidato !== 'Todos os Candidatos') {
      const termoNormalizado = termoBuscaCandidato.toUpperCase();
      dadosFinalProcessados = dadosFinalProcessados.filter((dado: any) =>
        dado['Nome do Candidato/Voto']?.trim().toUpperCase() === termoNormalizado
      );
    } else {
      dadosFinalProcessados = dadosFinalProcessados.filter((dado: any) => {
        const nomeCandidato = dado['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = dado['Sigla do Partido']?.trim().toUpperCase();
        const isLegenda = nomeCandidato === siglaPartido;
        const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido === '#NULO#';
        return !isLegenda && !isBrancoOuNulo;
      });
    }
    setDadosFinalFiltrados(dadosFinalProcessados);

      let currentFilteredAptos = 0;
      let currentFilteredComp = 0;
      let currentFilteredAbst = 0;
      const currentUniqueFilteredLocals = new Set<string>();
      const currentUniqueFilteredSecoes = new Set<string>();

      allSectionMetrics.forEach(metric => {
          const matchesMunicipio = municipioSelecionado === 'Todos os Municípios' || metric.municipio === municipioSelecionado;
          const matchesZona = zonaSelecionada === 'Todas as Zonas' || metric.zona === zonaSelecionada;
          const matchesLocal = localSelecionado === 'Todos os Locais' || metric.localCode === localSelecionado;
          const matchesSecao = secaoSelecionada === 'Todas as Seções' || metric.secao === secaoSelecionada;
          const termoLocalNormalizado = removerAcentos(termoBuscaLocal.toUpperCase());

          let matchesTermoLocal = true;

          if (termoBuscaLocal) {
              const infoLocal = dadosLocais.find(l =>
                  l['Município'] === metric.municipio &&
                  l['Zona Eleitoral'] === metric.zona &&
                  l['Seção Eleitoral'] === metric.secao &&
                  l['Local de Votação'] === metric.localCode
              );
              const nomeLocal = infoLocal?.['Nome do Local']?.trim().toUpperCase();
              matchesTermoLocal = Boolean(nomeLocal && removerAcentos(nomeLocal).includes(termoLocalNormalizado));
          }

          if (matchesMunicipio && matchesZona && matchesLocal && matchesSecao && matchesTermoLocal) {
              currentFilteredAptos += metric.aptos;
              currentFilteredComp += metric.comp;
              currentFilteredAbst += metric.abst;
              currentUniqueFilteredSecoes.add(`${metric.municipio}_${metric.zona}_${metric.secao}`);
              currentUniqueFilteredLocals.add(metric.localCode);
          }
      });

      let currentFilteredValidos = 0;
      let currentFilteredBrancos = 0;
      let currentFilteredNulos = 0;
      let currentFilteredLegenda = 0;

      dadosFiltradosSemBuscaCandidatoOuPartido.forEach(item => {
          const nome = item['Nome do Candidato/Voto']?.toUpperCase();
          const sigla = item['Sigla do Partido']?.toUpperCase();
          const votos = item['Quantidade de Votos'] || 0;
          const isLegenda = (nome === sigla && nome !== '' && sigla !== '');
          const isBranco = nome === 'BRANCO';
          const isNulo = nome === 'NULO' || sigla === '#NULO#';

          if (isBranco) {
              currentFilteredBrancos += votos;
          } else if (isNulo) {
              currentFilteredNulos += votos;
          } else if (isLegenda) {
              currentFilteredLegenda += votos;
          } else {
              currentFilteredValidos += votos;
          }
      });
      setDadosGeraisFiltrados({
          eleitoresAptos: currentFilteredAptos,
          comparecimentos: currentFilteredComp,
          abstencoes: currentFilteredAbst,
          taxaAbstencao: currentFilteredAptos > 0 ? (currentFilteredAbst / currentFilteredAptos) * 100 : 0,
          locais: currentUniqueFilteredLocals.size,
          secoes: currentUniqueFilteredSecoes.size,
          validos: currentFilteredValidos,
          brancos: currentFilteredBrancos,
          nulos: currentFilteredNulos,
      });
      
    if ((abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && dadosCompletosParaMapa.length > 0 && termoBuscaCandidato === 'Todos os Candidatos') {
      const agregados: { [key: string]: { nome: string; totalVotos: number; siglaPartido: string; } } = {};

      let dataToAggregate = [];

      const allGeographicFiltersAreDefault =
        municipioSelecionado === 'Todos os Municípios' &&
        localSelecionado === 'Todos os Locais' &&
        zonaSelecionada === 'Todas as Zonas' &&
        secaoSelecionada === 'Todas as Seções' &&
        termoBuscaLocal === '';

      const allPartyAndSearchFiltersAreDefault =
        siglaSelecionada === 'Todas as Siglas' &&
        termoBuscaCandidato === 'Todos os Candidatos';

      if (allGeographicFiltersAreDefault && allPartyAndSearchFiltersAreDefault) {
          dataToAggregate = dadosCompletosParaMapa;
      } else {
          dataToAggregate = dadosFinalProcessados;
      }

      dataToAggregate.forEach(item => {
        const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartidoOriginal = item['Sigla do Partido']?.trim();
        const normalizedSiglaPartido = siglaPartidoOriginal ? siglaPartidoOriginal.toUpperCase() : '#NULO#';
        const votos = item['Quantidade de Votos'] || 0;

        if (nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || normalizedSiglaPartido === '#NULO#' || nomeCandidato === normalizedSiglaPartido) {
          return;
        }

        if (!agregados[nomeCandidato]) {
          agregados[nomeCandidato] = { nome: nomeCandidato, totalVotos: 0, siglaPartido: siglaPartidoOriginal };
        }
        agregados[nomeCandidato].totalVotos += votos;
      });

      const sortedCandidatos = Object.values(agregados)
        .sort((a, b) => b.totalVotos - a.totalVotos);
      setVotosAgrupadosCandidatos(sortedCandidatos);
      setVotosCandidatoPorLocal([]);
      setPaginaAtualVotosLocal(1);
    } else if ((abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && dadosCompletosParaMapa.length > 0 && termoBuscaCandidato !== 'Todos os Candidatos') {
        const agregadosPorLocal: { [key: string]: VotoCandidatoPorLocal } = {};

        let dataForTotalValidVotesPerLocal = [...dadosComTodosFiltrosGeograficosAplicados];

        const totalValidVotesPerLocal: { [key: string]: number } = {};
        dataForTotalValidVotesPerLocal.forEach((item: any) => {
            const nomeVoto = item['Nome do Candidato/Voto']?.toUpperCase();
            const siglaVoto = item['Sigla do Partido']?.toLowerCase();
            const votos = item['Quantidade de Votos'] || 0;
            const localKey = item['Local de Votação']?.trim();

            const isLegenda = nomeVoto === siglaVoto?.toUpperCase();
            const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

            if (localKey && !isBrancoOuNulo && !isLegenda) {
                if (!totalValidVotesPerLocal[localKey]) {
                    totalValidVotesPerLocal[localKey] = 0;
                }
                totalValidVotesPerLocal[localKey] += votos;
            }
        });

        let dataForCandidateLocalVotes = [...dadosComTodosFiltrosGeograficosAplicados];
        if (siglaSelecionada !== 'Todas as Siglas') {
            dataForCandidateLocalVotes = dataForCandidateLocalVotes.filter((dado: any) => dado['Sigla do Partido'] === siglaSelecionada);
        }
        const targetCandidateName = termoBuscaCandidato.toUpperCase();

        dataForCandidateLocalVotes = dataForCandidateLocalVotes.filter((dado: any) =>
            dado['Nome do Candidato/Voto']?.trim().toUpperCase() === targetCandidateName
        );

        dataForCandidateLocalVotes.forEach((item: any) => {
            const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
            const siglaPartido = item['Sigla do Partido']?.trim();
            const localVotacaoCode = item['Local de Votação']?.trim();
            const votos = item['Quantidade de Votos'] || 0;

            const infoLocal = dadosLocais.find(l =>
                l['Município'] === item['Município'] &&
                l['Zona Eleitoral'] === item['Zona Eleitoral'] &&
                l['Seção Eleitoral'] === item['Seção Eleitoral'] &&
                l['Local de Votação'] === localVotacaoCode
            );
            const nomeLocal = infoLocal?.['Nome do Local'] || 'N/A';
            const enderecoLocal = infoLocal?.['Endereço do Local'] || 'N/A';
            const bairroLocal = infoLocal?.['Bairro do Local'] || 'N/A';

            if (localVotacaoCode && infoLocal) {
                if (!agregadosPorLocal[localVotacaoCode]) {
                    agregadosPorLocal[localVotacaoCode] = {
                        nome: nomeCandidato,
                        siglaPartido: siglaPartido,
                        localVotacao: localVotacaoCode,
                        nomeLocal: nomeLocal,
                        enderecoLocal: enderecoLocal,
                        bairroLocal: bairroLocal,
                        totalVotos: 0,
                        porcentagem: 0,
                        posicaoRankingLocal: 0
                    };
                }
                agregadosPorLocal[localVotacaoCode].totalVotos += votos;
            }
        });

        const sortedVotosPorLocalRaw = Object.values(agregadosPorLocal)
            .sort((a, b) => b.totalVotos - a.totalVotos);

        let currentLocalRank = 1;
        const rankedVotosPorLocal = sortedVotosPorLocalRaw.map((item, i) => {
            const localKey = item.localVotacao;
            const totalValid = totalValidVotesPerLocal[localKey] || 0;
            const porcentagem = totalValid > 0 ? (item.totalVotos / totalValid) * 100 : 0;
            
            if (i > 0 && item.totalVotos < sortedVotosPorLocalRaw[i-1].totalVotos) {
                currentLocalRank = i + 1;
            }
            return { ...item, porcentagem, posicaoRankingLocal: currentLocalRank };
        });

        setVotosCandidatoPorLocal(rankedVotosPorLocal);
        setVotosAgrupadosCandidatos([]);
        setPaginaAtualVotosLocal(1);
    }
    else {
      setVotosAgrupadosCandidatos([]);
      setVotosCandidatoPorLocal([]);
      setPaginaAtualVotosLocal(1);
    }

  }, [
    municipioSelecionado,
    localSelecionado,
    zonaSelecionada,
    secaoSelecionada,
    siglaSelecionada,
    termoBuscaCandidato,
    termoBuscaLocal,
    dadosCompletosParaMapa,
    carregando,
    getUniqueOptions,
    abaAtiva,
    dadosLocais,
    allSectionMetrics,
    cargoRankingSelecionado,
    municipioRankingSelecionado,
    siglaRankingSelecionada,
  ]);

  useEffect(() => {
    if ((abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') || carregando || dadosCompletosParaMapa.length === 0) {
      setCandidatosRanking([]);
      setPaginaAtualRanking(1);
      setCandidatosRankingDropdownFiltrado([]);
      return;
    }

    let dadosBaseParaCalculoRanking: any[] = [...dadosCompletosParaMapa];

    if (cargoRankingSelecionado !== 'Todos os Cargos') {
      dadosBaseParaCalculoRanking = dadosBaseParaCalculoRanking.filter((dado: any) => dado.Cargo === cargoRankingSelecionado);
    }

    if (municipioRankingSelecionado !== 'Todos os Municípios') {
      dadosBaseParaCalculoRanking = dadosBaseParaCalculoRanking.filter((dado: any) => dado['Município'] === municipioRankingSelecionado);
    }

    const uniqueCandidatosParaRankingDropdown = new Map<string, CandidatoDropdownOption>();
    dadosBaseParaCalculoRanking.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();

      if (nomeCandidato && siglaPartido &&
          nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
          siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
        const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
        if (!uniqueCandidatosParaRankingDropdown.has(key)) {
          uniqueCandidatosParaRankingDropdown.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
        }
      }
    });
    const sortedCandidatosParaRankingDropdown = Array.from(uniqueCandidatosParaRankingDropdown.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    setCandidatosRankingDropdownFiltrado(sortedCandidatosParaRankingDropdown);
    
    // Passo 3: Calcular o total de votos válidos por Cargo/Município (ANTES de filtrar por partido ou candidato específico)
    const totalValidVotesPerCargoMunicipio: { [key: string]: number } = {};
    dadosBaseParaCalculoRanking.forEach(item => {
      const nomeVoto = item['Nome do Candidato/Voto']?.toUpperCase();
      const siglaVoto = item['Sigla do Partido']?.toLowerCase();
      const votos = item['Quantidade de Votos'] || 0;
      const cargoDoRegistro = item.Cargo;
      const municipioDoRegistro = item['Município'];

      const isLegenda = nomeVoto === siglaVoto?.toUpperCase();
      const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

      if (!isBrancoOuNulo && !isLegenda) {
        const groupKey = `${cargoDoRegistro}-${municipioDoRegistro}`;
        if (!totalValidVotesPerCargoMunicipio[groupKey]) {
          totalValidVotesPerCargoMunicipio[groupKey] = 0;
        }
        totalValidVotesPerCargoMunicipio[groupKey] += votos;
      }
    });

    // Passo 4: Agrupar votos por candidato, cargo e município (ainda sem filtro de sigla ou candidato individual)
    const rawGroupedByCandidatoCargoMunicipio: { [key: string]: { nome: string; totalVotos: number; siglaPartido: string; cargo: string; municipio: string; numeroCandidato: string; } } = {};
    dadosBaseParaCalculoRanking.forEach(item => { // Continua usando dadosBaseParaCalculoRanking (filtrado por cargo/município)
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartidoOriginal = item['Sigla do Partido']?.trim();
      const numeroCand = item['Numero do Candidato'];
      const votos = item['Quantidade de Votos'] || 0;
      const cargoDoRegistro = item.Cargo;
      const municipioDoRegistro = item['Município'];

      const normalizedSiglaPartido = siglaPartidoOriginal ? siglaPartidoOriginal.toUpperCase() : '#NULO#';
      if (nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || normalizedSiglaPartido === '#NULO#' || nomeCandidato === normalizedSiglaPartido) {
        return;
      }

      const candidateKey = `${nomeCandidato}-${siglaPartidoOriginal}-${numeroCand}-${cargoDoRegistro}-${municipioDoRegistro}`;
      if (!rawGroupedByCandidatoCargoMunicipio[candidateKey]) {
        rawGroupedByCandidatoCargoMunicipio[candidateKey] = {
          nome: nomeCandidato,
          totalVotos: 0,
          siglaPartido: siglaPartidoOriginal,
          cargo: cargoDoRegistro,
          municipio: municipioDoRegistro,
          numeroCandidato: numeroCand,
        };
      }
      rawGroupedByCandidatoCargoMunicipio[candidateKey].totalVotos += votos;
    });

    // Passo 5: Calcular porcentagem e posição para TODOS os candidatos (já agrupados por cargo/município)
    // Mantenha este cálculo antes da filtragem por siglaRankingSelecionada e candidatoRankingSelecionado
    const candidatesWithCalculatedRanking: VotoAgregadoCandidatoRanking[] = [];
    const groupedForRankingPositions: { [key: string]: VotoAgregadoCandidatoRanking[] } = {};

    Object.values(rawGroupedByCandidatoCargoMunicipio).forEach((candidate: any) => {
        const groupKey = `${candidate.cargo}-${candidate.municipio}`;
        const porcentagem = totalValidVotesPerCargoMunicipio[groupKey] > 0
            ? (candidate.totalVotos / totalValidVotesPerCargoMunicipio[groupKey]) * 100
            : 0;

        const fullCandidateData: VotoAgregadoCandidatoRanking = {
            ...candidate,
            porcentagem,
            posicaoRanking: 0
        };

        if (!groupedForRankingPositions[groupKey]) {
            groupedForRankingPositions[groupKey] = [];
        }
        groupedForRankingPositions[groupKey].push(fullCandidateData);
    });

    Object.values(groupedForRankingPositions).forEach((group: VotoAgregadoCandidatoRanking[]) => {
        group.sort((a, b) => b.totalVotos - a.totalVotos);
        let currentRank = 1;
        for (let i = 0; i < group.length; i++) {
            if (i > 0 && group[i].totalVotos < group[i-1].totalVotos) {
                currentRank = i + 1;
            }
            group[i].posicaoRanking = currentRank;
            candidatesWithCalculatedRanking.push(group[i]);
        }
    });

    // Passo 6: Aplicar os filtros de sigla e candidato individual
    // ESTE É O NOVO POSICIONAMENTO PARA ESSES FILTROS!
    let finalRankingToDisplay = [...candidatesWithCalculatedRanking]; // Comece com todos os candidatos com ranking e porcentagem calculados

    if (siglaRankingSelecionada !== 'Todas as Siglas') {
      finalRankingToDisplay = finalRankingToDisplay.filter((dado: any) => dado['siglaPartido'] === siglaRankingSelecionada);
    }

    if (candidatoRankingSelecionado !== 'Todos os Candidatos') {
      finalRankingToDisplay = finalRankingToDisplay.filter(dado => dado.nome === candidatoRankingSelecionado);
    }

    // Passo 7: Ordenar os resultados finais para exibição
    const sortedCandidatos = finalRankingToDisplay.sort((a, b) => {
        if (ordenacaoColunaRanking === 'totalVotos') {
            return ordenacaoDirecaoRanking === 'desc' ? b.totalVotos - a.totalVotos : a.totalVotos - b.totalVotos;
        } else if (ordenacaoColunaRanking === 'nome') {
            return ordenacaoDirecaoRanking === 'asc' ? a.nome.localeCompare(b.nome, 'pt-BR') : b.nome.localeCompare(a.nome, 'pt-BR');
        } else if (ordenacaoColunaRanking === 'siglaPartido') {
            return ordenacaoDirecaoRanking === 'asc' ? a.siglaPartido.localeCompare(b.siglaPartido, 'pt-BR') : b.siglaPartido.localeCompare(a.siglaPartido, 'pt-BR');
        } else if (ordenacaoColunaRanking === 'porcentagem') {
            return ordenacaoDirecaoRanking === 'desc' ? b.porcentagem - a.porcentagem : a.porcentagem - b.porcentagem;
        } else if (ordenacaoColunaRanking === 'cargo') {
            if (a.cargo !== b.cargo) return ordenacaoDirecaoRanking === 'asc' ? a.cargo.localeCompare(b.cargo, 'pt-BR') : b.cargo.localeCompare(a.cargo, 'pt-BR');
            if (a.municipio !== b.municipio) return ordenacaoDirecaoRanking === 'asc' ? a.municipio.localeCompare(b.municipio, 'pt-BR') : b.municipio.localeCompare(a.municipio, 'pt-BR');
            return ordenacaoDirecaoRanking === 'asc' ? a.posicaoRanking - b.posicaoRanking : b.posicaoRanking - a.posicaoRanking;
        } else if (ordenacaoColunaRanking === 'numeroCandidato') {
            return ordenacaoDirecaoRanking === 'asc' ? a.numeroCandidato.localeCompare(b.numeroCandidato, 'pt-BR') : b.numeroCandidato.localeCompare(a.numeroCandidato, 'pt-BR');
        } else if (ordenacaoColunaRanking === 'posicaoRanking') {
            if (a.cargo !== b.cargo) return ordenacaoDirecaoRanking === 'asc' ? a.cargo.localeCompare(b.cargo, 'pt-BR') : b.cargo.localeCompare(a.cargo, 'pt-BR');
            if (a.municipio !== b.municipio) return ordenacaoDirecaoRanking === 'asc' ? a.municipio.localeCompare(b.municipio, 'pt-BR') : b.municipio.localeCompare(a.municipio, 'pt-BR');
            return ordenacaoDirecaoRanking === 'asc' ? a.posicaoRanking - b.posicaoRanking : b.posicaoRanking - a.posicaoRanking;
        }
        return 0;
    });

    setCandidatosRanking(sortedCandidatos);
    setPaginaAtualRanking(1);
  }, [abaAtiva, carregando, dadosCompletosParaMapa, cargoRankingSelecionado, municipioRankingSelecionado, siglaRankingSelecionada, candidatoRankingSelecionado, ordenacaoColunaRanking, ordenacaoDirecaoRanking, getUniqueOptions, safeParseVotes]);
  useEffect(() => {
    if (carregando || dadosCompletosParaMapa.length === 0) {
      setCandidatosParaDetalheLocalDropdown([]);
      setVotosCandidatoPorLocalDetalhado([]);
      return;
    }

    let dadosParaDetalhe = [...dadosCompletosParaMapa];

    const currentCargo = abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? cargoRankingSelecionado : abaAtiva;
    const currentMunicipio = abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? municipioDetalheLocalSelecionado : municipioSelecionado;

    if (currentCargo !== 'Todos os Cargos') {
      dadosParaDetalhe = dadosParaDetalhe.filter((dado: any) => dado.Cargo === currentCargo);
    }
    if (currentMunicipio !== 'Todos os Municípios') {
      dadosParaDetalhe = dadosParaDetalhe.filter((dado: any) => dado['Município'] === currentMunicipio);
    }

    const uniqueBairrosDetalhe = getUniqueOptions(dadosParaDetalhe, 'Bairro do Local');
    setBairrosDisponiveisDetalheLocal(uniqueBairrosDetalhe);
    
    const uniqueCandidatosDetalhe = new Map<string, CandidatoDropdownOption>();
    dadosParaDetalhe.forEach((item: any) => {
        const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = item['Sigla do Partido']?.trim();
        const numeroCandidato = item['Numero do Candidato']?.trim();

        if (nomeCandidato && siglaPartido &&
            nomeCandidato !== 'BRANCO' && nomeCandidato !== 'NULO' &&
            siglaPartido.toLowerCase() !== '#nulo#' && nomeCandidato !== siglaPartido.toUpperCase()) {
            const key = `${nomeCandidato}-${siglaPartido}-${numeroCandidato}`;
            if (!uniqueCandidatosDetalhe.has(key)) {
                uniqueCandidatosDetalhe.set(key, { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato });
            }
        }
    });
    const sortedCandidatosDetalhe = Array.from(uniqueCandidatosDetalhe.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    setCandidatosParaDetalheLocalDropdown(sortedCandidatosDetalhe);

    if (candidatoDetalheLocalSelecionado === 'Todos os Candidatos' || !dadosParaDetalhe.length) {
        setVotosCandidatoPorLocalDetalhado([]);
        setPaginaAtualVotosLocalDetalhado(1);
        setBairroDetalheLocalSelecionado('Todos os Bairros'); 
        return;
    }

    if (bairroDetalheLocalSelecionado !== 'Todos os Bairros') {
        dadosParaDetalhe = dadosParaDetalhe.filter((dado: any) => dado['Bairro do Local'] === bairroDetalheLocalSelecionado);
    }

    const votosPorCandidatoPorLocal = new Map<string, Map<string, { nome: string, siglaPartido: string, totalVotos: number }>>();
    const totalVotosValidosPorLocal = new Map<string, number>();

    dadosParaDetalhe.forEach((item: any) => {
        const localKey = `${item['Município']}-${item['Zona Eleitoral']}-${item['Seção Eleitoral']}-${item['Local de Votação']}`;
        const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = item['Sigla do Partido']?.trim();
        const votos = item['Quantidade de Votos'] || 0;

        const isLegenda = nomeCandidato === siglaPartido?.toUpperCase();
        const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido?.toLowerCase() === '#nulo#';

        if (!votosPorCandidatoPorLocal.has(localKey)) {
            votosPorCandidatoPorLocal.set(localKey, new Map());
        }
        if (!totalVotosValidosPorLocal.has(localKey)) {
            totalVotosValidosPorLocal.set(localKey, 0);
        }

        if (!isBrancoOuNulo && !isLegenda) {
            const currentTotal = votosPorCandidatoPorLocal.get(localKey)?.get(nomeCandidato)?.totalVotos || 0;
            votosPorCandidatoPorLocal.get(localKey)?.set(nomeCandidato, {
                nome: nomeCandidato,
                siglaPartido: siglaPartido,
                totalVotos: currentTotal + votos
            });
            totalVotosValidosPorLocal.set(localKey, totalVotosValidosPorLocal.get(localKey)! + votos);
        }
    });

    const finalVotosPorLocalDetalhado: VotoCandidatoPorLocal[] = [];

    votosPorCandidatoPorLocal.forEach((candidatosNoLocal, localKey) => {
        const totalLocalValido = totalVotosValidosPorLocal.get(localKey) || 0;
        
        const sortedCandidatosNoLocal = Array.from(candidatosNoLocal.values())
            .sort((a, b) => b.totalVotos - a.totalVotos);

        let currentRank = 1;
        for (let i = 0; i < sortedCandidatosNoLocal.length; i++) {
            const currentCandidate = sortedCandidatosNoLocal[i];
            const porcentagemLocal = totalLocalValido > 0 ? (currentCandidate.totalVotos / totalLocalValido) * 100 : 0;

            if (i > 0 && currentCandidate.totalVotos < sortedCandidatosNoLocal[i-1].totalVotos) {
                currentRank = i + 1;
            }

            if (currentCandidate.nome === candidatoDetalheLocalSelecionado.toUpperCase()) {
                const parts = localKey.split('-');
                const municipio = parts[0];
                const zona = parts[1];
                const secao = parts[2];
                const localCode = parts[3];

                const infoLocal = dadosLocais.find(l =>
                    l['Município'] === municipio &&
                    l['Zona Eleitoral'] === zona &&
                    l['Seção Eleitoral'] === secao &&
                    l['Local de Votação'] === localCode
                );

                finalVotosPorLocalDetalhado.push({
                    nome: currentCandidate.nome,
                    totalVotos: currentCandidate.totalVotos,
                    siglaPartido: currentCandidate.siglaPartido,
                    localVotacao: localCode,
                    nomeLocal: infoLocal?.['Nome do Local'] || 'N/A',
                    enderecoLocal: infoLocal?.['Endereço do Local'] || 'N/A',
                    bairroLocal: infoLocal?.['Bairro do Local'] || 'N/A',
                    porcentagem: porcentagemLocal,
                    secaoEleitoral: secao,
                    posicaoRankingLocal: currentRank
                });
                break;
            }
        }
    });

    finalVotosPorLocalDetalhado.sort((a, b) => {
      if (ordenacaoColunaDetalheLocal === 'totalVotos') {
        return ordenacaoDirecaoDetalheLocal === 'desc' ? b.totalVotos - a.totalVotos : a.totalVotos - b.totalVotos;
      } else if (ordenacaoColunaDetalheLocal === 'nomeLocal') {
        return ordenacaoDirecaoDetalheLocal === 'asc' ? a.nomeLocal.localeCompare(b.nomeLocal, 'pt-BR') : b.nomeLocal.localeCompare(a.nomeLocal, 'pt-BR');
      } else if (ordenacaoColunaDetalheLocal === 'porcentagem') {
        return ordenacaoDirecaoDetalheLocal === 'desc' ? b.porcentagem - a.porcentagem : a.porcentagem - b.porcentagem;
      } else if (ordenacaoColunaDetalheLocal === 'posicaoRankingLocal') {
        return ordenacaoDirecaoDetalheLocal === 'asc' ? a.posicaoRankingLocal - b.posicaoRankingLocal : b.posicaoRankingLocal - a.posicaoRankingLocal;
      }
      return 0;
    });

    setVotosCandidatoPorLocalDetalhado(finalVotosPorLocalDetalhado);
    setPaginaAtualVotosLocalDetalhado(1);

}, [carregando, dadosCompletosParaMapa, abaAtiva, cargoRankingSelecionado, municipioDetalheLocalSelecionado, municipioSelecionado, candidatoDetalheLocalSelecionado, dadosLocais, ordenacaoColunaDetalheLocal, ordenacaoDirecaoDetalheLocal, bairroDetalheLocalSelecionado]);


  const siglasParaRankingDropdown = useMemo(() => {
    let dadosFiltradosParaDropdown: any[] = [...dadosCompletosParaMapa];

    if (cargoRankingSelecionado !== 'Todos os Cargos') {
      dadosFiltradosParaDropdown = dadosFiltradosParaDropdown.filter((dado: any) => dado.Cargo === cargoRankingSelecionado);
    }

    if (municipioRankingSelecionado !== 'Todos os Municípios') {
      dadosFiltradosParaDropdown = dadosFiltradosParaDropdown.filter((dado: any) => dado['Município'] === municipioRankingSelecionado);
    }

    const uniqueSiglas = getUniqueOptions(dadosFiltradosParaDropdown, 'Sigla do Partido');
    return uniqueSiglas.filter((sigla: string) => sigla.toLowerCase() !== '#nulo#');
  }, [dadosCompletosParaMapa, cargoRankingSelecionado, municipioRankingSelecionado, getUniqueOptions]);

  const indiceUltimoItemRanking = paginaAtualRanking * itensPorPaginaRanking;
  const indicePrimeiroItemRanking = indiceUltimoItemRanking - itensPorPaginaRanking;
  const candidatosPaginaAtualRanking = candidatosRanking.slice(indicePrimeiroItemRanking, indiceUltimoItemRanking);
  const totalPaginasRanking = Math.ceil(candidatosRanking.length / itensPorPaginaRanking);

  const irParaProximaPaginaRanking = () => {
    setPaginaAtualRanking(prev => Math.min(prev + 1, totalPaginasRanking));
  };

  const irParaPaginaAnteriorRanking = () => {
    setPaginaAtualRanking(prev => Math.max(prev - 1, 1));
  };

  const indiceUltimoItemVotosLocal = paginaAtualVotosLocal * itensPorPaginaVotosLocal;
  const indicePrimeiroItemVotosLocal = indiceUltimoItemVotosLocal - itensPorPaginaVotosLocal;
  const votosCandidatoPorLocalPaginaAtual = votosCandidatoPorLocal.slice(indicePrimeiroItemVotosLocal, indiceUltimoItemVotosLocal);
  const totalPaginasVotosLocal = Math.ceil(votosCandidatoPorLocal.length / itensPorPaginaVotosLocal);

  const irParaProximaPaginaVotosLocal = () => {
    setPaginaAtualVotosLocal(prev => Math.min(prev + 1, totalPaginasVotosLocal));
  };

  const irParaPaginaAnteriorVotosLocal = () => {
    setPaginaAtualVotosLocal(prev => Math.max(prev - 1, 1));
  };

  const indiceUltimoItemVotosLocalDetalhado = paginaAtualVotosLocalDetalhado * itensPorPaginaVotosLocalDetalhado;
  const indicePrimeiroItemVotosLocalDetalhado = indiceUltimoItemVotosLocalDetalhado - itensPorPaginaVotosLocalDetalhado;
  const votosCandidatoPorLocalDetalhadoPaginaAtual = votosCandidatoPorLocalDetalhado.slice(indicePrimeiroItemVotosLocalDetalhado, indiceUltimoItemVotosLocalDetalhado);
  const totalPaginasVotosLocalDetalhado = Math.ceil(votosCandidatoPorLocalDetalhado.length / itensPorPaginaVotosLocalDetalhado);

  const indiceUltimoItemCandidatoCards = paginaAtualCandidatoCards * itensPorPaginaCandidatoCards;
  const indicePrimeiroItemCandidatoCards = indiceUltimoItemCandidatoCards - itensPorPaginaCandidatoCards;
  const candidatosPaginaAtualCandidatoCards = votosAgrupadosCandidatos.slice(indicePrimeiroItemCandidatoCards, indiceUltimoItemCandidatoCards);
  const totalPaginasCandidatoCards = Math.ceil(votosAgrupadosCandidatos.length / itensPorPaginaCandidatoCards);

  const irParaProximaPaginaVotosLocalDetalhado = () => {
    setPaginaAtualVotosLocalDetalhado(prev => Math.min(prev + 1, totalPaginasVotosLocalDetalhado));
  };

  const irParaPaginaAnteriorVotosLocalDetalhado = () => {
    setPaginaAtualVotosLocalDetalhado(prev => Math.max(prev - 1, 1));
  };

  const irParaProximaPaginaCandidatoCards = useCallback(() => {
    setPaginaAtualCandidatoCards(prev => Math.min(prev + 1, totalPaginasCandidatoCards));
  }, [totalPaginasCandidatoCards]); 

  const irParaPaginaAnteriorCandidatoCards = useCallback(() => {
    setPaginaAtualCandidatoCards(prev => Math.max(prev - 1, 1));
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
              <span className="text-gray-400"> Votação por Cargo</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel de Votação</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
              {abas.map((cargo) => (
                <button
                  key={cargo}
                  onClick={() => {
                    setAbaAtiva(cargo);
                    setMunicipioSelecionado('Todos os Municípios');
                    setZonaSelecionada('Todas as Zonas');
                    setSecaoSelecionada('Todas as Seções');
                    setSiglaSelecionada('Todas as Siglas');
                    setTermoBuscaCandidato('Todos os Candidatos');
                    setTermoBuscaLocal('');
                    setLocalSelecionado('Todos os Locais');
                    setMunicipioRankingSelecionado('JOÃO PESSOA');
                    setSiglaRankingSelecionada('Todas as Siglas');
                    setCandidatoRankingSelecionado('Todos os Candidatos');
                    setOrdenacaoColunaRanking('totalVotos');
                    setOrdenacaoDirecaoRanking('desc');
                    setCandidatosRanking([]);
                    setPaginaAtualRanking(1);
                    setPaginaAtualVotosLocal(1);
                    setCandidatoDetalheLocalSelecionado('Todos os Candidatos');
                    setMunicipioDetalheLocalSelecionado('JOÃO PESSOA');
                    setVotosCandidatoPorLocalDetalhado([]);
                    setPaginaAtualVotosLocalDetalhado(1);
                    setOrdenacaoColunaDetalheLocal('totalVotos');
                    setOrdenacaoDirecaoDetalheLocal('desc');

                    if (cargo === 'Visão Geral') {
                            setCargoRankingSelecionado('Presidente'); 
                        } else if (cargo === 'Visão Geral 2º turno') {
                            setCargoRankingSelecionado('Presidente 2º turno'); 
                        } else {
                            setCargoRankingSelecionado(cargo); 
                        }
                  }}
                  className={`pb-2 text-base font-medium transition-colors cursor-pointer ${
                    abaAtiva === cargo
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
            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && (
              <>
                <div className="hidden md:block">
                  <MapaParaibaCandidato
                    key={`${abaAtiva}-mapa`}
                    apiData={dadosCompletosParaMapa}
                    abaAtiva={abaAtiva}
                  />
                </div>

                <div className="md:hidden mt-6 p-4 rounded-lg text-sm text-yellow-800">
                  <div className="w-full bg-white p-4 rounded-xl shadow-sm text-center">
                    <p className="text-base text-gray-500">
                      O mapa interativo não está disponível na visualização móvel. Por favor, acesse em uma tela maior para visualizar o conteúdo.
                    </p>
                  </div>
                </div>
              </>
            )}
                        
            {abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? (
              <>
              <VotacaoCards
                  tipo={algumFiltroAplicado || abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? "filtrado" : "votos"}
                  eleitoresAptos={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.eleitoresAptos : dadosGeraisFiltrados.eleitoresAptos}
                  totalComparecimentos={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.comparecimentos : dadosGeraisFiltrados.comparecimentos}
                  totalAbstencoes={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.abstencoes : dadosGeraisFiltrados.abstencoes}
                  taxaAbstencao={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.taxaAbstencao : dadosGeraisFiltrados.taxaAbstencao}
                  totalLocais={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.locais : dadosGeraisFiltrados.locais}
                  totalSecoes={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.secoes : dadosGeraisFiltrados.secoes}
                  votosValidos={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.validos : dadosGeraisFiltrados.validos}
                  votosBrancos={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.brancos : dadosGeraisFiltrados.brancos}
                  votosNulos={abaAtiva === 'Visão Geral' || abaAtiva === 'Visão Geral 2º turno' ? dadosGeraisAbaAtiva.nulos : dadosGeraisFiltrados.nulos}
                  carregando={carregando}
              />
            
              <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking de Votos por Candidato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="cargo-ranking-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo:
                    </label>
                    <div className="relative">
                      <select
                        id="cargo-ranking-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={cargoRankingSelecionado}
                        onChange={(e) => {
                          setCargoRankingSelecionado(e.target.value);
                          setSiglaRankingSelecionada('Todas as Siglas');
                          setCandidatoRankingSelecionado('Todos os Candidatos');
                          setPaginaAtualRanking(1);
                        }}
                        disabled={carregando}
                      >
                        <option value="Todos os Cargos">Todos os Cargos</option>
                        {cargosDisponiveisParaRanking.map((cargo) => (
                          <option key={cargo} value={cargo}>
                            {cargo}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="municipio-ranking-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Município:
                    </label>
                    <div className="relative">
                      <select
                        id="municipio-ranking-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={municipioRankingSelecionado}
                        onChange={(e) => {
                          setMunicipioRankingSelecionado(e.target.value);
                          setSiglaRankingSelecionada('Todas as Siglas');
                          setCandidatoRankingSelecionado('Todos os Candidatos');
                          setPaginaAtualRanking(1);
                        }}
                        disabled={carregando}
                      >
                        <option value="Todos os Municípios">Todos os Municípios</option>
                        {municipiosDisponiveisParaRanking
                            .sort((a,b) => {
                                if (a === 'JOÃO PESSOA') return -1;
                                if (b === 'JOÃO PESSOA') return 1;
                                return a.localeCompare(b);
                            })
                            .map((municipio) => (
                          <option key={municipio} value={municipio}>
                            {municipio}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sigla-ranking-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Partido:
                    </label>
                    <div className="relative">
                      <select
                        id="sigla-ranking-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={siglaRankingSelecionada}
                        onChange={(e) => {
                          setSiglaRankingSelecionada(e.target.value);
                          setCandidatoRankingSelecionado('Todos os Candidatos');
                          setPaginaAtualRanking(1);
                        }}
                        disabled={carregando}
                      >
                        <option value="Todas as Siglas">Todas as Siglas</option>
                        {siglasParaRankingDropdown.map((sigla) => (
                          <option key={sigla} value={sigla}>
                            {sigla}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="candidato-ranking-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Selecionar Candidato:
                    </label>
                    <div className="relative">
                      <select
                        id="candidato-ranking-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={candidatoRankingSelecionado}
                        onChange={(e) => {
                            const selectedName = e.target.value; // Agora o selectedValue é apenas o nome
                            setCandidatoRankingSelecionado(selectedName);
                            setPaginaAtualRanking(1);

                            if (selectedName === 'Todos os Candidatos') {
                              setSiglaRankingSelecionada('Todas as Siglas');
                            } else {
                              const candidatoInfo = candidatosRankingDropdownFiltrado.find(
                                (c) => c.nome === selectedName 
                              );
                              if (candidatoInfo) {
                                setSiglaRankingSelecionada(candidatoInfo.siglaPartido);
                              }
                            }
                          }}
                        disabled={carregando || siglasParaRankingDropdown.length === 0}
                      >
                        <option value="Todos os Candidatos">Todos os Candidatos</option>
                        {candidatosRankingDropdownFiltrado.map((candidato) => (
                            <option key={`${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`} value={candidato.nome}>
                                {candidato.nome} ({candidato.siglaPartido})
                            </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 lg:col-span-1 flex items-end gap-2">
                    <div className="flex-1">
                      <label htmlFor="ordenacao-coluna" className="block text-sm font-medium text-gray-700 mb-1">
                        Ordenar por:
                      </label>
                      <div className="relative">
                        <select
                          id="ordenacao-coluna"
                          className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                          value={ordenacaoColunaRanking}
                          onChange={(e) => {
                            setOrdenacaoColunaRanking(e.target.value);
                            setPaginaAtualRanking(1);
                          }}
                          disabled={carregando}
                        >
                          <option value="totalVotos">Total de Votos</option>
                          <option value="nome">Nome do Candidato</option>
                          <option value="siglaPartido">Sigla do Partido</option>
                          <option value="porcentagem"> % Votos Válidos</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOrdenacaoDirecaoRanking(ordenacaoDirecaoRanking === 'desc' ? 'asc' : 'desc');
                      setPaginaAtualRanking(1);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 h-[42px]"
                    disabled={carregando}
                  >
                    {ordenacaoDirecaoRanking === 'desc' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                      </svg>
                    )}
                    {ordenacaoDirecaoRanking === 'desc' ? 'Decrescente' : 'Crescente'}
                  </button>
                </div>
              </div>

                {!carregando && candidatosRanking.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Candidato
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Partido
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posição
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Votos
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            % Votos Válidos
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {candidatosPaginaAtualRanking.map((candidato, index) => (
                          <tr key={`${candidato.nome}-${candidato.cargo}-${candidato.municipio}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {candidato.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {candidato.siglaPartido}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {candidato.numeroCandidato}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {candidato.posicaoRanking}º
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {candidato.totalVotos.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {candidato.porcentagem.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !carregando && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                      Nenhum candidato encontrado para o ranking com os filtros selecionados.
                    </div>
                  )
                )}

                {!carregando && candidatosRanking.length > 0 && (
                  <nav
                    className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                    aria-label="Pagination"
                  >
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                          onClick={irParaPaginaAnteriorRanking}
                          disabled={paginaAtualRanking === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <span className="sr-only">Anterior</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                      </button>
                      <button
                        onClick={irParaProximaPaginaRanking}
                        disabled={paginaAtualRanking === totalPaginasRanking}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{indicePrimeiroItemRanking + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(indiceUltimoItemRanking, candidatosRanking.length)}</span> de{' '}
                          <span className="font-medium">{candidatosRanking.length}</span> resultados
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <label htmlFor="itens-por-pagina" className="sr-only">Itens por página</label>
                          <select
                            id="itens-por-pagina"
                            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            value={itensPorPaginaRanking}
                            onChange={(e) => {
                              setItensPorPaginaRanking(Number(e.target.value));
                              setPaginaAtualRanking(1);
                            }}
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                          </div>
                        </div>

                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={irParaPaginaAnteriorRanking}
                            disabled={paginaAtualRanking === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {getPaginationNumbers(paginaAtualRanking, totalPaginasRanking).map((pageNumber, idx) =>
                            pageNumber === '...' ? (
                              <span key={`ellipsis-ranking-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                ...
                              </span>
                            ) : (
                              <button
                                key={`page-ranking-${pageNumber}`}
                                onClick={() => setPaginaAtualRanking(Number(pageNumber))}
                                aria-current={Number(pageNumber) === paginaAtualRanking ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  Number(pageNumber) === paginaAtualRanking
                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            )
                          )}
                          <button
                            onClick={irParaProximaPaginaRanking}
                            disabled={paginaAtualRanking === totalPaginasRanking}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próximo</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10l-3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </nav>
                )}
              </div>

            

              <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhes de Votos por Local de Votação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="municipio-detalhe-local-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Município:
                    </label>
                    <div className="relative">
                      <select
                        id="municipio-detalhe-local-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={municipioDetalheLocalSelecionado}
                        onChange={(e) => {
                          setMunicipioDetalheLocalSelecionado(e.target.value);
                          setCandidatoDetalheLocalSelecionado('Todos os Candidatos');
                          setPaginaAtualVotosLocalDetalhado(1);
                        }}
                        disabled={carregando}
                      >
                        <option value="Todos os Municípios">Todos os Municípios</option>
                        {municipiosDisponiveisParaRanking
                            .sort((a,b) => {
                                if (a === 'JOÃO PESSOA') return -1;
                                if (b === 'JOÃO PESSOA') return 1;
                                return a.localeCompare(b);
                            })
                            .map((municipio) => (
                          <option key={municipio} value={municipio}>
                            {municipio}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="candidato-detalhe-local-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Selecionar Candidato:
                    </label>
                    <div className="relative">
                      <select
                        id="candidato-detalhe-local-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={candidatoDetalheLocalSelecionado}
                        onChange={(e) => {
                          setCandidatoDetalheLocalSelecionado(e.target.value);
                          setPaginaAtualVotosLocalDetalhado(1);
                        }}
                        disabled={carregando || municipiosDisponiveisParaRanking.length === 0}
                      >
                        <option value="Todos os Candidatos">Todos os Candidatos</option>
                        {candidatosParaDetalheLocalDropdown.map((candidato) => (
                            <option key={`${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`} value={candidato.nome}>
                                {candidato.nome} ({candidato.siglaPartido})
                            </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bairro-detalhe-local-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro:
                    </label>
                    <div className="relative">
                      <select
                        id="bairro-detalhe-local-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={bairroDetalheLocalSelecionado}
                        onChange={(e) => {
                          setBairroDetalheLocalSelecionado(e.target.value);
                          setPaginaAtualVotosLocalDetalhado(1);
                        }}
                        disabled={carregando || municipiosDisponiveisParaRanking.length === 0 || candidatoDetalheLocalSelecionado === 'Todos os Candidatos'}
                      >
                        <option value="Todos os Bairros">Todos os Bairros</option>
                        {bairrosDisponiveisDetalheLocal.map((bairro) => (
                          <option key={bairro} value={bairro}>
                            {bairro}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 lg:col-span-1 flex items-end gap-2">
                    <div className="flex-1">
                      <label htmlFor="ordenacao-coluna-detalhe" className="block text-sm font-medium text-gray-700 mb-1">
                        Ordenar por:
                      </label>
                      <div className="relative">
                        <select
                          id="ordenacao-coluna-detalhe"
                          className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                          value={ordenacaoColunaDetalheLocal}
                          onChange={(e) => {
                            setOrdenacaoColunaDetalheLocal(e.target.value);
                            setPaginaAtualVotosLocalDetalhado(1);
                          }}
                          disabled={carregando}
                        >
                          <option value="totalVotos">Total de Votos</option>
                          <option value="nomeLocal">Nome do Local</option>
                          <option value="porcentagem"> % No Local</option>
                          <option value="posicaoRankingLocal"> Posição Local</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOrdenacaoDirecaoDetalheLocal(ordenacaoDirecaoDetalheLocal === 'desc' ? 'asc' : 'desc');
                        setPaginaAtualVotosLocalDetalhado(1);
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 h-[42px]"
                      disabled={carregando}
                    >
                      {ordenacaoDirecaoDetalheLocal === 'desc' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                      </svg>
                    )}
                    {ordenacaoDirecaoDetalheLocal === 'desc' ? 'Decrescente' : 'Crescente'}
                  </button>
                </div>
              </div>
                {!carregando && votosCandidatoPorLocalDetalhado.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Local de Votação (Código)
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número da Seção
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome do Local
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endereço
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bairro
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total de Votos
                          </th>
                           <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            % No Local
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posição Local
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {votosCandidatoPorLocalDetalhadoPaginaAtual.map((item, index) => (
                          <tr key={`${item.localVotacao}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.localVotacao}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.secaoEleitoral}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.nomeLocal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.enderecoLocal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.bairroLocal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.totalVotos.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.porcentagem.toFixed(2)}%
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.posicaoRankingLocal}º
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                    !carregando && candidatoDetalheLocalSelecionado !== 'Todos os Candidatos' && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                            Nenhum voto encontrado para o candidato selecionado neste município/cargo.
                        </div>
                    )
                )}

                {!carregando && votosCandidatoPorLocalDetalhado.length > 0 && (
                  <nav
                    className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                    aria-label="Pagination"
                  >
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={irParaPaginaAnteriorVotosLocalDetalhado}
                        disabled={paginaAtualVotosLocalDetalhado === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={irParaProximaPaginaVotosLocalDetalhado}
                        disabled={paginaAtualVotosLocalDetalhado === totalPaginasVotosLocalDetalhado}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{indicePrimeiroItemVotosLocalDetalhado + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(indiceUltimoItemVotosLocalDetalhado, votosCandidatoPorLocalDetalhado.length)}</span> de{' '}
                          <span className="font-medium">{votosCandidatoPorLocalDetalhado.length}</span> resultados
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <label htmlFor="itens-por-pagina-votos-local-detalhado" className="sr-only">Itens por página</label>
                          <select
                            id="itens-por-pagina-votos-local-detalhado"
                            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            value={itensPorPaginaVotosLocalDetalhado}
                            onChange={(e) => {
                              setItensPorPaginaVotosLocalDetalhado(Number(e.target.value));
                              setPaginaAtualVotosLocalDetalhado(1);
                            }}
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                          </div>
                        </div>

                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={irParaPaginaAnteriorVotosLocalDetalhado}
                            disabled={paginaAtualVotosLocalDetalhado === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {getPaginationNumbers(paginaAtualVotosLocalDetalhado, totalPaginasVotosLocalDetalhado).map((pageNumber, idx) =>
                            pageNumber === '...' ? (
                              <span key={`ellipsis-detalhe-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                ...
                              </span>
                            ) : (
                              <button
                                key={`page-detalhe-${pageNumber}`}
                                onClick={() => setPaginaAtualVotosLocalDetalhado(Number(pageNumber))}
                                aria-current={Number(pageNumber) === paginaAtualVotosLocalDetalhado ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  Number(pageNumber) === paginaAtualVotosLocalDetalhado
                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            )
                          )}
                          <button
                            onClick={irParaProximaPaginaVotosLocalDetalhado}
                            disabled={paginaAtualVotosLocalDetalhado === totalPaginasVotosLocalDetalhado}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próximo</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10l-3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </nav>
                )}
              </div>
              </>
            ) : (
              algumFiltroAplicado ? (
                <VotacaoCards
                    tipo="filtrado"
                    eleitoresAptos={dadosGeraisFiltrados.eleitoresAptos}
                    totalComparecimentos={dadosGeraisFiltrados.comparecimentos}
                    totalAbstencoes={dadosGeraisFiltrados.abstencoes}
                    taxaAbstencao={dadosGeraisFiltrados.taxaAbstencao}
                    votosValidos={dadosGeraisFiltrados.validos}
                    votosBrancos={dadosGeraisFiltrados.brancos}
                    votosNulos={dadosGeraisFiltrados.nulos}
                    carregando={carregando}
                />
              ) : (
                <VotacaoCards
                    tipo="votos"
                    votosValidos={dadosGeraisAbaAtiva.validos}
                    votosBrancos={dadosGeraisAbaAtiva.brancos}
                    votosNulos={dadosGeraisAbaAtiva.nulos}
                    totalComparecimentos={dadosGeraisAbaAtiva.comparecimentos}
                    carregando={carregando}
                />
              )
            )}

            

            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && (
              <div className="mt-8 mb-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Filtros Detalhados:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div>
                    <label htmlFor="municipio-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Município:
                    </label>
                    <div className="relative">
                        <select
                        id="municipio-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={municipioSelecionado}
                        onChange={(e) => {
                            setMunicipioSelecionado(e.target.value);
                            setZonaSelecionada('Todas as Zonas');
                            setLocalSelecionado('Todos os Locais');
                            setSecaoSelecionada('Todas as Seções');
                            setSiglaSelecionada('Todas as Siglas');
                            setTermoBuscaCandidato('Todos os Candidatos');
                            setTermoBuscaLocal('');
                        }}
                        disabled={carregando}
                        >
                        <option value="Todos os Municípios">Todos os Municípios</option>
                        {municipiosDisponiveis.map((municipio) => (
                            <option key={municipio} value={municipio}>
                            {municipio}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                    <div>
                    <label htmlFor="zona-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Zona Eleitoral:
                    </label>
                    <div className="relative">
                        <select
                        id="zona-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={zonaSelecionada}
                        onChange={(e) => {
                            setZonaSelecionada(e.target.value);
                            setLocalSelecionado('Todos os Locais');
                            setSecaoSelecionada('Todas as Seções');
                            setSiglaSelecionada('Todas as Siglas');
                            setTermoBuscaCandidato('Todos os Candidatos');
                            setTermoBuscaLocal('');
                        }}
                        disabled={carregando || municipioSelecionado === 'Todos os Municípios'}
                        >
                        <option value="Todas as Zonas">Todas as Zonas</option>
                        {zonasDisponiveis.map((zona) => (
                            <option key={zona} value={zona}>
                            {zona}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                    <div>
                    <label htmlFor="local-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Local de Votação:
                    </label>
                    <div className="relative">
                        <select
                        id="local-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={localSelecionado}
                        onChange={(e) => {
                            setLocalSelecionado(e.target.value);
                            setSecaoSelecionada('Todas as Seções');
                            setSiglaSelecionada('Todas as Siglas');
                            setTermoBuscaCandidato('Todos os Candidatos');
                            setTermoBuscaLocal('');
                        }}
                        disabled={carregando || zonaSelecionada === 'Todas as Zonas'}
                        >
                        <option value="Todos os Locais">Todos os Locais</option>
                        {locaisDisponiveisDropdown.map((local) => (
                            <option key={local.id} value={local.id}>
                            {local.label}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                    <div>
                    <label htmlFor="secao-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Seção Eleitoral:
                    </label>
                    <div className="relative">
                        <select
                        id="secao-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={secaoSelecionada}
                        onChange={(e) => {
                            setSecaoSelecionada(e.target.value);
                            setSiglaSelecionada('Todas as Siglas');
                            setTermoBuscaCandidato('Todos os Candidatos');
                            setTermoBuscaLocal('');
                        }}
                        disabled={carregando || municipioSelecionado === 'Todos os Municípios' || zonaSelecionada === 'Todas as Zonas' || localSelecionado === 'Todos os Locais'}
                        >
                        <option value="Todas as Seções">Todas as Seções</option>
                        {secoesDisponiveis.map((secao) => (
                            <option key={secao} value={secao}>
                            {secao}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                     <div className="col-span-full"> {}
                      <p className="text-base font-semibold text-gray-800 mt-4 mb-3"> {}
                          Filtre por Partido ou Candidato:
                      </p>
                      </div>
                    <div>
                    <label htmlFor="sigla-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Sigla do Partido:
                    </label>
                    <div className="relative">
                        <select
                        id="sigla-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={siglaSelecionada}
                        onChange={(e) => {
                            setSiglaSelecionada(e.target.value);
                            setTermoBuscaCandidato('Todos os Candidatos');
                        }}
                        disabled={carregando}
                        >
                          <option value="Todas as Siglas">Todas as Siglas</option>
                          {siglasDisponiveis
                              .filter(sigla => sigla !== "Sigla do Partido") 
                              .map((sigla) => (
                                  <option key={sigla} value={sigla}>
                                      {sigla}
                                  </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                   <div>
                    <label htmlFor="busca-candidato" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecionar Candidato:
                    </label>
                    <div className="relative">
                      <select
                        id="busca-candidato"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={termoBuscaCandidato}
                        onChange={(e) => setTermoBuscaCandidato(e.target.value)}
                        disabled={carregando || municipioSelecionado === 'Todos os Municípios'}
                      >
                        <option value="Todos os Candidatos">Todos os Candidatos</option>
                        {candidatosFiltroPrincipalDropdown.map((candidato) => (
                            <option key={`${candidato.nome}-${candidato.siglaPartido}-${candidato.numeroCandidato}`} value={candidato.nome}>
                                {candidato.nome} ({candidato.siglaPartido})
                            </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                    </div>
                </div>

                {!carregando &&
                (municipioSelecionado !== 'Todos os Municípios' ||
                localSelecionado !== 'Todos os Locais' ||
                zonaSelecionada !== 'Todas as Zonas' ||
                secaoSelecionada !== 'Todas as Seções' ||
                termoBuscaLocal !== '')
                && (dadosGeraisFiltrados.locais === 0) && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                        Nenhum local de votação encontrado com os filtros e busca aplicados.
                    </div>
                )}

                {!carregando && algumFiltroAplicado && dadosFiltradosSemBuscaCandidatoOuPartido.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                        <p className="font-semibold">Informações com filtros aplicados:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Quantidade de Candidatos: {votosAgrupadosCandidatos.length}</li>
                            {siglaSelecionada === 'Todas as Siglas' ? (
                                <>
                                    <li>Total de Votos Válidos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const sigla = item['Sigla do Partido']?.toLowerCase();
                                        const votos = item['Quantidade de Votos'] || 0;
                                        const isLegenda = nome === sigla?.toUpperCase();
                                        const isBrancoOuNulo = nome === 'BRANCO' || nome === 'NULO' || sigla === '#nulo#';
                                        if (!isBrancoOuNulo && !isLegenda) return sum + votos;
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>
                                    <li>Total de Votos Brancos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const votos = item['Quantidade de Votos'] || 0;
                                        if (nome === 'BRANCO') return sum + votos;
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>

                                    <li>Total de Votos Nulos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const sigla = item['Sigla do Partido']?.toLowerCase();
                                        const votos = item['Quantidade de Votos'] || 0;

                                        if ((nome === 'NULO' || sigla === '#nulo#') && nome !== 'BRANCO') {
                                            return sum + votos;
                                        }
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>
                                    <li>Total de Votos de Legenda (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const sigla = item['Sigla do Partido']?.toUpperCase();
                                        const votos = item['Quantidade de Votos'] || 0;
                                        if (nome === sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>
                                </>
                            ) : (
                                <>
                                    <li>Total de Votos Nominais (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const sigla = item['Sigla do Partido']?.toUpperCase();
                                        const votos = item['Quantidade de Votos'] || 0;
                                        if (sigla === siglaSelecionada.toUpperCase() && nome !== sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>
                                    <li>Total de Votos de Legenda ({siglaSelecionada}) (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item) => {
                                        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                        const sigla = item['Sigla do Partido']?.toUpperCase();
                                        const votos = item['Quantidade de Votos'] || 0;
                                        if (sigla === siglaSelecionada.toUpperCase() && nome === sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                        return sum;
                                    }, 0).toLocaleString('pt-BR')}</li>
                                </>
                            )}
                        </ul>
                    </div>
                )}
                {!carregando && algumFiltroAplicado && dadosFinalFiltrados.length === 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                        Nenhum candidato encontrado com os filtros selecionados.
                    </div>
                )}
              </div>
            )}

            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && votosAgrupadosCandidatos.length > 0 && termoBuscaCandidato === 'Todos os Candidatos' && (
              <div className="mt-8">
                <h3 className="text-base font-semibold text-gray-800 mb-5">
                  Votação por Candidato ({abaAtiva}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {candidatosPaginaAtualCandidatoCards.map((candidato) => (
                    <CandidatoCard
                      key={`${abaAtiva}-${candidato.nome}-${candidato.siglaPartido}`}
                      nome={candidato.nome}
                      votos={candidato.totalVotos}
                      siglaPartido={candidato.siglaPartido}
                    />
                  ))}
                </div>

                {!carregando && votosAgrupadosCandidatos.length > 0 && (
                  <nav
                    className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                    aria-label="Pagination"
                  >
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={irParaPaginaAnteriorCandidatoCards}
                        disabled={paginaAtualCandidatoCards === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={irParaProximaPaginaCandidatoCards}
                        disabled={paginaAtualCandidatoCards === totalPaginasCandidatoCards}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{indicePrimeiroItemCandidatoCards + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(indiceUltimoItemCandidatoCards, votosAgrupadosCandidatos.length)}</span> de{' '}
                          <span className="font-medium">{votosAgrupadosCandidatos.length}</span> resultados
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <label htmlFor="itens-por-pagina-candidato-cards" className="sr-only">Itens por página</label>
                          <select
                            id="itens-por-pagina-candidato-cards"
                            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            value={itensPorPaginaCandidatoCards}
                            onChange={(e) => {
                              setItensPorPaginaCandidatoCards(Number(e.target.value));
                              setPaginaAtualCandidatoCards(1);
                            }}
                          >
                            <option value="12">12</option>
                            <option value="24">24</option>
                            <option value="48">48</option>
                            <option value="96">96</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                          </div>
                        </div>

                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={irParaPaginaAnteriorCandidatoCards}
                            disabled={paginaAtualCandidatoCards === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {getPaginationNumbers(paginaAtualCandidatoCards, totalPaginasCandidatoCards).map((pageNumber, idx) =>
                            pageNumber === '...' ? (
                              <span key={`ellipsis-candidatocards-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                ...
                              </span>
                            ) : (
                              <button
                                key={`page-candidatocards-${pageNumber}`}
                                onClick={() => setPaginaAtualCandidatoCards(Number(pageNumber))}
                                aria-current={Number(pageNumber) === paginaAtualCandidatoCards ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  Number(pageNumber) === paginaAtualCandidatoCards
                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            )
                          )}
                          <button
                            onClick={irParaProximaPaginaCandidatoCards}
                            disabled={paginaAtualCandidatoCards === totalPaginasCandidatoCards}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próximo</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10l-3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </nav>
                )}
              </div>
            )}

            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && votosCandidatoPorLocal.length > 0 && termoBuscaCandidato !== 'Todos os Candidatos' && (
              <div className="mt-8 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Votos de {termoBuscaCandidato} por Local de Votação em {municipioSelecionado === 'Todos os Municípios' ? 'todos os municípios' : municipioSelecionado}:
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Local de Votação (Código)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome do Local
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Endereço
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bairro
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total de Votos
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % No Local
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {votosCandidatoPorLocalPaginaAtual.map((item, index) => (
                        <tr key={`${item.localVotacao}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.localVotacao}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.nomeLocal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.enderecoLocal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.bairroLocal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.totalVotos.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.porcentagem.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!carregando && votosCandidatoPorLocal.length > 0 && (
                  <nav
                    className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                    aria-label="Pagination"
                  >
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={irParaPaginaAnteriorVotosLocal}
                        disabled={paginaAtualVotosLocal === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={irParaProximaPaginaVotosLocal}
                        disabled={paginaAtualVotosLocal === totalPaginasVotosLocal}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{indicePrimeiroItemVotosLocal + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(indiceUltimoItemVotosLocal, votosCandidatoPorLocal.length)}</span> de{' '}
                          <span className="font-medium">{votosCandidatoPorLocal.length}</span> resultados
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <label htmlFor="itens-por-pagina-votos-local" className="sr-only">Itens por página</label>
                          <select
                            id="itens-por-pagina-votos-local"
                            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            value={itensPorPaginaVotosLocal}
                            onChange={(e) => {
                              setItensPorPaginaVotosLocal(Number(e.target.value));
                              setPaginaAtualVotosLocal(1);
                            }}
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                          </div>
                        </div>

                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={irParaPaginaAnteriorVotosLocal}
                            disabled={paginaAtualVotosLocal === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {getPaginationNumbers(paginaAtualVotosLocal, totalPaginasVotosLocal).map((pageNumber, idx) =>
                            pageNumber === '...' ? (
                              <span key={`ellipsis-votoslocal-${idx}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                ...
                              </span>
                            ) : (
                              <button
                                key={`page-votoslocal-${pageNumber}`}
                                onClick={() => setPaginaAtualVotosLocal(Number(pageNumber))}
                                aria-current={Number(pageNumber) === paginaAtualVotosLocal ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  Number(pageNumber) === paginaAtualVotosLocal
                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            )
                          )}
                          <button
                            onClick={irParaProximaPaginaVotosLocal}
                            disabled={paginaAtualVotosLocal === totalPaginasVotosLocal}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próximo</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10l-3.938-3.71a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </nav>
                )}
              </div>
            )}

              {
                  (abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') &&
                  !carregando &&
                  dadosCompletosParaMapa.length > 0 && (
                      <RankingCandidatoCidade
                          data={dadosCompletosParaMapa}
                          candidatosDisponiveisGlobal={candidatosFiltroPrincipalDropdown} 
                      />
                  )
              }

            {
              (abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') &&
                !carregando &&
                dadosCompletosParaMapa.length > 0 && (
                  <>
                    <div className="hidden md:block">
                      <HeatmapParaibaVotos
                        apiData={dadosCompletosParaMapa}
                        candidatosDisponiveis={candidatosFiltroPrincipalDropdown}
                        currentCargo={abaAtiva}
                        municipiosDisponiveisGlobal={municipiosDisponiveis}
                      />
                    </div>

                    <div className="md:hidden mt-6 p-4 rounded-lg text-sm text-yellow-800">
                      <div className="w-full bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-base text-gray-500">
                          O mapa interativo não está disponível na visualização móvel. Por favor, acesse em uma tela maior para visualizar o conteúdo.
                        </p>
                      </div>
                    </div>
                  </>
                )
              }

             {
              (abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') &&
              !carregando &&
              dadosCompletosParaMapa.length > 0 && (
                <CandidatoPerformanceViz
                  data={dadosCompletosParaMapa}
                  municipiosDisponiveis={municipiosDisponiveis}
                  zonasDisponiveis={zonasDisponiveis}
                  candidatosDisponiveis={candidatosFiltroPrincipalDropdown} 
                />
              )
            }
            
            
            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && algumFiltroAplicado && dadosFiltradosSemBuscaCandidatoOuPartido.length > 0 && votosAgrupadosCandidatos.length === 0 && termoBuscaCandidato === 'Todos os Candidatos' && (
               <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                 <p>Não foram encontrados votos nominais para candidatos com os filtros atuais (pode haver apenas votos brancos, nulos ou de legenda).</p>
               </div>
            )}

            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && algumFiltroAplicado && dadosCompletosParaMapa.length > 0 &&
              votosAgrupadosCandidatos.length === 0 && votosCandidatoPorLocal.length === 0 && (termoBuscaCandidato !== 'Todos os Candidatos' || !algumFiltroGeograficoAplicado) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                    Nenhum candidato encontrado para o cargo com os filtros selecionados.
                </div>
            )}

            {(abaAtiva !== 'Visão Geral' && abaAtiva !== 'Visão Geral 2º turno') && !carregando && dadosCompletosParaMapa.length === 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 w-full">
                    Não foi possível carregar os dados para o cargo selecionado. Verifique a fonte dos dados.
                </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}