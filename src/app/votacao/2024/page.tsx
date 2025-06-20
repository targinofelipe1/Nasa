'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import MapaParaibaCandidato from '../../../components/ui/MapaParaibaCandidato';
import CandidatoCard from '@/components/ui/CandidatoCard';
import VotacaoCards from '@/components/ui/VotacaoCards';

// Interfaces (mantidas as suas definições)
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
}

// Helper function
const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PainelVotacao() {
  // Estados para os filtros gerais (aplicáveis às abas de cargo)
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [zonaSelecionada, setZonaSelecionada] = useState('Todas as Zonas'); // RESTAURADO
  const [secaoSelecionada, setSecaoSelecionada] = useState('Todas as Seções'); // RESTAURADO
  const [siglaSelecionada, setSiglaSelecionada] = useState('Todas as Siglas');
  const [candidatoSelecionado, setCandidatoSelecionado] = useState('Todos os Candidatos'); // Candidato dos filtros detalhados
  const [termoBuscaLocal, setTermoBuscaLocal] = useState('');
  const [localSelecionado, setLocalSelecionado] = useState('Todos os Locais');

  // Estados para dados disponíveis nos filtros
  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]); // RESTAURADO
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]); // RESTAURADO
  const [siglasDisponiveis, setSiglasDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [candidatosDisponiveis, setCandidatosDisponiveis] = useState<CandidatoDropdownOption[]>([]); // Candidatos para filtros detalhados

  // Estados para dados de exibição
  const [votosCandidatoPorLocal, setVotosCandidatoPorLocal] = useState<VotoCandidatoPorLocal[]>([]);
  const [locaisVotacaoFiltradosParaExibicao, setLocaisVotacaoFiltradosParaExibicao] = useState<LocalVotacaoDetalhado[]>([]);
  const [votosAgrupadosCandidatos, setVotosAgrupadosCandidatos] = useState<VotoAgregadoCandidato[]>([]);

  // Estados para Totais e Métricas
  const [dadosGeraisAbaAtiva, setDadosGeraisAbaAtiva] = useState({
    eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
    locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
  });
  const [dadosGeraisFiltrados, setDadosGeraisFiltrados] = useState({
    eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
    locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
  });

  // Dados brutos e filtrados para processamento
  const [dadosCompletosParaMapa, setDadosCompletosParaMapa] = useState<any[]>([]);
  const [dadosFiltradosSemBuscaCandidatoOuPartido, setDadosFiltradosSemBuscaCandidatoOuPartido] = useState<any[]>([]);
  const [dadosFinalFiltrados, setDadosFinalFiltrados] = useState<any[]>([]);
  const [allSectionMetrics, setAllSectionMetrics] = useState<Map<string, SectionMetrics>>(new Map());

  // Estados de carregamento e aplicação de filtros
  const [carregando, setCarregando] = useState(true);
  const [algumFiltroAplicado, setAlgumFiltroAplicado] = useState(false);
  const [algumFiltroGeograficoAplicado, setAlgumFiltroGeograficoAplicado] = useState(false);

  // Estados para o Ranking (na aba 'Visão Geral')
  const [cargoRankingSelecionado, setCargoRankingSelecionado] = useState('Prefeito');
  const [municipioRankingSelecionado, setMunicipioRankingSelecionado] = useState('JOÃO PESSOA');
  const [siglaRankingSelecionada, setSiglaRankingSelecionada] = useState('Todas as Siglas');
  const [candidatoRankingSelecionado, setCandidatoRankingSelecionado] = useState('Todos os Candidatos'); // Candidato selecionado NO RANKING
  const [candidatosDisponiveisRanking, setCandidatosDisponiveisRanking] = useState<CandidatoDropdownOption[]>([]);
  const [ordenacaoColunaRanking, setOrdenacaoColunaRanking] = useState('totalVotos');
  const [ordenacaoDirecaoRanking, setOrdenacaoDirecaoRanking] = useState<'asc' | 'desc'>('desc');
  const [candidatosRanking, setCandidatosRanking] = useState<VotoAgregadoCandidatoRanking[]>([]);

  // Estados de Paginação para Ranking e Votos por Local
  const [paginaAtualRanking, setPaginaAtualRanking] = useState(1);
  const [itensPorPaginaRanking, setItensPorPaginaRanking] = useState(10);
  const [paginaAtualVotosLocal, setPaginaAtualVotosLocal] = useState(1);
  const [itensPorPaginaVotosLocal, setItensPorPaginaVotosLocal] = useState(10);


  // Referências para cache e controle de fluxo
  const resumoCacheRef = useRef<Record<string, any>>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('votacaoResumo') || '{}')
      : {}
  );
  // As referências de 'AnteriorRef' não são mais estritamente necessárias com a nova lógica de filtro reativa no useEffect,
  // mas mantê-las não causa problemas.
  const municipioAnteriorRef = useRef(municipioSelecionado);
  const localAnteriorRef = useRef(localSelecionado);
  const zonaAnteriorRef = useRef(zonaSelecionada);
  const secaoAnteriorRef = useRef(secaoSelecionada);

  // Mapeamento de planilhas
  const abas = ['Visão Geral', 'Prefeito', 'Vereador'];
  const planilhasPorCargo: Record<string, string[]> = {
    'Visão Geral': ['prefeito_2024', 'vereador_2024'],
    Prefeito: ['prefeito_2024'],
    Vereador: ['vereador_2024'],
  };
  const cargosDisponiveisParaRanking = abas.filter(aba => aba !== 'Visão Geral');
  const [municipiosDisponiveisParaRanking, setMunicipiosDisponiveisParaRanking] = useState<string[]>([]);


  // Helpers de uso geral
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

  // Estado para dados de locais de votação (carregados uma única vez)
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


  // Efeito principal para carregar os dados brutos quando a aba muda
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setCarregando(true);
    // Resetar todos os estados dependentes dos dados carregados
    setDadosCompletosParaMapa([]);
    setVotosAgrupadosCandidatos([]);
    setDadosFiltradosSemBuscaCandidatoOuPartido([]);
    setLocaisVotacaoFiltradosParaExibicao([]);
    setVotosCandidatoPorLocal([]);
    setDadosFinalFiltrados([]);

    // Resetar filtros específicos do cargo/local ao mudar de aba
    setLocalSelecionado('Todos os Locais');
    setZonaSelecionada('Todas as Zonas');
    setSecaoSelecionada('Todas as Seções');
    setSiglaSelecionada('Todas as Siglas');
    setCandidatoSelecionado('Todos os Candidatos');
    setTermoBuscaLocal('');
    setAlgumFiltroAplicado(false);
    setAlgumFiltroGeograficoAplicado(false);

    setMunicipiosDisponiveis([]);
    setZonasDisponiveis([]);
    setSecoesDisponiveis([]);
    setLocaisDisponiveis([]);
    setCandidatosDisponiveis([]);

    // RESETAR FILTROS DO RANKING AO MUDAR DE ABA PARA GARANTIR CONSISTÊNCIA
    setCargoRankingSelecionado('Prefeito');
    setMunicipioRankingSelecionado('JOÃO PESSOA');
    setCandidatoRankingSelecionado('Todos os Candidatos');
    setOrdenacaoColunaRanking('totalVotos');
    setOrdenacaoDirecaoRanking('desc');
    setCandidatosRanking([]);
    setPaginaAtualRanking(1);
    setSiglaRankingSelecionada('Todas as Siglas');
    setCandidatosDisponiveisRanking([]);
    setPaginaAtualVotosLocal(1);


    const resumoSalvo = resumoCacheRef.current[abaAtiva];
    const dadosCompletosCache = typeof window !== 'undefined' ? localStorage.getItem(`votacaoCompletos-${abaAtiva}`) : null;

    const fetchData = async () => {
      const ids = planilhasPorCargo[abaAtiva];
      const todosOsDadosBrutos: any[] = [];
      const tempSectionDataForMetrics = new Map<string, SectionMetrics>();

      for (const id of ids) {
        try {
          const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
          const json = await res.json();
          const linhas: string[][] = json.data?.slice(1) || [];

          const cargoMap: Record<string, string> = {
            'prefeito_2024': 'Prefeito',
            'vereador_2024': 'Vereador',
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

  // LÓGICA DE FILTRAGEM E AGREGAÇÃO PARA OS CARDS GERAIS E CANDIDATOS (FORA DA VISÃO GERAL)
  useEffect(() => {
    if (carregando || dadosCompletosParaMapa.length === 0) {
      setDadosFiltradosSemBuscaCandidatoOuPartido([]);
      setVotosAgrupadosCandidatos([]);
      setVotosCandidatoPorLocal([]);
      setLocaisVotacaoFiltradosParaExibicao([]);
      setZonasDisponiveis([]);
      setSecoesDisponiveis([]);
      setLocaisDisponiveis([]);
      setCandidatosDisponiveis([]);
      setDadosGeraisFiltrados({
        eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
        locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
      });
      setDadosFinalFiltrados([]);
      return;
    }

    // Identificar se algum filtro geográfico está aplicado
    const isAnyGeographicFilterApplied =
      municipioSelecionado !== 'Todos os Municípios' ||
      localSelecionado !== 'Todos os Locais';
    setAlgumFiltroGeograficoAplicado(isAnyGeographicFilterApplied);

    // Identificar se algum filtro (geográfico, sigla, candidato) está aplicado
    const isAnyFilterApplied = isAnyGeographicFilterApplied || siglaSelecionada !== 'Todas as Siglas' || candidatoSelecionado !== 'Todos os Candidatos';
    setAlgumFiltroAplicado(isAnyFilterApplied);

  
  
    let dadosAtuaisFiltrados = [...dadosCompletosParaMapa];
    let locaisFiltradosParaOpcoes = [...dadosLocais]; 

    
    if (municipioSelecionado !== 'Todos os Municípios') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: any) => dado['Município'] === municipioSelecionado);
      locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter((local: LocalVotacaoDetalhado) => local['Município'] === municipioSelecionado);
    }

  
    const newZonas = (municipioSelecionado !== 'Todos os Municípios')
                            ? getUniqueOptions(locaisFiltradosParaOpcoes, 'Zona Eleitoral', false)
                            : [];
    setZonasDisponiveis(newZonas);
    if (zonaSelecionada !== 'Todas as Zonas') {
        dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: any) => dado['Zona Eleitoral'] === zonaSelecionada);
        locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter((local: LocalVotacaoDetalhado) => local['Zona Eleitoral'] === zonaSelecionada);
    }

   
    const newLocais = (municipioSelecionado !== 'Todos os Municípios' && zonaSelecionada !== 'Todas as Zonas')
                            ? getUniqueOptions(locaisFiltradosParaOpcoes, 'Local de Votação')
                            : [];
    setLocaisDisponiveis(newLocais);
    if (localSelecionado !== 'Todos os Locais') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: any) => dado['Local de Votação'] === localSelecionado);
      locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter((local: LocalVotacaoDetalhado) => local['Local de Votação'] === localSelecionado);
    }
    
    // Atualizar e aplicar filtros de seção
    const newSecoes = (municipioSelecionado !== 'Todos os Municípios' && localSelecionado !== 'Todos os Locais' && zonaSelecionada !== 'Todas as Zonas')
                            ? getUniqueOptions(locaisFiltradosParaOpcoes, 'Seção Eleitoral', false)
                            : [];
    setSecoesDisponiveis(newSecoes);
    if (secaoSelecionada !== 'Todas as Seções') {
        dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter((dado: any) => dado['Seção Eleitoral'] === secaoSelecionada);
    }

    // Atualizar siglas disponíveis com base nos filtros geográficos
    const siglasFiltradasGeograficamente = getUniqueOptions(dadosAtuaisFiltrados, 'Sigla do Partido');
    const filteredSiglasGeograficamente = siglasFiltradasGeograficamente.filter((sigla: string) => sigla.toLowerCase() !== '#nulo#');
    setSiglasDisponiveis(filteredSiglasGeograficamente);

    // Populando os candidatos disponíveis para o dropdown de "Filtros Detalhados"
    const uniqueCandidatos: { [key: string]: CandidatoDropdownOption } = {};
    dadosAtuaisFiltrados.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();
      const isLegenda = nomeCandidato === siglaPartido?.toUpperCase();
      const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido?.toLowerCase() === '#nulo#';
      if (nomeCandidato && !isLegenda && !isBrancoOuNulo) {
        uniqueCandidatos[nomeCandidato] = { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato };
      }
    });
    const sortedCandidatosDisponiveis = Object.values(uniqueCandidatos).sort((a, b) => a.nome.localeCompare(b.nome));
    setCandidatosDisponiveis(sortedCandidatosDisponiveis);


    // Filtrar locais de votação para exibição na área de filtros detalhados
    let locaisParaExibirUnicos: LocalVotacaoDetalhado[] = [];
    const codigosLocaisJaExibidos = new Set<string>();
    const termoLocalNormalizado = removerAcentos(termoBuscaLocal.toUpperCase());

    locaisFiltradosParaOpcoes.forEach((local: LocalVotacaoDetalhado) => {
        const matchesLocalSelected = localSelecionado === 'Todos os Locais' || local['Local de Votação'] === localSelecionado;
        const matchesZonaSelected = zonaSelecionada === 'Todas as Zonas' || local['Zona Eleitoral'] === zonaSelecionada;
        const matchesSecaoSelected = secaoSelecionada === 'Todas as Seções' || local['Seção Eleitoral'] === secaoSelecionada;
        const matchesTermoBusca = !termoBuscaLocal || removerAcentos(local['Nome do Local']).includes(termoLocalNormalizado);

        if (matchesLocalSelected && matchesZonaSelected && matchesSecaoSelected && matchesTermoBusca) {
            if (!codigosLocaisJaExibidos.has(local['Local de Votação'])) {
                locaisParaExibirUnicos.push(local);
                codigosLocaisJaExibidos.add(local['Local de Votação']);
            }
        }
    });
    setLocaisVotacaoFiltradosParaExibicao(locaisParaExibirUnicos);

    // Dados para cálculo dos totais (válidos, brancos, nulos, legenda) antes do filtro de partido/candidato
    let dadosParaTotais = [...dadosAtuaisFiltrados];
    setDadosFiltradosSemBuscaCandidatoOuPartido(dadosParaTotais);

    let dadosFiltradosPorSigla = [...dadosAtuaisFiltrados];
    if (siglaSelecionada !== 'Todas as Siglas') {
      dadosFiltradosPorSigla = dadosFiltradosPorSigla.filter((dado: any) => dado['Sigla do Partido'] === siglaSelecionada);
    }
    
    let dadosFinalProcessados = [...dadosFiltradosPorSigla];

    // Se um candidato específico foi selecionado nos filtros detalhados, filtra por ele
    if (candidatoSelecionado !== 'Todos os Candidatos') {
      dadosFinalProcessados = dadosFinalProcessados.filter((dado: any) => 
        dado['Nome do Candidato/Voto']?.trim().toUpperCase() === candidatoSelecionado
      );
    } else {
      // Se 'Todos os Candidatos' está selecionado nos filtros detalhados, exclui brancos, nulos e legenda
      dadosFinalProcessados = dadosFinalProcessados.filter((dado: any) => {
        const nomeCandidato = dado['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = dado['Sigla do Partido']?.trim().toUpperCase();
        const isLegenda = nomeCandidato === siglaPartido;
        const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido === '#NULO#';
        return !isLegenda && !isBrancoOuNulo;
      });
    }
    setDadosFinalFiltrados(dadosFinalProcessados);

    // Cálculo dos totais gerais filtrados (Eleitores aptos, comparecimentos, abstenções etc.)
    let currentFilteredAptos = 0;
    let currentFilteredComp = 0;
    let currentFilteredAbst = 0;
    const currentUniqueFilteredLocals = new Set<string>();
    const currentUniqueFilteredSecoes = new Set<string>();

    if (allSectionMetrics.size > 0) {
        allSectionMetrics.forEach((metric: SectionMetrics) => {
            const matchesMunicipio = municipioSelecionado === 'Todos os Municípios' || metric.municipio === municipioSelecionado;
            const matchesZona = zonaSelecionada === 'Todas as Zonas' || metric.zona === zonaSelecionada;
            const matchesLocal = localSelecionado === 'Todos os Locais' || metric.localCode === localSelecionado;
            const matchesSecao = secaoSelecionada === 'Todas as Seções' || metric.secao === secaoSelecionada;

            if (matchesMunicipio && matchesZona && matchesLocal && matchesSecao) {
                currentFilteredAptos += metric.aptos;
                currentFilteredComp += metric.comp;
                currentFilteredAbst += metric.abst;
                currentUniqueFilteredSecoes.add(`${metric.municipio}_${metric.zona}_${metric.secao}`);
                currentUniqueFilteredLocals.add(metric.localCode);
            }
        });
    }

    let currentFilteredValidos = 0;
    let currentFilteredBrancos = 0;
    let currentFilteredNulos = 0;
    
    dadosParaTotais.forEach((item: any) => {
        const nome = item['Nome do Candidato/Voto']?.toUpperCase();
        const sigla = item['Sigla do Partido']?.toLowerCase();
        const votos = item['Quantidade de Votos'] || 0;
        if (nome === 'BRANCO') {
            currentFilteredBrancos += votos;
        } else if (nome === 'NULO' || sigla === '#nulo#') {
            currentFilteredNulos += votos;
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

    // Lógica para os Votos Agrupados (Cards de Candidato) - Visível quando "Todos os Candidatos" é selecionado
    // Este bloco só executa para as abas de cargo (Prefeito/Vereador)
    if (abaAtiva !== 'Visão Geral' && dadosCompletosParaMapa.length > 0 && candidatoSelecionado === 'Todos os Candidatos') {
      const agregados: { [key: string]: { nome: string; totalVotos: number; siglaPartido: string; } } = {};

      dadosFiltradosPorSigla.forEach((item: any) => {
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
      setVotosCandidatoPorLocal([]); // Garante que a outra lista esteja vazia
      setPaginaAtualVotosLocal(1); // Resetar paginação
    } 
    // Lógica para exibir votos por local de votação quando um candidato específico é selecionado
    // Este bloco agora é ATIVADO SEJA NA ABA DE CARGO ESPECÍFICO OU NA 'VISÃO GERAL' (para o ranking)
    else if (dadosCompletosParaMapa.length > 0 && 
              (candidatoSelecionado !== 'Todos os Candidatos' || candidatoRankingSelecionado !== 'Todos os Candidatos')) {
        const agregadosPorLocal: { [key: string]: VotoCandidatoPorLocal } = {};

        // PASSO 1: Determinar o conjunto de dados para calcular os TOTAL DE VOTOS VÁLIDOS POR LOCAL
        // ESTA É A PARTE CRÍTICA: dataForTotalValidVotesPerLocal não deve ser filtrada por partido ou candidato
        let dataForTotalValidVotesPerLocal = [...dadosCompletosParaMapa];

        if (abaAtiva === 'Visão Geral') {
            // Se estamos na Visão Geral, aplicar APENAS filtros de Cargo e Município do Ranking
            if (cargoRankingSelecionado !== 'Todos os Cargos') {
                dataForTotalValidVotesPerLocal = dataForTotalValidVotesPerLocal.filter((dado: any) => dado.Cargo === cargoRankingSelecionado);
            }
            if (municipioRankingSelecionado !== 'Todos os Municípios') {
                dataForTotalValidVotesPerLocal = dataForTotalValidVotesPerLocal.filter((dado: any) => dado['Município'] === municipioRankingSelecionado);
            }
            // REMOVIDO: FILTRO POR SIGLA DO RANKING AQUI. ESTE CONJUNTO DE DADOS DEVE SER MAIS AMPLO PARA TOTAIS GERAIS DO LOCAL.
        } else {
            // Se estamos nas abas de cargo (Prefeito/Vereador), usar os dados já filtrados por filtros detalhados geográficos (Município, Zona, Local, Seção)
            // Criar um conjunto de dados separado para os totais de local, aplicando apenas os filtros geográficos
            let tempDadosBaseGeograficos = [...dadosCompletosParaMapa];
            if (municipioSelecionado !== 'Todos os Municípios') {
              tempDadosBaseGeograficos = tempDadosBaseGeograficos.filter((dado: any) => dado['Município'] === municipioSelecionado);
            }
            if (zonaSelecionada !== 'Todas as Zonas') { // FILTRO DE ZONA APLICADO
                tempDadosBaseGeograficos = tempDadosBaseGeograficos.filter((dado: any) => dado['Zona Eleitoral'] === zonaSelecionada);
            }
            if (localSelecionado !== 'Todos os Locais') { // FILTRO DE LOCAL APLICADO
              tempDadosBaseGeograficos = tempDadosBaseGeograficos.filter((dado: any) => dado['Local de Votação'] === localSelecionado);
            }
            if (secaoSelecionada !== 'Todas as Seções') { // FILTRO DE SEÇÃO APLICADO
                tempDadosBaseGeograficos = tempDadosBaseGeograficos.filter((dado: any) => dado['Seção Eleitoral'] === secaoSelecionada);
            }
            dataForTotalValidVotesPerLocal = tempDadosBaseGeograficos;
        }

        // 2. Calcular o total de votos VÁLIDOS por Local de Votação a partir de 'dataForTotalValidVotesPerLocal'
        const totalValidVotesPerLocal: { [key: string]: number } = {};
        dataForTotalValidVotesPerLocal.forEach((item: any) => {
            const nomeVoto = item['Nome do Candidato/Voto']?.toUpperCase();
            const siglaVoto = item['Sigla do Partido']?.toLowerCase();
            const votos = item['Quantidade de Votos'] || 0;
            const localKey = item['Local de Votação']?.trim();

            // Votos válidos são aqueles que NÃO são BRANCO, NULO ou LEGENDA
            const isLegenda = nomeVoto === siglaVoto?.toUpperCase();
            const isBrancoOuNulo = nomeVoto === 'BRANCO' || nomeVoto === 'NULO' || siglaVoto === '#nulo#';

            if (localKey && !isBrancoOuNulo && !isLegenda) {
                if (!totalValidVotesPerLocal[localKey]) {
                    totalValidVotesPerLocal[localKey] = 0;
                }
                totalValidVotesPerLocal[localKey] += votos;
            }
        });

        // 3. Determinar o CANDIDATO e o conjunto de dados para FILTRAR OS VOTOS DO CANDIDATO POR LOCAL
        // Este conjunto de dados PODE e DEVE ser filtrado por sigla, pois é para os votos do candidato
        let dataForCandidateLocalVotes = [...dadosCompletosParaMapa]; // Começa sempre do completo para aplicar os filtros atuais

        let targetCandidateName = '';

        if (abaAtiva === 'Visão Geral') {
            // Aplicar todos os filtros de ranking para os votos do candidato
            if (cargoRankingSelecionado !== 'Todos os Cargos') {
                dataForCandidateLocalVotes = dataForCandidateLocalVotes.filter((dado: any) => dado.Cargo === cargoRankingSelecionado);
            }
            if (municipioRankingSelecionado !== 'Todos os Municípios') {
                dataForCandidateLocalVotes = dataForCandidateLocalVotes.filter((dado: any) => dado['Município'] === municipioRankingSelecionado);
            }
            if (siglaRankingSelecionada !== 'Todas as Siglas') { // OK aplicar filtro de sigla aqui
                dataForCandidateLocalVotes = dataForCandidateLocalVotes.filter((dado: any) => dado['Sigla do Partido'] === siglaRankingSelecionada);
            }
            targetCandidateName = candidatoRankingSelecionado;

        } else {
            // Aplicar todos os filtros detalhados para os votos do candidato
            // dadosFiltradosPorSigla JÁ contem os filtros geográficos e de sigla
            dataForCandidateLocalVotes = dadosFiltradosPorSigla;
            targetCandidateName = candidatoSelecionado;
        }

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
                l['Local de Votação'] === localVotacaoCode
            );
            const nomeLocal = infoLocal?.['Nome do Local'] || 'N/A';
            const enderecoLocal = infoLocal?.['Endereço do Local'] || 'N/A';
            const bairroLocal = infoLocal?.['Bairro do Local'] || 'N/A';

            if (localVotacaoCode) {
                if (!agregadosPorLocal[localVotacaoCode]) {
                    agregadosPorLocal[localVotacaoCode] = {
                        nome: nomeCandidato,
                        siglaPartido: siglaPartido,
                        localVotacao: localVotacaoCode,
                        nomeLocal: nomeLocal,
                        enderecoLocal: enderecoLocal,
                        bairroLocal: bairroLocal,
                        totalVotos: 0,
                        porcentagem: 0
                    };
                }
                agregadosPorLocal[localVotacaoCode].totalVotos += votos;
            }
        });

        // 4. Calcular a porcentagem para cada local com base nos totais válidos
        Object.values(agregadosPorLocal).forEach(item => {
            const localKey = item.localVotacao;
            const totalValid = totalValidVotesPerLocal[localKey] || 0;
            if (totalValid > 0) {
                item.porcentagem = (item.totalVotos / totalValid) * 100;
            } else {
                item.porcentagem = 0;
            }
        });

        const sortedVotosPorLocal = Object.values(agregadosPorLocal)
            .sort((a, b) => b.totalVotos - a.totalVotos);
        setVotosCandidatoPorLocal(sortedVotosPorLocal);
        setVotosAgrupadosCandidatos([]);
        setPaginaAtualVotosLocal(1);
    }
    else {
      setVotosAgrupadosCandidatos([]);
      setVotosCandidatoPorLocal([]);
      setPaginaAtualVotosLocal(1);
    }

  }, [
    municipioSelecionado, localSelecionado, zonaSelecionada, secaoSelecionada, siglaSelecionada, candidatoSelecionado,
    termoBuscaLocal, dadosCompletosParaMapa, carregando, getUniqueOptions, abaAtiva, dadosLocais, algumFiltroAplicado, allSectionMetrics,
    cargoRankingSelecionado, municipioRankingSelecionado, candidatoRankingSelecionado, siglaRankingSelecionada
  ]);

  // LÓGICA DO RANKING NA ABA 'VISÃO GERAL'
  useEffect(() => {
    if (abaAtiva !== 'Visão Geral' || carregando || dadosCompletosParaMapa.length === 0) {
      setCandidatosRanking([]);
      setCandidatosDisponiveisRanking([]);
      setPaginaAtualRanking(1);
      return;
    }

    let dadosFiltradosParaRanking: any[] = [...dadosCompletosParaMapa];

    if (cargoRankingSelecionado !== 'Todos os Cargos') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter((dado: any) => dado.Cargo === cargoRankingSelecionado);
    }

    if (municipioRankingSelecionado !== 'Todos os Municípios') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter((dado: any) => dado['Município'] === municipioRankingSelecionado);
    }

    if (siglaRankingSelecionada !== 'Todas as Siglas') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter((dado: any) => dado['Sigla do Partido'] === siglaRankingSelecionada);
    }

    // Popula o dropdown de candidatos para o ranking
    const uniqueCandidatosRanking: { [key: string]: CandidatoDropdownOption } = {};
    dadosFiltradosParaRanking.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartido = item['Sigla do Partido']?.trim();
      const numeroCandidato = item['Numero do Candidato']?.trim();
      const isLegenda = nomeCandidato === siglaPartido?.toUpperCase();
      const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido?.toLowerCase() === '#nulo#';
      if (nomeCandidato && !isLegenda && !isBrancoOuNulo) {
        uniqueCandidatosRanking[nomeCandidato] = { nome: nomeCandidato, siglaPartido: siglaPartido, numeroCandidato: numeroCandidato };
      }
    });
    const sortedCandidatosDisponiveisRanking = Object.values(uniqueCandidatosRanking).sort((a, b) => a.nome.localeCompare(b.nome));
    setCandidatosDisponiveisRanking(sortedCandidatosDisponiveisRanking);


    // Se um candidato específico foi selecionado no dropdown do ranking,
    // não precisamos calcular o ranking completo, apenas exibir os votos por local.
    // A lógica de votos por local no outro useEffect já vai cuidar disso,
    // então este useEffect só precisa garantir que 'candidatosRanking' esteja vazio.
    if (candidatoRankingSelecionado !== 'Todos os Candidatos') {
        setCandidatosRanking([]);
        setPaginaAtualRanking(1);
        return;
    }


    const rawGroupedByCandidatoCargoMunicipio: { [key: string]: { nome: string; totalVotos: number; siglaPartido: string; cargo: string; municipio: string; numeroCandidato: string; } } = {};
    const totalValidVotesPerCargoMunicipio: { [key: string]: number } = {};

    dadosFiltradosParaRanking.forEach((item: any) => {
      const nomeCandidato = item['Nome do Candidato/Voto']?.trim().toUpperCase();
      const siglaPartidoOriginal = item['Sigla do Partido']?.trim();
      const normalizedSiglaPartido = siglaPartidoOriginal ? siglaPartidoOriginal.toUpperCase() : '#NULO#';
      const votos = item['Quantidade de Votos'] || 0;
      const cargoDoRegistro = item.Cargo;
      const municipioDoRegistro = item['Município'];
      const numeroCand = item['Numero do Candidato'];

      if (nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || normalizedSiglaPartido === '#NULO#' || nomeCandidato === siglaPartidoOriginal.toUpperCase()) {
        return;
      }

      const groupKey = `${cargoDoRegistro}-${municipioDoRegistro}`;
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

      if (!totalValidVotesPerCargoMunicipio[groupKey]) {
        totalValidVotesPerCargoMunicipio[groupKey] = 0;
      }
      totalValidVotesPerCargoMunicipio[groupKey] += votos;
    });

    const candidatesWithPartialRanking: (VotoAgregadoCandidatoRanking)[] = [];
    const groupedForRanking: { [key: string]: VotoAgregadoCandidatoRanking[] } = {};

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

        if (!groupedForRanking[groupKey]) {
            groupedForRanking[groupKey] = [];
        }
        groupedForRanking[groupKey].push(fullCandidateData);
    });

    Object.values(groupedForRanking).forEach((group: VotoAgregadoCandidatoRanking[]) => {
        group.sort((a, b) => b.totalVotos - a.totalVotos);
        let currentRank = 1;
        for (let i = 0; i < group.length; i++) {
            if (i > 0 && group[i].totalVotos < group[i-1].totalVotos) {
                currentRank = i + 1;
            }
            group[i].posicaoRanking = currentRank;
            candidatesWithPartialRanking.push(group[i]);
        }
    });

    const sortedCandidatos = candidatesWithPartialRanking.sort((a, b) => {
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
  }, [abaAtiva, carregando, dadosCompletosParaMapa, cargoRankingSelecionado, municipioRankingSelecionado, candidatoRankingSelecionado, siglaRankingSelecionada, ordenacaoColunaRanking, ordenacaoDirecaoRanking, getUniqueOptions, safeParseVotes]);


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


  // Paginação da tabela de Ranking (Visão Geral - Candidatos por Cargo/Município)
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

  // Paginação da tabela de Votos por Local (Visão Geral - Candidato Específico E/OU Abas de Cargo)
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


  return (
    <ProtectedRoute>
      <NoScroll />
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-y-auto">
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
                    setCandidatoSelecionado('Todos os Candidatos');
                    setTermoBuscaLocal('');
                    setLocalSelecionado('Todos os Locais');
                    // Resetar filtros do ranking ao mudar de aba
                    setCargoRankingSelecionado('Prefeito');
                    setMunicipioRankingSelecionado('JOÃO PESSOA');
                    setCandidatoRankingSelecionado('Todos os Candidatos');
                    setOrdenacaoColunaRanking('totalVotos');
                    setOrdenacaoDirecaoRanking('desc');
                    setPaginaAtualRanking(1);
                    setSiglaRankingSelecionada('Todas as Siglas');
                    setPaginaAtualVotosLocal(1);
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
            {/* Mapa da Paraíba - Posicionado AGORA acima dos cards */}
            {abaAtiva !== 'Visão Geral' && !carregando && <MapaParaibaCandidato key={`${abaAtiva}-mapa`} apiData={dadosCompletosParaMapa} abaAtiva={abaAtiva} />}

            {/* VotacaoCards: Exibe dados gerais (filtrados ou globais) ou dados de votos por cargo */}
            {abaAtiva === 'Visão Geral' ? (
              <>
              <VotacaoCards
                tipo="geral"
                eleitoresAptos={dadosGeraisAbaAtiva.eleitoresAptos}
                totalComparecimentos={dadosGeraisAbaAtiva.comparecimentos}
                totalAbstencoes={dadosGeraisAbaAtiva.abstencoes}
                taxaAbstencao={dadosGeraisAbaAtiva.taxaAbstencao}
                totalLocais={dadosGeraisAbaAtiva.locais}
                totalSecoes={dadosGeraisAbaAtiva.secoes}
                votosValidos={dadosGeraisAbaAtiva.validos}
                votosBrancos={dadosGeraisAbaAtiva.brancos}
                votosNulos={dadosGeraisAbaAtiva.nulos}
                carregando={carregando}
              />

              {/* SEÇÃO DO RANKING DENTRO DA VISÃO GERAL */}
              <div className="mt-8 mb-4 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking de Votos por Candidato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {/* Filtro de Cargo para o Ranking */}
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
                          setCandidatoRankingSelecionado('Todos os Candidatos'); // Resetar candidato ao mudar cargo
                          setPaginaAtualRanking(1);
                          setPaginaAtualVotosLocal(1);
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

                  {/* Filtro de Município para o Ranking */}
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
                          setCandidatoRankingSelecionado('Todos os Candidatos'); // Resetar candidato ao mudar município
                          setPaginaAtualRanking(1);
                          setPaginaAtualVotosLocal(1);
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

                  {/* Filtro de Sigla do Partido para o Ranking */}
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
                          setCandidatoRankingSelecionado('Todos os Candidatos'); // Resetar candidato ao mudar partido
                          setPaginaAtualRanking(1);
                          setPaginaAtualVotosLocal(1);
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

                  {/* Filtro de Candidato para o Ranking (agora um select) */}
                  <div>
                    <label htmlFor="candidato-ranking-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Candidato:
                    </label>
                    <div className="relative">
                      <select
                        id="candidato-ranking-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={candidatoRankingSelecionado}
                        onChange={(e) => {
                          setCandidatoRankingSelecionado(e.target.value);
                          setPaginaAtualRanking(1);
                          setPaginaAtualVotosLocal(1);
                        }}
                        disabled={carregando || candidatosDisponiveisRanking.length === 0}
                      >
                        <option value="Todos os Candidatos">Todos os Candidatos</option>
                        {candidatosDisponiveisRanking.map((candidato) => (
                          <option key={candidato.nome} value={candidato.nome}>
                            {candidato.nome} ({candidato.siglaPartido})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                      </div>
                    </div>
                  </div>


                  {/* Ordenar por Coluna e Direção - SÓ SE "TODOS OS CANDIDATOS" ESTIVER SELECIONADO NO RANKING */}
                  {candidatoRankingSelecionado === 'Todos os Candidatos' && (
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
                      {/* Botão de Direção com Ícones SVG */}
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
                  )}
                </div>

                {/* CONDICIONAL: Tabela de Ranking PADRÃO OU Tabela de Votos por Local para Candidato Específico */}
                {candidatoRankingSelecionado === 'Todos os Candidatos' ? (
                  // EXIBIR TABELA DE RANKING PADRÃO (se "Todos os Candidatos" selecionado no ranking)
                  !carregando && candidatosRanking.length > 0 ? (
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
                  )
                ) : (
                  // EXIBIR TABELA DE VOTOS POR LOCAL PARA CANDIDATO ESPECÍFICO (NA VISÃO GERAL)
                  !carregando && votosCandidatoPorLocal.length > 0 ? (
                    <div className="overflow-x-auto">
                      <h4 className="text-md font-bold text-gray-800 mb-3">Detalhe dos votos de {candidatoRankingSelecionado} por Local de Votação:</h4>
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
                            {/* NOVA COLUNA AQUI */}
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
                              {/* EXIBIÇÃO DA PORCENTAGEM */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {item.porcentagem.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !carregando && (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                        Nenhum voto encontrado por local de votação para o candidato selecionado.
                      </div>
                    )
                  )
                )}

                {/* Controles de Paginação (Com lógica condicional para qual paginação usar) */}
                {!carregando && (
                  candidatoRankingSelecionado === 'Todos os Candidatos' && candidatosRanking.length > 0 ? (
                    // Paginação para a Tabela de Ranking Padrão
                    <nav
                      className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                      aria-label="Pagination"
                    >
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={irParaPaginaAnteriorRanking}
                          disabled={paginaAtualRanking === 1}
                          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
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
                            {Array.from({ length: totalPaginasRanking }, (_, i) => i + 1).map(pagina => (
                              <button
                                key={pagina}
                                onClick={() => setPaginaAtualRanking(pagina)}
                                aria-current={pagina === paginaAtualRanking ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  pagina === paginaAtualRanking
                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pagina}
                              </button>
                            ))}
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
                  ) : (
                    // PAGINAÇÃO DA TABELA DE VOTOS POR LOCAL (QUANDO CANDIDATO ESPECÍFICO SELECIONADO NA VISÃO GERAL)
                    candidatoRankingSelecionado !== 'Todos os Candidatos' && votosCandidatoPorLocal.length > 0 && (
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
                              {Array.from({ length: totalPaginasVotosLocal }, (_, i) => i + 1).map(pagina => (
                                <button
                                  key={pagina}
                                  onClick={() => setPaginaAtualVotosLocal(pagina)}
                                  aria-current={pagina === paginaAtualVotosLocal ? 'page' : undefined}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    pagina === paginaAtualVotosLocal
                                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                  }`}
                                >
                                  {pagina}
                                </button>
                              ))}
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
                    )
                  )
                )}
              </div>
              </>
            ) : (
              // Se um cargo específico está ativo (aba Prefeito ou Vereador)
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

            {abaAtiva !== 'Visão Geral' && (
              <div className="mt-8 mb-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Filtros Detalhados:
                </h3>
                {/* GRID DE FILTROS DETALHADOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> {/* Aumentei para 4 colunas para acomodar melhor */}
                    {/* Município */}
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
                            setZonaSelecionada('Todas as Zonas'); // Resetar ao mudar município
                            setLocalSelecionado('Todos os Locais'); // Resetar ao mudar município
                            setSecaoSelecionada('Todas as Seções'); // Resetar ao mudar município
                            setSiglaSelecionada('Todas as Siglas');
                            setCandidatoSelecionado('Todos os Candidatos');
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

                    {/* Zona Eleitoral - RESTAURADO */}
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
                            setLocalSelecionado('Todos os Locais'); // Resetar ao mudar zona
                            setSecaoSelecionada('Todas as Seções'); // Resetar ao mudar zona
                            setSiglaSelecionada('Todas as Siglas');
                            setCandidatoSelecionado('Todos os Candidatos');
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

                    {/* Local de Votação */}
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
                            setSecaoSelecionada('Todas as Seções'); // Resetar ao mudar local
                            setSiglaSelecionada('Todas as Siglas');
                            setCandidatoSelecionado('Todos os Candidatos');
                            setTermoBuscaLocal('');
                        }}
                        disabled={carregando || municipioSelecionado === 'Todos os Municípios' || zonaSelecionada === 'Todas as Zonas'}
                        >
                        <option value="Todos os Locais">Todos os Locais</option>
                        {locaisDisponiveis.map((local) => (
                            <option key={local} value={local}>
                            {local}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.59 4.59z"/></svg>
                        </div>
                    </div>
                    </div>

                    {/* Seção Eleitoral - RESTAURADO */}
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
                            setCandidatoSelecionado('Todos os Candidatos');
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
                    
                    {/* Sigla do Partido */}
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
                            setCandidatoSelecionado('Todos os Candidatos');
                        }}
                        disabled={carregando}
                        >
                        <option value="Todas as Siglas">Todas as Siglas</option>
                        {siglasDisponiveis.map((sigla) => (
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

                    {/* Filtro de Candidato por Dropdown (nos filtros detalhados) */}
                    <div>
                    <label htmlFor="candidato-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Selecionar Candidato:
                    </label>
                    <div className="relative">
                        <select
                        id="candidato-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={candidatoSelecionado}
                        onChange={(e) => setCandidatoSelecionado(e.target.value)}
                        disabled={carregando || candidatosDisponiveis.length === 0}
                        >
                        <option value="Todos os Candidatos">Todos os Candidatos</option>
                        {candidatosDisponiveis.map((candidato) => (
                            <option key={candidato.nome} value={candidato.nome}>
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

                    {abaAtiva !== 'Visão Geral' && !carregando && algumFiltroGeograficoAplicado && (
                    <div className="mt-8">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">
                        Informações dos Locais de Votação Selecionados:
                      </h3>
                      {/* O filtro de busca por nome do local atua sobre os locais já filtrados geograficamente */}
                      <div className="mb-4">
                        <label htmlFor="busca-local" className="block text-sm font-medium text-gray-700 mb-1">
                          Buscar Local de Votação (Nome):
                        </label>
                        <input
                          id="busca-local"
                          type="text"
                          className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                          placeholder="Nome do local de votação..."
                          value={termoBuscaLocal}
                          onChange={(e) => setTermoBuscaLocal(e.target.value)}
                          disabled={carregando}
                        />
                      </div>
                      {locaisVotacaoFiltradosParaExibicao.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {locaisVotacaoFiltradosParaExibicao.map((local: LocalVotacaoDetalhado, index: number) => (
                            <div key={`${local['Município']}-${local['Zona Eleitoral']}-${local['Seção Eleitoral']}-${local['Local de Votação']}-${index}`}
                              className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                              <h4 className="text-gray-900 font-semibold text-base mb-2">Código do Local: {local['Local de Votação']}</h4>
                              <p className="text-gray-700 text-sm">
                                <strong className="font-medium">Nome do Local:</strong> {local['Nome do Local']}
                              </p>
                              <p className="text-gray-700 text-sm">
                                <strong className="font-medium">Endereço:</strong> {local['Endereço do Local']}
                              </p>
                              <p className="text-gray-700 text-sm">
                                <strong className="font-medium">Bairro:</strong> {local['Bairro do Local']}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                        </div>
                      )}
                    </div>
                  )}

                    {/* Mensagem "Nenhum local de votação encontrado" APENAS se houver filtros geográficos ativos e nenhum resultado */}
                    {!carregando &&
                    (municipioSelecionado !== 'Todos os Municípios' ||
                    localSelecionado !== 'Todos os Locais' ||
                    zonaSelecionada !== 'Todas as Zonas' ||
                    secaoSelecionada !== 'Todas as Seções' ||
                    termoBuscaLocal !== '')
                    && locaisVotacaoFiltradosParaExibicao.length === 0 && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                            Nenhum local de votação encontrado.
                        </div>
                    )}


                    {/* Bloco de informações de totais filtrados (somente se algum filtro estiver ativo) */}
                    {!carregando && algumFiltroAplicado && dadosFiltradosSemBuscaCandidatoOuPartido.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                        <p className="font-semibold">Informações com filtros aplicados:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>Quantidade de Candidatos: {votosAgrupadosCandidatos.length || votosCandidatoPorLocal.length > 0 ? 1 : 0}</li>
                          {/* Usando dadosFiltradosSemBuscaCandidatoOuPartido para totais brancos, nulos e válidos */}
                          <li>Total de Votos Válidos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item: any) => {
                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                const sigla = item['Sigla do Partido']?.toLowerCase();
                                const votos = item['Quantidade de Votos'] || 0;
                                const isLegenda = nome === sigla?.toUpperCase();
                                const isBrancoOuNulo = nome === 'BRANCO' || nome === 'NULO' || sigla === '#nulo#';
                                if (!isBrancoOuNulo && !isLegenda) return sum + votos;
                                return sum;
                              }, 0).toLocaleString('pt-BR')}</li>
                            <li>Total de Votos Brancos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item: any) => {
                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                const votos = item['Quantidade de Votos'] || 0;
                                if (nome === 'BRANCO') return sum + votos;
                                return sum;
                              }, 0).toLocaleString('pt-BR')}</li>

                            <li>Total de Votos Nulos (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item: any) => {
                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                const sigla = item['Sigla do Partido']?.toLowerCase();
                                const votos = item['Quantidade de Votos'] || 0;

                                if ((nome === 'NULO' || sigla === '#nulo#') && nome !== 'BRANCO') {
                                    return sum + votos;
                                }
                                return sum;
                              }, 0).toLocaleString('pt-BR')}</li>
                            <li>Total de Votos de Legenda (filtrado): {dadosFiltradosSemBuscaCandidatoOuPartido.reduce((sum, item: any) => {
                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                const sigla = item['Sigla do Partido']?.toUpperCase();
                                const votos = item['Quantidade de Votos'] || 0;
                                if (nome === sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                return sum;
                              }, 0).toLocaleString('pt-BR')}</li>
                        </ul>
                      </div>
                    )}
                    {/* Mensagem "Nenhum dado encontrado" para resultados de candidatos APENAS se houver filtros ativos e nenhum resultado */}
                    {!carregando && algumFiltroAplicado && dadosFinalFiltrados.length === 0 && (
                                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                                                Nenhum dado encontrado com os filtros selecionados.
                                            </div>
                    )}
              </div>
            )}

            {/* Votação por Candidato (Cards) - Visível apenas quando "Todos os Candidatos" é selecionado (em abas de cargo) */}
            {abaAtiva !== 'Visão Geral' && !carregando && votosAgrupadosCandidatos.length > 0 && candidatoSelecionado === 'Todos os Candidatos' && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Votação por Candidato ({abaAtiva}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {votosAgrupadosCandidatos.map((candidato) => (
                    <CandidatoCard
                      key={`${abaAtiva}-${candidato.nome}-${candidato.siglaPartido}`}
                      nome={candidato.nome}
                      votos={candidato.totalVotos}
                      siglaPartido={candidato.siglaPartido}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Votos por Local de Votação para Candidato Específico - Para abas "Prefeito" / "Vereador" */}
            {abaAtiva !== 'Visão Geral' && !carregando && votosCandidatoPorLocal.length > 0 && candidatoSelecionado !== 'Todos os Candidatos' && (
              <div className="mt-8 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Votos de {candidatoSelecionado} por Local de Votação:
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
                        {/* NOVA COLUNA AQUI */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % No Local
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Usar a paginação aqui também para abas de Prefeito/Vereador */}
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
                          {/* EXIBIÇÃO DA PORCENTAGEM */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.porcentagem.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Controles de Paginação para a tabela de votos por local (aba Prefeito/Vereador) */}
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
                          <label htmlFor="itens-por-pagina-votos-local-detail" className="sr-only">Itens por página</label>
                          <select
                            id="itens-por-pagina-votos-local-detail"
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
                          {Array.from({ length: totalPaginasVotosLocal }, (_, i) => i + 1).map(pagina => (
                            <button
                              key={pagina}
                              onClick={() => setPaginaAtualVotosLocal(pagina)}
                              aria-current={pagina === paginaAtualVotosLocal ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                pagina === paginaAtualVotosLocal
                                  ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {pagina}
                            </button>
                          ))}
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
            
            {/* Mensagem quando não há votos nominais de candidatos após filtros */}
            {abaAtiva !== 'Visão Geral' && !carregando && algumFiltroAplicado && dadosFinalFiltrados.length > 0 && votosAgrupadosCandidatos.length === 0 && candidatoSelecionado === 'Todos os Candidatos' && (
               <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                 <p>Não foram encontrados votos nominais para candidatos com os filtros atuais (pode haver apenas votos brancos, nulos ou de legenda).</p>
               </div>
            )}

            {/* Nova mensagem se nenhum dado foi encontrado no total para exibir candidatos */}
            {abaAtiva !== 'Visão Geral' && !carregando && algumFiltroAplicado && dadosCompletosParaMapa.length > 0 &&
              votosAgrupadosCandidatos.length === 0 && votosCandidatoPorLocal.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                    Nenhum candidato encontrado para o cargo com os filtros selecionados.
                </div>
            )}

            {/* Mensagem de dados ausentes para o cargo */}
            {abaAtiva !== 'Visão Geral' && !carregando && dadosCompletosParaMapa.length === 0 && (
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