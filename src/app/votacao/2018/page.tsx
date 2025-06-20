'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import MapaParaibaCandidato from '../../../components/ui/MapaParaibaCandidato';
import CandidatoCard from '@/components/ui/CandidatoCard';
import VotacaoCards from '@/components/ui/VotacaoCards';

interface VotoAgregadoCandidato {
  nome: string;
  totalVotos: number;
  siglaPartido: string;
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

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PainelVotacao() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [zonaSelecionada, setZonaSelecionada] = useState('Todas as Zonas');
  const [secaoSelecionada, setSecaoSelecionada] = useState('Todas as Seções');
  const [siglaSelecionada, setSiglaSelecionada] = useState('Todas as Siglas');
  const [termoBuscaCandidato, setTermoBuscaCandidato] = useState('');
  const [termoBuscaLocal, setTermoBuscaLocal] = useState('');

  const [localSelecionado, setLocalSelecionado] = useState('Todos os Locais');

  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]);
  const [siglasDisponiveis, setSiglasDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveisDropdown, setLocaisDisponiveisDropdown] = useState<{ id: string, label: string }[]>([]); // Usar 'id' para a key e 'label' para o texto exibido

  const [dadosGeraisAbaAtiva, setDadosGeraisAbaAtiva] = useState({
    eleitoresAptos: 0,
    comparecimentos: 0,
    abstencoes: 0,
    taxaAbstencao: 0,
    locais: 0,
    secoes: 0,
    validos: 0,
    brancos: 0,
    nulos: 0,
  });

  const [dadosGeraisFiltrados, setDadosGeraisFiltrados] = useState({
    eleitoresAptos: 0,
    comparecimentos: 0,
    abstencoes: 0,
    taxaAbstencao: 0,
    locais: 0,
    secoes: 0,
    validos: 0,
    brancos: 0,
    nulos: 0,
  });

  const [dadosCompletosParaMapa, setDadosCompletosParaMapa] = useState<any[]>([]);
  const [dadosFinalFiltrados, setDadosFinalFiltrados] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [algumFiltroAplicado, setAlgumFiltroAplicado] = useState(false);
  const [algumFiltroGeograficoAplicado, setAlgumFiltroGeograficoAplicado] = useState(false);

  const [allSectionMetrics, setAllSectionMetrics] = useState<Map<string, SectionMetrics>>(new Map());

  const [dadosFiltradosSemBuscaCandidato, setDadosFiltradosSemBuscaCandidato] = useState<any[]>([]);

  const [votosAgrupadosCandidatos, setVotosAgrupadosCandidatos] = useState<VotoAgregadoCandidato[]>([]);

  const resumoCacheRef = useRef<Record<string, any>>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('votacaoResumo') || '{}')
      : {}
  );

  const municipioAnteriorRef = useRef(municipioSelecionado);
  const localAnteriorRef = useRef(localSelecionado);
  const zonaAnteriorRef = useRef(zonaSelecionada);
  const secaoAnteriorRef = useRef(secaoSelecionada);


  const abas = ['Visão Geral', 'Presidente', 'Senador', 'Governador', 'Deputado Federal', 'Deputado Estadual'];

  const planilhasPorCargo: Record<string, string[]> = {
    'Visão Geral': [
      'presidente_2018', 'senador_2018', 'governador_2018',
      'grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018',
      'grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018',
    ],
    Presidente: ['presidente_2018'],
    Senador: ['senador_2018'],
    Governador: ['governador_2018'],
    'Deputado Federal': ['grupo_federal1_2018', 'grupo_federal2_2018', 'grupo_federal3_2018', 'deputado_federaljp_2018'],
    'Deputado Estadual': ['grupo_estadual1_2018', 'grupo_estadual2_2018', 'grupo_estadual3_2018', 'deputado_estadualjp_2018'],
  };

  const [cargoRankingSelecionado, setCargoRankingSelecionado] = useState('Presidente');
  const [municipioRankingSelecionado, setMunicipioRankingSelecionado] = useState('JOÃO PESSOA');
  const [siglaRankingSelecionada, setSiglaRankingSelecionada] = useState('Todas as Siglas');
  const [termoBuscaCandidatoRanking, setTermoBuscaCandidatoRanking] = useState('');
  const [ordenacaoColunaRanking, setOrdenacaoColunaRanking] = useState('totalVotos');
  const [ordenacaoDirecaoRanking, setOrdenacaoDirecaoRanking] = useState<'asc' | 'desc'>('desc');
  const [candidatosRanking, setCandidatosRanking] = useState<VotoAgregadoCandidatoRanking[]>([]);
  const cargosDisponiveisParaRanking = abas.filter(aba => aba !== 'Visão Geral');
  const [municipiosDisponiveisParaRanking, setMunicipiosDisponiveisParaRanking] = useState<string[]>([]);


  const [paginaAtualRanking, setPaginaAtualRanking] = useState(1);
  const [itensPorPaginaRanking, setItensPorPaginaRanking] = useState(10);


  const getUniqueOptions = useCallback((data: any[], key: string, sort = true) => {
    const options = new Set<string>();
    data.forEach(item => {
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
    setDadosFiltradosSemBuscaCandidato([]);

    setLocalSelecionado('Todos os Locais');
    setZonaSelecionada('Todas as Zonas');
    setSecaoSelecionada('Todas as Seções');
    setSiglaSelecionada('Todas as Siglas');
    setTermoBuscaCandidato('');
    setTermoBuscaLocal('');
    setAlgumFiltroAplicado(false);
    setAlgumFiltroGeograficoAplicado(false);

    setMunicipiosDisponiveis([]);
    setZonasDisponiveis([]);
    setSecoesDisponiveis([]);
    setLocaisDisponiveis([]);
    setLocaisDisponiveisDropdown([]);

    setCargoRankingSelecionado('Presidente');
    setMunicipioRankingSelecionado('JOÃO PESSOA');
    setTermoBuscaCandidatoRanking('');
    setOrdenacaoColunaRanking('totalVotos');
    setOrdenacaoDirecaoRanking('desc');
    setCandidatosRanking([]);
    setPaginaAtualRanking(1);
    setSiglaRankingSelecionada('Todas as Siglas');

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
            'presidente_2018': 'Presidente',
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
                aptos: aptRow,
                comp: compRow,
                abst: abstRow,
                localCode: local,
                municipio: municipio,
                zona: zona,
                secao: secao,
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
      const filteredSiglasDoCargo = siglasDoCargo.filter(sigla => sigla.toLowerCase() !== '#nulo#');
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
      todosOsDadosBrutos.forEach(item => {
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
        eleitoresAptos: finalAptos,
        comparecimentos: finalComp,
        abstencoes: finalAbst,
        taxaAbstencao: finalAptos > 0 ? (finalAbst / finalAptos) * 100 : 0,
        locais: finalUniqueLocalsCount.size,
        secoes: tempSectionDataForMetrics.size,
        validos: finalValidos,
        brancos: finalBrancos,
        nulos: finalNulos,
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
              'Nome do Local': infoLocal?.['Nome do Local'] || 'N/A',
            };
          });

          const uniqueMunicipalities = getUniqueOptions(processedCachedDataWithLocais, 'Município');
          setMunicipiosDisponiveis(uniqueMunicipalities);
          setMunicipiosDisponiveisParaRanking(uniqueMunicipalities);
          setDadosCompletosParaMapa(processedCachedDataWithLocais);

          const siglasDoCargo = getUniqueOptions(processedCachedDataWithLocais, 'Sigla do Partido');
          const filteredSiglasDoCargo = siglasDoCargo.filter(sigla => sigla.toLowerCase() !== '#nulo#');
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

  useEffect(() => {
    if (carregando || dadosCompletosParaMapa.length === 0) {
      setDadosFinalFiltrados([]);
      setDadosFiltradosSemBuscaCandidato([]);
      setVotosAgrupadosCandidatos([]);
      setZonasDisponiveis([]);
      setSecoesDisponiveis([]);
      setLocaisDisponiveis([]);
      setLocaisDisponiveisDropdown([]);
      setDadosGeraisFiltrados({
        eleitoresAptos: 0, comparecimentos: 0, abstencoes: 0, taxaAbstencao: 0,
        locais: 0, secoes: 0, validos: 0, brancos: 0, nulos: 0,
      });
      return;
    }

    const isAnyGeographicFilterApplied =
      municipioSelecionado !== 'Todos os Municípios' ||
      zonaSelecionada !== 'Todas as Zonas' ||
      localSelecionado !== 'Todos os Locais' ||
      secaoSelecionada !== 'Todas as Seções' ||
      termoBuscaLocal !== '';
    setAlgumFiltroGeograficoAplicado(isAnyGeographicFilterApplied);

    const isAnyFilterApplied = isAnyGeographicFilterApplied || siglaSelecionada !== 'Todas as Siglas' || termoBuscaCandidato !== '';
    setAlgumFiltroAplicado(isAnyFilterApplied);


    municipioAnteriorRef.current = municipioSelecionado;
    zonaAnteriorRef.current = zonaSelecionada;
    localAnteriorRef.current = localSelecionado;
    secaoAnteriorRef.current = secaoSelecionada;


    let dadosAtuaisFiltrados = [...dadosCompletosParaMapa];
    let locaisFiltradosParaOpcoes = [...dadosLocais];

    if (municipioSelecionado !== 'Todos os Municípios') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter(dado => dado['Município'] === municipioSelecionado);
      locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter(local => local['Município'] === municipioSelecionado);
    }

    let dadosFiltradosPorZona = [...dadosAtuaisFiltrados];
    const newZonas = (municipioSelecionado !== 'Todos os Municípios')
                               ? getUniqueOptions(locaisFiltradosParaOpcoes, 'Zona Eleitoral', false)
                               : [];
    setZonasDisponiveis(newZonas);

    if (zonaSelecionada !== 'Todas as Zonas') {
      dadosFiltradosPorZona = dadosFiltradosPorZona.filter(dado => dado['Zona Eleitoral'] === zonaSelecionada);
      locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter(local => local['Zona Eleitoral'] === zonaSelecionada);
    }

    let dadosFiltradosPorLocal = [...dadosFiltradosPorZona];
    
    // MODIFICAÇÃO AQUI: Popular o dropdown com objetos {id: código, label: nome (código) ou apenas código}
    const computedLocaisDataForDropdown = (municipioSelecionado !== 'Todos os Municípios' && zonaSelecionada !== 'Todas as Zonas')
                               ? locaisFiltradosParaOpcoes.map(local => ({
                                    id: local['Local de Votação'], // Usar o código como ID único
                                    label: local['Nome do Local'] && local['Nome do Local'] !== 'N/A'
                                           ? `${local['Nome do Local']} (${local['Local de Votação']})`
                                           : local['Local de Votação'] // Se não tem nome, usa só o código
                                  }))
                               : [];
    
    // Filtra para remover duplicatas de ID (código do local) antes de popular o dropdown
    const uniqueDropdownItems = Array.from(new Map(computedLocaisDataForDropdown.map(item => [item.id, item])).values());

    setLocaisDisponiveisDropdown(uniqueDropdownItems);
    setLocaisDisponiveis(uniqueDropdownItems.map(l => l.id)); // Isso ainda mantém a lista de códigos para a lógica de filtro
    
    if (localSelecionado !== 'Todos os Locais') {
      dadosFiltradosPorLocal = dadosFiltradosPorLocal.filter(dado => dado['Local de Votação'] === localSelecionado);
      locaisFiltradosParaOpcoes = locaisFiltradosParaOpcoes.filter(local => local['Local de Votação'] === localSelecionado);
    }

    let dadosFiltradosPorSecao = [...dadosFiltradosPorLocal];
    const newSecoes = (municipioSelecionado !== 'Todos os Municípios' && localSelecionado !== 'Todos os Locais' && zonaSelecionada !== 'Todas as Zonas')
                               ? getUniqueOptions(locaisFiltradosParaOpcoes, 'Seção Eleitoral', false)
                               : [];
    setSecoesDisponiveis(newSecoes);
    const siglasFiltradasGeograficamente = getUniqueOptions(dadosFiltradosPorSecao, 'Sigla do Partido');
    const filteredSiglasGeograficamente = siglasFiltradasGeograficamente.filter(sigla => sigla.toLowerCase() !== '#nulo#');
    setSiglasDisponiveis(filteredSiglasGeograficamente);

    if (secaoSelecionada !== 'Todas as Seções') {
      dadosFiltradosPorSecao = dadosFiltradosPorSecao.filter(dado => dado['Seção Eleitoral'] === secaoSelecionada);
    }

    let dadosFiltradosPorTermoLocal = [...dadosFiltradosPorSecao];
    const termoLocalNormalizado = removerAcentos(termoBuscaLocal.toUpperCase());
    if (termoBuscaLocal) {
        dadosFiltradosPorTermoLocal = dadosFiltradosPorTermoLocal.filter(dado => {
            const nomeLocal = dado['Nome do Local']?.trim().toUpperCase();
            return nomeLocal && removerAcentos(nomeLocal).includes(termoLocalNormalizado);
        });
    }

    let dadosFiltradosPorSigla = [...dadosFiltradosPorTermoLocal];

    if (siglaSelecionada !== 'Todas as Siglas') {
      dadosFiltradosPorSigla = dadosFiltradosPorSigla.filter(dado => dado['Sigla do Partido'] === siglaSelecionada);
    }

    setDadosFiltradosSemBuscaCandidato(dadosFiltradosPorSigla);

    let dadosFinalProcessados = [...dadosFiltradosPorSigla];
    if (termoBuscaCandidato) {
      const termoNormalizado = removerAcentos(termoBuscaCandidato.toUpperCase());
      dadosFinalProcessados = dadosFinalProcessados.filter(dado => {
        const nomeCandidato = dado['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = dado['Sigla do Partido']?.trim().toUpperCase();
        const isLegenda = nomeCandidato === siglaPartido;
        const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido === '#NULO#';

        return nomeCandidato && removerAcentos(nomeCandidato).includes(termoNormalizado) && !isLegenda && !isBrancoOuNulo;
      });
    }

    setDadosFinalFiltrados(dadosFinalProcessados);

    let currentFilteredAptos = 0;
    let currentFilteredComp = 0;
    let currentFilteredAbst = 0;
    const currentUniqueFilteredLocalsCount = new Set<string>();
    const currentUniqueFilteredSecoes = new Set<string>();

    if (allSectionMetrics.size > 0) {
        allSectionMetrics.forEach((metric) => {
            const matchesMunicipio = municipioSelecionado === 'Todos os Municípios' || metric.municipio === municipioSelecionado;
            const matchesZona = zonaSelecionada === 'Todas as Zonas' || metric.zona === zonaSelecionada;
            const matchesLocalCode = localSelecionado === 'Todos os Locais' || metric.localCode === localSelecionado;
            
            const matchingLocalInfo = dadosLocais.find(l => 
                l['Local de Votação'] === metric.localCode && 
                l['Município'] === metric.municipio &&
                l['Zona Eleitoral'] === metric.zona
            );

            const matchesLocalNameSearch = !termoBuscaLocal || 
                                           (matchingLocalInfo && removerAcentos(matchingLocalInfo['Nome do Local']).includes(termoLocalNormalizado));

            const matchesSecao = secaoSelecionada === 'Todas as Seções' || metric.secao === secaoSelecionada;

            if (matchesMunicipio && matchesZona && matchesLocalCode && matchesSecao && matchesLocalNameSearch) {
                currentFilteredAptos += metric.aptos;
                currentFilteredComp += metric.comp;
                currentFilteredAbst += metric.abst;
                currentUniqueFilteredSecoes.add(`${metric.municipio}_${metric.zona}_${metric.secao}`);
                currentUniqueFilteredLocalsCount.add(metric.localCode);
            }
        });
    }


    let currentFilteredValidos = 0;
    let currentFilteredBrancos = 0;
    let currentFilteredNulos = 0;
    dadosFiltradosSemBuscaCandidato.forEach(item => {
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
        locais: currentUniqueFilteredLocalsCount.size,
        secoes: currentUniqueFilteredSecoes.size,
        validos: currentFilteredValidos,
        brancos: currentFilteredBrancos,
        nulos: currentFilteredNulos,
    });

    if (abaAtiva !== 'Visão Geral' && dadosCompletosParaMapa.length > 0) {
      const agregados: { [key: string]: { totalVotos: number; siglaPartido: string } } = {};

      let dataToAggregate = [];

      const allGeographicFiltersAreDefault =
          municipioSelecionado === 'Todos os Municípios' &&
          localSelecionado === 'Todos os Locais' &&
          zonaSelecionada === 'Todas as Zonas' &&
          secaoSelecionada === 'Todas as Seções' &&
          termoBuscaLocal === '';


      const allPartyAndSearchFiltersAreDefault =
          siglaSelecionada === 'Todas as Siglas' &&
          termoBuscaCandidato === '';

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
          agregados[nomeCandidato] = { totalVotos: 0, siglaPartido: siglaPartidoOriginal };
        }
        agregados[nomeCandidato].totalVotos += votos;
      });

      const sortedCandidatos = Object.entries(agregados)
        .map(([nome, dados]) => ({
          nome: nome,
          totalVotos: dados.totalVotos,
          siglaPartido: dados.siglaPartido
        }))
        .sort((a, b) => b.totalVotos - a.totalVotos);
      setVotosAgrupadosCandidatos(sortedCandidatos);
    } else {
      setVotosAgrupadosCandidatos([]);
    }

  }, [
    municipioSelecionado, localSelecionado, zonaSelecionada, secaoSelecionada, siglaSelecionada, termoBuscaCandidato,
    termoBuscaLocal, dadosCompletosParaMapa, carregando, getUniqueOptions, abaAtiva, dadosLocais, allSectionMetrics
  ]);

  useEffect(() => {
    if (abaAtiva !== 'Visão Geral' || carregando || dadosCompletosParaMapa.length === 0) {
      setCandidatosRanking([]);
      return;
    }

    let dadosFiltradosParaRanking = [...dadosCompletosParaMapa];

    if (cargoRankingSelecionado !== 'Todos os Cargos') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter(dado => dado.Cargo === cargoRankingSelecionado);
    }

    if (municipioRankingSelecionado !== 'Todos os Municípios') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter(dado => dado['Município'] === municipioRankingSelecionado);
    }

    if (siglaRankingSelecionada !== 'Todos as Siglas') {
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter(dado => dado['Sigla do Partido'] === siglaRankingSelecionada);
    }

    if (termoBuscaCandidatoRanking) {
      const termoNormalizado = removerAcentos(termoBuscaCandidatoRanking.toUpperCase());
      dadosFiltradosParaRanking = dadosFiltradosParaRanking.filter(dado => {
        const nomeCandidato = dado['Nome do Candidato/Voto']?.trim().toUpperCase();
        const siglaPartido = dado['Sigla do Partido']?.trim().toUpperCase();
        const isLegenda = nomeCandidato === siglaPartido;
        const isBrancoOuNulo = nomeCandidato === 'BRANCO' || nomeCandidato === 'NULO' || siglaPartido === '#NULO#';
        return nomeCandidato && removerAcentos(nomeCandidato).includes(termoNormalizado) && !isLegenda && !isBrancoOuNulo;
      });
    }

    const rawGroupedByCandidatoCargoMunicipio: { [key: string]: { nome: string; totalVotos: number; siglaPartido: string; cargo: string; municipio: string; numeroCandidato: string; } } = {};
    const totalValidVotesPerCargoMunicipio: { [key: string]: number } = {};

    dadosFiltradosParaRanking.forEach(item => {
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

    Object.values(rawGroupedByCandidatoCargoMunicipio).forEach(candidate => {
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

    Object.values(groupedForRanking).forEach(group => {
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
  }, [abaAtiva, carregando, dadosCompletosParaMapa, cargoRankingSelecionado, municipioRankingSelecionado, termoBuscaCandidatoRanking, siglaRankingSelecionada, ordenacaoColunaRanking, ordenacaoDirecaoRanking, getUniqueOptions, safeParseVotes]);


  const siglasParaRankingDropdown = useMemo(() => {
    let dadosFiltradosParaDropdown = [...dadosCompletosParaMapa];

    if (cargoRankingSelecionado !== 'Todos os Cargos') {
      dadosFiltradosParaDropdown = dadosFiltradosParaDropdown.filter(dado => dado.Cargo === cargoRankingSelecionado);
    }

    if (municipioRankingSelecionado !== 'Todos os Municípios') {
      dadosFiltradosParaDropdown = dadosFiltradosParaDropdown.filter(dado => dado['Município'] === municipioRankingSelecionado);
    }


    const uniqueSiglas = getUniqueOptions(dadosFiltradosParaDropdown, 'Sigla do Partido');
    return uniqueSiglas.filter(sigla => sigla.toLowerCase() !== '#nulo#');
  }, [dadosCompletosParaMapa, cargoRankingSelecionado, municipioRankingSelecionado, getUniqueOptions]);


  const indiceUltimoItem = paginaAtualRanking * itensPorPaginaRanking;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPaginaRanking;
  const candidatosPaginaAtual = candidatosRanking.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginasRanking = Math.ceil(candidatosRanking.length / itensPorPaginaRanking);

  const irParaProximaPagina = () => {
    setPaginaAtualRanking(prev => Math.min(prev + 1, totalPaginasRanking));
  };

  const irParaPaginaAnterior = () => {
    setPaginaAtualRanking(prev => Math.max(prev - 1, 1));
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
                    setTermoBuscaCandidato('');
                    setTermoBuscaLocal('');
                    setLocalSelecionado('Todos os Locais');
                    setCargoRankingSelecionado('Presidente');
                    setMunicipioRankingSelecionado('JOÃO PESSOA');
                    setTermoBuscaCandidatoRanking('');
                    setOrdenacaoColunaRanking('totalVotos');
                    setOrdenacaoDirecaoRanking('desc');
                    setPaginaAtualRanking(1);
                    setSiglaRankingSelecionada('Todas as Siglas');
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
            {abaAtiva !== 'Visão Geral' && !carregando && <MapaParaibaCandidato key={`${abaAtiva}-mapa`} apiData={dadosCompletosParaMapa} abaAtiva={abaAtiva} />}

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
                    <label htmlFor="busca-candidato-ranking" className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar Candidato:
                    </label>
                    <input
                      id="busca-candidato-ranking"
                      type="text"
                      className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                      placeholder="Nome do candidato..."
                      value={termoBuscaCandidatoRanking}
                      onChange={(e) => {
                        setTermoBuscaCandidatoRanking(e.target.value);
                        setSiglaRankingSelecionada('Todas as Siglas');
                        setPaginaAtualRanking(1);
                      }}
                      disabled={carregando}
                    />
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
                        {candidatosPaginaAtual.map((candidato, index) => (
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

                <nav
                  className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6"
                  aria-label="Pagination"
                >
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={irParaPaginaAnterior}
                      disabled={paginaAtualRanking === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={irParaProximaPagina}
                      disabled={paginaAtualRanking === totalPaginasRanking}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indicePrimeiroItem + 1}</span> a{' '}
                        <span className="font-medium">{Math.min(indiceUltimoItem, candidatosRanking.length)}</span> de{' '}
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
                          onClick={irParaPaginaAnterior}
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
                          onClick={irParaProximaPagina}
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

            {abaAtiva !== 'Visão Geral' && (
              <div className="mt-8 mb-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Filtros Detalhados:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                setTermoBuscaCandidato('');
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
                                setTermoBuscaCandidato('');
                                setTermoBuscaLocal('');
                            }}
                            disabled={carregando || municipioSelecionado === 'Todos os Municípios'}
                            >
                            <option value="Todos as Zonas">Todas as Zonas</option>
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
                                setTermoBuscaCandidato('');
                                setTermoBuscaLocal('');
                            }}
                            disabled={carregando || zonaSelecionada === 'Todas as Zonas'}
                            >
                            <option value="Todos os Locais">Todos os Locais</option>
                            {locaisDisponiveisDropdown.map((local) => (
                                <option key={local.id} value={local.id}> {/* Usar local.id como key */}
                                {local.label} {/* Exibir o label formatado */}
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
                                setTermoBuscaCandidato('');
                                setTermoBuscaLocal('');
                            }}
                            disabled={carregando || localSelecionado === 'Todos os Locais'}
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

                    <div>
                    <label htmlFor="sigla-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Sigla do Partido:
                    </label>
                    <div className="relative">
                            <select
                            id="sigla-select"
                            className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            value={siglaSelecionada}
                            onChange={(e) => setSiglaSelecionada(e.target.value)}
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

                    <div>
                    <label htmlFor="busca-candidato" className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar Candidato:
                    </label>
                    <input
                            id="busca-candidato"
                            type="text"
                            className="block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                            placeholder="Nome do candidato..."
                            value={termoBuscaCandidato}
                            onChange={(e) => setTermoBuscaCandidato(e.target.value)}
                            disabled={carregando}
                    />
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

                {!carregando && algumFiltroAplicado && dadosFiltradosSemBuscaCandidato.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 w-full">
                        <p className="font-semibold">Informações com filtros aplicados:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Quantidade de Candidatos: {votosAgrupadosCandidatos.length}</li>
                            {siglaSelecionada === 'Todas as Siglas' ? (
                                    <>
                                        <li>Total de Votos Válidos (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
                                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                                const sigla = item['Sigla do Partido']?.toLowerCase();
                                                const votos = item['Quantidade de Votos'] || 0;
                                                const isLegenda = nome === sigla?.toUpperCase();
                                                const isBrancoOuNulo = nome === 'BRANCO' || nome === 'NULO' || sigla === '#nulo#';
                                                if (!isBrancoOuNulo && !isLegenda) return sum + votos;
                                                return sum;
                                            }, 0).toLocaleString('pt-BR')}</li>
                                            <li>Total de Votos Brancos (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
                                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                                const votos = item['Quantidade de Votos'] || 0;
                                                if (nome === 'BRANCO') return sum + votos;
                                                return sum;
                                            }, 0).toLocaleString('pt-BR')}</li>

                                            <li>Total de Votos Nulos (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
                                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                                const sigla = item['Sigla do Partido']?.toLowerCase();
                                                const votos = item['Quantidade de Votos'] || 0;

                                                if ((nome === 'NULO' || sigla === '#nulo#') && nome !== 'BRANCO') {
                                                    return sum + votos;
                                                }
                                                return sum;
                                            }, 0).toLocaleString('pt-BR')}</li>
                                            <li>Total de Votos de Legenda (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
                                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                                const sigla = item['Sigla do Partido']?.toUpperCase();
                                                const votos = item['Quantidade de Votos'] || 0;
                                                if (nome === sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                                return sum;
                                            }, 0).toLocaleString('pt-BR')}</li>
                                    </>
                            ) : (
                                    <>
                                        <li>Total de Votos Nominais (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
                                                const nome = item['Nome do Candidato/Voto']?.toUpperCase();
                                                const sigla = item['Sigla do Partido']?.toUpperCase();
                                                const votos = item['Quantidade de Votos'] || 0;
                                                if (sigla === siglaSelecionada.toUpperCase() && nome !== sigla && nome !== 'BRANCO' && nome !== 'NULO' && sigla !== '#NULO#') return sum + votos;
                                                return sum;
                                            }, 0).toLocaleString('pt-BR')}</li>
                                            <li>Total de Votos de Legenda ({siglaSelecionada}) (filtrado): {dadosFiltradosSemBuscaCandidato.reduce((sum, item) => {
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

            {abaAtiva !== 'Visão Geral' && !carregando && votosAgrupadosCandidatos.length > 0 && (
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

            {abaAtiva !== 'Visão Geral' && !carregando && algumFiltroAplicado && dadosFiltradosSemBuscaCandidato.length > 0 && votosAgrupadosCandidatos.length === 0 && (
               <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                 <p>Não foram encontrados votos nominais para candidatos com os filtros atuais (pode haver apenas votos brancos, nulos ou de legenda).</p>
               </div>
            )}

            {abaAtiva !== 'Visão Geral' && !carregando && algumFiltroAplicado && dadosCompletosParaMapa.length > 0 &&
              votosAgrupadosCandidatos.length === 0 && dadosFinalFiltrados.length === 0 && !algumFiltroGeograficoAplicado && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                    Nenhum candidato encontrado para o cargo com os filtros selecionados.
                </div>
            )}

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