'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import MapaParaibaCandidato from '../../../components/ui/MapaParaibaCandidato';
import CandidatoCard from '@/components/ui/CandidatoCard';
import VotacaoCards from '@/components/VotacaoCards';

interface VotoAgregadoCandidato {
  nome: string;
  totalVotos: number;
  siglaPartido: string;
}

const removerAcentos = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function PainelVotacao() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [municipioSelecionado, setMunicipioSelecionado] = useState('Todos os Municípios');
  const [zonaSelecionada, setZonaSelecionada] = useState('Todas as Zonas');
  const [secaoSelecionada, setSecaoSelecionada] = useState('Todas as Seções');
  const [localSelecionado, setLocalSelecionado] = useState('Todos os Locais');
  const [siglaSelecionada, setSiglaSelecionada] = useState('Todas as Siglas');
  const [termoBuscaCandidato, setTermoBuscaCandidato] = useState('');

  const [municipiosDisponiveis, setMunicipiosDisponiveis] = useState<string[]>([]);
  const [zonasDisponiveis, setZonasDisponiveis] = useState<string[]>([]);
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [siglasDisponiveis, setSiglasDisponiveis] = useState<string[]>([]);

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

  const [dadosCompletosParaMapa, setDadosCompletosParaMapa] = useState<any[]>([]);
  const [dadosFinalFiltrados, setDadosFinalFiltrados] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [dadosFiltradosSemBuscaCandidato, setDadosFiltradosSemBuscaCandidato] = useState<any[]>([]);

  const [votosAgrupadosCandidatos, setVotosAgrupadosCandidatos] = useState<VotoAgregadoCandidato[]>([]);

  const resumoCacheRef = useRef<Record<string, any>>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('votacaoResumo') || '{}')
      : {}
  );

  const municipioAnteriorRef = useRef(municipioSelecionado);

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

  const getUniqueOptions = useCallback((data: any[], key: string, sort = true) => {
    const options = new Set<string>();
    data.forEach(item => {
      const value = item[key]?.trim();
      if (value) {
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

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setCarregando(true);
    setDadosCompletosParaMapa([]);
    setVotosAgrupadosCandidatos([]);
    setDadosFiltradosSemBuscaCandidato([]);

    setMunicipioSelecionado('Todos os Municípios');
    setZonaSelecionada('Todas as Zonas');
    setSecaoSelecionada('Todas as Seções');
    setLocalSelecionado('Todos os Locais');
    setSiglaSelecionada('Todas as Siglas');
    setTermoBuscaCandidato('');

    setMunicipiosDisponiveis([]);
    setZonasDisponiveis([]);
    setSecoesDisponiveis([]);
    setLocaisDisponiveis([]);
    setSiglasDisponiveis([]);

    const resumoSalvo = resumoCacheRef.current[abaAtiva];
    const dadosCompletosCache = typeof window !== 'undefined' ? localStorage.getItem(`votacaoCompletos-${abaAtiva}`) : null;

    const fetchData = async () => {
      const ids = planilhasPorCargo[abaAtiva];
      const dadosUnificadosPorSecao = new Set<string>();
      const locaisUnicos = new Set<string>();
      const secoesUnicas = new Set<string>();
      const municipiosUnicosSet = new Set<string>();

      let aptos = 0;
      let comp = 0;
      let abst = 0;
      let validos = 0;
      let brancos = 0;
      let nulos = 0;
      const todosOsDadosBrutos: any[] = [];

      for (const id of ids) {
        try {
          const res = await fetch(`/api/sheets/eleicao/${id}`, { signal });
          const json = await res.json();
          const linhas: string[][] = json.data?.slice(1) || [];

          for (const linha of linhas) {
            const municipio = linha[0]?.trim();
            const zona = linha[1]?.trim();
            const secao = linha[2]?.trim();
            const local = linha[3]?.trim();
            const chaveSecao = `${municipio}_${zona}_${secao}`;

            const apt = safeParseVotes(linha[8]);
            const comparecimento = safeParseVotes(linha[9]);
            const absten = safeParseVotes(linha[10]);
            const votos = safeParseVotes(linha[13]); 

            const sigla = (linha[6] || '').trim();
            const nome = (linha[12] || '').trim().toUpperCase();

            if (municipio) {
              municipiosUnicosSet.add(municipio);
            }

            if (!dadosUnificadosPorSecao.has(chaveSecao)) {
              dadosUnificadosPorSecao.add(chaveSecao);
              aptos += apt;
              comp += comparecimento;
              abst += absten;
              locaisUnicos.add(`${municipio}_${zona}_${local}`);
              secoesUnicas.add(chaveSecao);
            }

            if (nome === 'BRANCO') {
              brancos += votos;
            } else if (nome === 'NULO' || sigla.toLowerCase() === '#nulo#') {
              nulos += votos;
            } else {
              validos += votos;
            }

            todosOsDadosBrutos.push({
              'Município': municipio,
              'Zona Eleitoral': zona,
              'Seção Eleitoral': secao,
              'Local de Votação': local,
              'Nome do Candidato/Voto': nome,
              'Quantidade de Votos': votos,
              'Sigla do Partido': sigla,
              Cargo: abaAtiva,
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

      setMunicipiosDisponiveis(getUniqueOptions(todosOsDadosBrutos, 'Município'));
      setDadosCompletosParaMapa(todosOsDadosBrutos);

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`votacaoCompletos-${abaAtiva}`, JSON.stringify(todosOsDadosBrutos));
        }
      } catch {
        console.warn('Cache excedido para:', abaAtiva);
      }

      const resumoParaCards = {
        eleitoresAptos: aptos,
        comparecimentos: comp,
        abstencoes: abst,
        taxaAbstencao: aptos > 0 ? (abst / aptos) * 100 : 0,
        locais: locaisUnicos.size,
        secoes: secoesUnicas.size,
        validos,
        brancos,
        nulos,
      };
      setDadosGeraisAbaAtiva(resumoParaCards);
      
      resumoCacheRef.current[abaAtiva] = resumoParaCards;
      if (typeof window !== 'undefined') {
        localStorage.setItem('votacaoResumo', JSON.stringify(resumoCacheRef.current));
      }

      setCarregando(false);
    };

    let shouldFetch = true;
    if (resumoSalvo) {
        setDadosGeraisAbaAtiva(resumoSalvo);
        if (dadosCompletosCache) {
            try {
                const cachedData = JSON.parse(dadosCompletosCache);
                const processedCachedData = cachedData.map((item: any) => ({
                    ...item,
                    'Quantidade de Votos': safeParseVotes(item['Quantidade de Votos']),
                }));
                setMunicipiosDisponiveis(getUniqueOptions(processedCachedData, 'Município'));
                setDadosCompletosParaMapa(processedCachedData);
                shouldFetch = false;
            } catch (e) {
                console.error("Erro ao analisar dados do cache, buscando dados novos:", e);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`votacaoCompletos-${abaAtiva}`);
                }
            }
        }
    }

    if (shouldFetch) {
      fetchData();
    } else {
      setCarregando(false);
    }

    return () => {
      controller.abort();
    };
  }, [abaAtiva, getUniqueOptions, safeParseVotes]);


  useEffect(() => {
    if (carregando || dadosCompletosParaMapa.length === 0) {
      setDadosFinalFiltrados([]);
      setDadosFiltradosSemBuscaCandidato([]);
      setVotosAgrupadosCandidatos([]);
      setZonasDisponiveis([]);
      setSecoesDisponiveis([]);
      setLocaisDisponiveis([]);
      setSiglasDisponiveis([]);
      return;
    }

    let dadosAtuaisFiltrados = [...dadosCompletosParaMapa];

    // Se o município mudou, resetar zona, seção, local, sigla e termo de busca.
    // Esta verificação DEVE vir antes da filtragem pelo município para que os estados sejam resetados
    // ANTES de serem usados para filtrar os dados em cascata.
    if (municipioSelecionado !== municipioAnteriorRef.current) {
      setZonaSelecionada('Todas as Zonas');
      setSecaoSelecionada('Todas as Seções');
      setLocalSelecionado('Todos os Locais');
      setSiglaSelecionada('Todas as Siglas');
      setTermoBuscaCandidato('');
    }
    // Atualiza a referência para o próximo render
    municipioAnteriorRef.current = municipioSelecionado;

    // 1. FILTRO DE MUNICÍPIO
    if (municipioSelecionado !== 'Todos os Municípios') {
      dadosAtuaisFiltrados = dadosAtuaisFiltrados.filter(dado => dado['Município'] === municipioSelecionado);
    }
    // Atualiza zonas disponíveis com base nos dados filtrados pelo município
    const newZonas = getUniqueOptions(dadosAtuaisFiltrados, 'Zona Eleitoral', false);
    if (!newZonas.includes(zonaSelecionada) && zonaSelecionada !== 'Todas as Zonas') {
        setZonaSelecionada('Todas as Zonas');
    }
    setZonasDisponiveis(newZonas);

    // 2. FILTRO DE ZONA
    let dadosFiltradosPorZona = [...dadosAtuaisFiltrados];
    // CORREÇÃO: "Todos os Zonas" para "Todas as Zonas"
    if (zonaSelecionada !== 'Todas as Zonas') {
      dadosFiltradosPorZona = dadosFiltradosPorZona.filter(dado => dado['Zona Eleitoral'] === zonaSelecionada);
    }
    // Atualiza seções disponíveis com base nos dados filtrados por município e zona
    const newSecoes = getUniqueOptions(dadosFiltradosPorZona, 'Seção Eleitoral', false);
    if (!newSecoes.includes(secaoSelecionada) && secaoSelecionada !== 'Todas as Seções') {
        setSecaoSelecionada('Todas as Seções');
    }
    setSecoesDisponiveis(newSecoes);

    // 3. FILTRO DE SEÇÃO
    let dadosFiltradosPorSecao = [...dadosFiltradosPorZona];
    if (secaoSelecionada !== 'Todas as Seções') {
      dadosFiltradosPorSecao = dadosFiltradosPorSecao.filter(dado => dado['Seção Eleitoral'] === secaoSelecionada);
    }
    // Atualiza locais disponíveis com base nos dados filtrados por município, zona e seção
    const newLocais = getUniqueOptions(dadosFiltradosPorSecao, 'Local de Votação');
    if (!newLocais.includes(localSelecionado) && localSelecionado !== 'Todos os Locais') {
        setLocalSelecionado('Todos os Locais');
    }
    setLocaisDisponiveis(newLocais);

    // 4. FILTRO DE LOCAL
    let dadosFiltradosPorLocal = [...dadosFiltradosPorSecao];
    if (localSelecionado !== 'Todos os Locais') {
      dadosFiltradosPorLocal = dadosFiltradosPorLocal.filter(dado => dado['Local de Votação'] === localSelecionado);
    }

    // 5. FILTRO DE SIGLA (partido)
    let dadosFiltradosPorSigla = [...dadosFiltradosPorLocal];
    const siglas = getUniqueOptions(dadosFiltradosPorSigla, 'Sigla do Partido');
    const filteredSiglas = siglas.filter(sigla => sigla.toLowerCase() !== '#nulo#');
    setSiglasDisponiveis(filteredSiglas);
    if (!filteredSiglas.includes(siglaSelecionada) && siglaSelecionada !== 'Todas as Siglas') {
        setSiglaSelecionada('Todas as Siglas');
    }
    if (siglaSelecionada !== 'Todas as Siglas') {
      dadosFiltradosPorSigla = dadosFiltradosPorSigla.filter(dado => dado['Sigla do Partido'] === siglaSelecionada);
    }
    
    setDadosFiltradosSemBuscaCandidato(dadosFiltradosPorSigla);

    // 6. FILTRO DE BUSCA POR NOME DE CANDIDATO
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

    if (abaAtiva !== 'Visão Geral' && dadosCompletosParaMapa.length > 0) {
      const agregados: { [key: string]: { totalVotos: number; siglaPartido: string } } = {};
      
      dadosFinalProcessados.forEach(item => {
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
    municipioSelecionado, zonaSelecionada, secaoSelecionada, localSelecionado, siglaSelecionada, termoBuscaCandidato,
    dadosCompletosParaMapa, carregando, getUniqueOptions, abaAtiva
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
              <span className="text-gray-400"> Votação por Cargo</span>
            </p>
            <h1 className="text-2xl font-bold text-black">Painel de Votação</h1>
            <div className="flex space-x-10 mt-5 border-b border-gray-300">
              {abas.map((cargo) => (
                <button
                  key={cargo}
                  onClick={() => setAbaAtiva(cargo)}
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
            {abaAtiva === 'Visão Geral' ? (
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
            ) : (
              <VotacaoCards
                tipo="votos"
                votosValidos={dadosGeraisAbaAtiva.validos}
                votosBrancos={dadosGeraisAbaAtiva.brancos}
                votosNulos={dadosGeraisAbaAtiva.nulos}
                totalComparecimentos={dadosGeraisAbaAtiva.comparecimentos}
                carregando={carregando}
              />
            )}
            
            {abaAtiva !== 'Visão Geral' && !carregando && <MapaParaibaCandidato key={`${abaAtiva}-mapa`} apiData={dadosCompletosParaMapa} abaAtiva={abaAtiva} />}
            
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
                        onChange={(e) => setMunicipioSelecionado(e.target.value)}
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
                        onChange={(e) => setZonaSelecionada(e.target.value)}
                        disabled={carregando || zonasDisponiveis.length === 0}
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
                    <label htmlFor="secao-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Seção Eleitoral:
                    </label>
                    <div className="relative">
                      <select
                        id="secao-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={secaoSelecionada}
                        onChange={(e) => setSecaoSelecionada(e.target.value)}
                        disabled={carregando || secoesDisponiveis.length === 0}
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
                    <label htmlFor="local-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Local de Votação:
                    </label>
                    <div className="relative">
                      <select
                        id="local-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-full py-2.5 px-5 pr-9 text-sm font-medium text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
                        value={localSelecionado}
                        onChange={(e) => setLocalSelecionado(e.target.value)}
                        disabled={carregando || locaisDisponiveis.length === 0}
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
                        disabled={carregando || siglasDisponiveis.length === 0}
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

                {!carregando && dadosFiltradosSemBuscaCandidato.length > 0 && (
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
                {!carregando && dadosFinalFiltrados.length === 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 w-full">
                        Nenhum dado encontrado com os filtros selecionados.
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
                      key={`${abaAtiva}-${candidato.nome}`}
                      nome={candidato.nome}
                      votos={candidato.totalVotos}
                      siglaPartido={candidato.siglaPartido}
                    />
                  ))}
                </div>
              </div>
            )}
            {abaAtiva !== 'Visão Geral' && !carregando && dadosFinalFiltrados.length > 0 && votosAgrupadosCandidatos.length === 0 && (
               <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  <p>Não foram encontrados votos nominais para candidatos com os filtros atuais (pode haver apenas votos brancos, nulos ou de legenda).</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}