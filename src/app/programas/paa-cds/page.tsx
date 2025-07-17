'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import NoScroll from '@/components/ui/NoScroll';
import ProtectedRoute from '@/components/ui/auth/ProtectedRoute';
import CardPrograma from '@/components/ui/CardProgramaProps';
import {
  FaBuilding,
  FaFemale,
  FaHandshake,
  FaMapMarkedAlt,
  FaTractor,
  FaUsers,
} from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type LinhaCSV = string[];

type Agricultor = {
  municipio: string;
  nome: string;
  cpf: string;
  endereco: string;
  status: string;
};


export default function ProgramasPage() {
  const [abaAtiva, setAbaAtiva] = useState('Visão Geral');
  const [agricultores, setAgricultores] = useState(0);
  const [mulheres, setMulheres] = useState(0);
  const [beneficiarios, setBeneficiarios] = useState(0);
  const [municipiosFornecedor, setMunicipiosFornecedor] = useState(0);
  const [cooperativas, setCooperativas] = useState(0);
  const [entidades, setEntidades] = useState(0);
  const [beneficiariosData, setBeneficiariosData] = useState<{ municipio: string; quantidade: number }[]>([]);
  const [agricultoresPorMunicipio, setAgricultoresPorMunicipio] = useState<{ municipio: string; quantidade: number }[]>([]);
  const [cooperativasPorMunicipio, setCooperativasPorMunicipio] = useState<{ municipio: string; quantidade: number }[]>([]);
  const [entidadesPorMunicipio, setEntidadesPorMunicipio] = useState<{ municipio: string; quantidade: number }[]>([]);
  const [totalAdquiridoMunicipios, setTotalAdquiridoMunicipios] = useState<{ municipio: string; totalKG: number }[]>([]);
  const [investimentoPorMunicipio, setInvestimentoPorMunicipio] = useState<{ municipio: string; total: number }[]>([]);
  const [agricultoresFiltrados, setAgricultoresFiltrados] = useState<Agricultor[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<'asc' | 'desc'>('asc');
  const [pesquisaTexto, setPesquisaTexto] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [campoPesquisa, setCampoPesquisa] = useState<'nome' | 'cpf' | 'endereco'>('nome');
  const [paginaEntidade, setPaginaEntidade] = useState(1);
  const [pesquisaEntidade, setPesquisaEntidade] = useState('');
  const [filtroMunicipioEntidade, setFiltroMunicipioEntidade] = useState('');
  const [entidadesFiltradas, setEntidadesFiltradas] = useState<{
  entidade: string;
  municipio: string;
  doacaoKg: string;
  valor: string;
  }[]>([]);
  const [ordenacaoEntidade, setOrdenacaoEntidade] = useState<'asc' | 'desc'>('asc');
  const [filtroCooperativa, setFiltroCooperativa] = useState('');
  const [paginaCompras, setPaginaCompras] = useState(1);
  const [comprasFiltradas, setComprasFiltradas] = useState<{
    cooperativa: string;
    cnpj: string;
    nrNota: string;
    data: string;
    produto: string;
    quantidade: string;
    valorUnidade: string;
    total: string;
    entidade: string;
    municipio: string;
  }[]>([]);
  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroMunicipioCompras, setFiltroMunicipioCompras] = useState('');
  const [filtroEntidadeCompras, setFiltroEntidadeCompras] = useState('');
  const [pesquisaCnpjCompras, setPesquisaCnpjCompras] = useState('');
  const [campoPesquisaCompras, setCampoPesquisaCompras] = useState<'cooperativa' | 'cnpj'>('cooperativa');
  const [pesquisaTextoCompras, setPesquisaTextoCompras] = useState('');


  useEffect(() => {
    fetch('/api/sheets/programas/paa/Agricultores')
    .then(res => res.json())
    .then(res => {
      if (!res || !res.data) return;

      const data: LinhaCSV[] = res.data.slice(1);

      const totalAgricultores = data.length;
      const totalMulheres = data.filter((item: LinhaCSV) => item[3]?.toLowerCase() === 'feminino').length;

      setAgricultores(totalAgricultores);
      setMulheres(totalMulheres);

      const contagem: Record<string, number> = {};

      data.forEach((item: LinhaCSV) => {
        const municipio = item[0]?.trim().toUpperCase();
        if (municipio && municipio !== 'MUNICIPIO') {
          contagem[municipio] = (contagem[municipio] || 0) + 1;
        }
      });

      const resultado = Object.entries(contagem)
        .map(([municipio, quantidade]) => ({ municipio, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

      setAgricultoresPorMunicipio(resultado);

      const lista: Agricultor[] = data
        .filter(item => item[0] && item[1] && item[2])
        .map(item => ({
          municipio: item[0]?.trim() || '',
          nome: item[1]?.trim() || '',
          cpf: item[2]?.trim() || '',
          endereco: item[6]?.trim() || '',
          status: item[5]?.trim() || '',
        }));

      setAgricultoresFiltrados(lista);
    });

    fetch('/api/sheets/programas/paa/Beneficiarios')
      .then(res => res.json())
      .then(res => {
        if (!res || !res.data) return;
        const data: LinhaCSV[] = res.data.slice(1);
        const parsed = data
          .filter((row: LinhaCSV) => row[0] && row[1])
          .map((row: LinhaCSV) => ({
            municipio: row[0],
            quantidade: parseInt((row[1] || '0').replace(/\./g, '')),
          }))
          .filter(item => !isNaN(item.quantidade));

        parsed.sort((a, b) => b.quantidade - a.quantidade);

        setBeneficiarios(parsed.reduce((acc, cur) => acc + cur.quantidade, 0));
        setBeneficiariosData(parsed);
      });

    fetch('/api/sheets/programas/paa/Entidades')
    .then(res => res.json())
    .then(res => {
      if (!res || !res.data) return;

      const data: LinhaCSV[] = res.data.slice(1); 

      const entidadesSet = new Set(data.map((item: LinhaCSV) => item[0]?.trim()));
      setEntidades(entidadesSet.size);

      const contagem: Record<string, number> = {};
      data.forEach((item: LinhaCSV) => {
        const municipio = item[1]?.trim().toUpperCase(); 
        if (municipio && municipio !== 'MUNICÍPIO') {
          contagem[municipio] = (contagem[municipio] || 0) + 1;
        }
      });

      const resultado = Object.entries(contagem)
        .map(([municipio, quantidade]) => ({ municipio, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

      setEntidadesPorMunicipio(resultado);
    });

   fetch('/api/sheets/programas/paa/Compras_Cooperativas')
  .then(res => res.json())
  .then(res => {
    if (!res || !res.data) return;

    const data: LinhaCSV[] = res.data.slice(1);

    // 1. Contagem total de cooperativas distintas
    const nomesValidos = data
      .filter(item => item[0] && item[0].toLowerCase() !== 'total')
      .map(item => item[0].trim());

    const cooperativasUnicas = new Set(nomesValidos);
    setCooperativas(cooperativasUnicas.size);

    // 2. Contagem por município (coluna 4 ou 5, ajustar conforme necessário)
    const contagem: Record<string, number> = {};
    data.forEach((item: LinhaCSV) => {
      const cidade = item[4]?.trim().toUpperCase(); // MUNICÍPIO
      if (cidade && cidade !== 'CIDADE') {
        contagem[cidade] = (contagem[cidade] || 0) + 1;
      }
    });

    const resultado = Object.entries(contagem)
      .map(([municipio, quantidade]) => ({ municipio, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    setCooperativasPorMunicipio(resultado);

    // 3. Compras detalhadas para a tabela da aba Cooperativas
    const compras = data
      .filter(item => item[0] && item[1] && item[2] && item[3])
      .map(item => ({
        cooperativa: item[0].trim(),
        cnpj: item[1].trim(),
        nrNota: item[2].trim(),
        data: item[3].trim(),
        produto: item[4]?.trim() || '',
        quantidade: item[5]?.trim() || '',
        valorUnidade: parseFloat(item[6].replace(/\./g, '').replace(',', '.')).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        total: parseFloat(item[7].replace(/\./g, '').replace(',', '.')).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        entidade: item[8]?.trim() || '',
        municipio: item[9]?.trim() || '',
      }));

    setComprasFiltradas(compras);
  });




      fetch('/api/sheets/programas/paa/Municipio')
      .then(res => res.json())
      .then(res => {
        if (!res || !res.data) return;

        const data: LinhaCSV[] = res.data.slice(1);

        const mapa: Record<string, { totalKG: number; total: number }> = {};
        const municipiosSet = new Set<string>();

        data.forEach(item => {
          const municipio = item[0]?.trim().toUpperCase();
          const totalKG = parseFloat(item[1]?.trim().replace(/\./g, '').replace(',', '.')) || 0;
          const total = parseFloat(item[2]?.trim().replace(/\./g, '').replace(',', '.')) || 0;

          if (municipio) {
            municipiosSet.add(municipio);
            mapa[municipio] = {
              totalKG: mapa[municipio]?.totalKG || totalKG,
              total: mapa[municipio]?.total || total,
            };
          }
        });

        const totalKGList = Object.entries(mapa)
          .map(([municipio, valores]) => ({ municipio, totalKG: valores.totalKG }))
          .sort((a, b) => b.totalKG - a.totalKG);

        const totalList = Object.entries(mapa)
          .map(([municipio, valores]) => ({ municipio, total: valores.total }))
          .sort((a, b) => b.total - a.total);

        setTotalAdquiridoMunicipios(totalKGList);
        setInvestimentoPorMunicipio(totalList);
        setMunicipiosFornecedor(municipiosSet.size);
      });
  
      
  fetch('/api/sheets/programas/paa/Entidades')
    .then(res => res.json())
    .then(res => {
      if (!res || !res.data) return;

      const data: LinhaCSV[] = res.data.slice(1);

      const entidadesSet = new Set(data.map((item: LinhaCSV) => item[2]));
      setEntidades(entidadesSet.size);

      const entidadesProcessadas = data
        .filter(item => item[0] && item[1] && item[2] && item[3])
        .map(item => {
          const doacaoKg = parseFloat(item[2].replace(/\./g, '').replace(',', '.')) || 0;
          const valor = parseFloat(item[3].replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;

          return {
            entidade: item[0].trim(),
            municipio: item[1].trim(),
            doacaoKg: doacaoKg.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            valor: `R$ ${valor.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          };
        });

      setEntidadesFiltradas(entidadesProcessadas);
    });




  }, []);

  return (
    <ProtectedRoute>
      <>
        <NoScroll />
        <div className="flex bg-white min-h-screen w-full" style={{ zoom: "80%" }}>

            <Sidebar />
        <div className="flex-1 h-full overflow-y-auto">
            <div className="w-full pt-6 pb-2 bg-white shadow-sm border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-1">
                <span className="text-black font-medium">Programas</span> /
                <span className="text-black"> Segurança Alimentar</span> /
                <span className="text-gray-400"> PAA - CDS</span>
              </p>
              <h1 className="text-2xl font-bold text-black">PAA - CDS</h1>
              <div className="flex space-x-10 mt-5 border-b border-gray-300">
                {['Visão Geral', 'Agricultores', 'Entidades','Cooperativas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                    setAbaAtiva(tab);
                    if (tab !== 'Cooperativas') {
                      setFiltroCooperativa('');
                      setFiltroProduto('');
                      setFiltroMunicipioCompras('');
                      setFiltroEntidadeCompras('');
                      setFiltroMunicipioEntidade(''); 
                      setPesquisaCnpjCompras('');
                      setCampoPesquisa('nome'); 
                      setFiltroMunicipio('');
                      setPesquisaTexto('');
                      setFiltroStatus('');
                      setPesquisaEntidade('');
                      setPaginaCompras(1);
                    }
                  }}

                    className={`pb-2 text-base font-medium transition-colors cursor-pointer ${
                      abaAtiva === tab ? 'border-b-2 border-blue-900 text-blue-900' : 'text-gray-700 hover:text-blue-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

            </div>

           

            {abaAtiva === 'Visão Geral' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl">
                <CardPrograma value={beneficiarios} label="Total de beneficiários" icon={<FaUsers />} bgColor="bg-pink-100" iconBg="bg-pink-500" />
                <CardPrograma value={agricultores} label="Total de agricultores" icon={<FaTractor />} bgColor="bg-blue-100" iconBg="bg-blue-500" />
                <CardPrograma value={mulheres} label="Total de Agricultoras" icon={<FaFemale />} bgColor="bg-purple-100" iconBg="bg-purple-500" />
                <CardPrograma value={municipiosFornecedor} label="Municípios Fornecedores" icon={<FaMapMarkedAlt />} bgColor="bg-yellow-100" iconBg="bg-yellow-500" />
                <CardPrograma value={cooperativas} label="Total de Cooperativas" icon={<FaHandshake />} bgColor="bg-green-100" iconBg="bg-green-500" />
                <CardPrograma value={entidades} label="Total de Entidades" icon={<FaBuilding />} bgColor="bg-indigo-100" iconBg="bg-indigo-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <div className="h-[600px] bg-white rounded-xl shadow p-4">
                  <h2 className="text-lg font-bold text-center mb-2">Beneficiários por Município</h2>
                  <Bar
                    data={{
                      labels: beneficiariosData.map(item => item.municipio),
                      datasets: [{
                        label: 'Beneficiários',
                        data: beneficiariosData.map(item => item.quantidade),
                        backgroundColor: '#3498db',
                        borderRadius: 5,
                      }],
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: true } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#555' } },
                        y: { grid: { display: false }, ticks: { font: { size: 13 }, color: '#333' } },
                      },
                    }}
                  />
                </div>

                <div className="h-[600px] bg-white rounded-xl shadow p-4">
                  <h2 className="text-lg font-bold text-center mb-2">Total Adquirido (KG) por Município</h2>
                  <Bar
                    data={{
                      labels: totalAdquiridoMunicipios.map(item => item.municipio),
                      datasets: [{
                        label: 'Total Adquirido (KG)',
                        data: totalAdquiridoMunicipios.map(item => item.totalKG),
                        backgroundColor: '#f39c12',
                        borderRadius: 5,
                      }],
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: true } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#555' } },
                        y: { grid: { display: false }, ticks: { font: { size: 13 }, color: '#333' } },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <div className="h-[600px] bg-white rounded-xl shadow p-4">
                  <h2 className="text-lg font-bold text-center mb-2">Investimento (R$) por Município</h2>
                  <Bar
                    data={{
                      labels: investimentoPorMunicipio.map(item => item.municipio),
                      datasets: [{
                        label: 'Investimento (R$)',
                        data: investimentoPorMunicipio.map(item => item.total),
                        backgroundColor: '#8e44ad',
                        borderRadius: 5,
                      }],
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: context =>
                              `Investimento: R$ ${Number(context.raw).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 12 },
                            color: '#555',
                            callback: value => `R$ ${Number(value).toLocaleString('pt-BR')}`,
                          },
                        },
                        y: { grid: { display: false }, ticks: { font: { size: 13 }, color: '#333' } },
                      },
                    }}
                  />
                </div>

                <div className="h-[600px] bg-white rounded-xl shadow p-4">
                  <h2 className="text-lg font-bold text-center mb-2">Agricultores por Município</h2>
                  <Bar
                    data={{
                      labels: agricultoresPorMunicipio.map(item => item.municipio),
                      datasets: [{
                        label: 'Agricultores',
                        data: agricultoresPorMunicipio.map(item => item.quantidade),
                        backgroundColor: '#2ecc71',
                        borderRadius: 5,
                      }],
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { enabled: true } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#555' } },
                        y: { grid: { display: false }, ticks: { font: { size: 13 }, color: '#333' } },
                      },
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {abaAtiva === 'Agricultores' && (
            <div className="p-10">
              <h2 className="text-2xl font-bold mb-4 text-black">Lista de Agricultores</h2>

              
              <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Ordenação */}
              <select
                value={ordenacao}
                onChange={(e) => {
                  setOrdenacao(e.target.value as 'asc' | 'desc');
                  setPaginaAtual(1);
                }}
                className="rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="asc">Ordenar: A → Z</option>
                <option value="desc">Ordenar: Z → A</option>
              </select>

              {/* Filtro Município */}
              <select
                value={filtroMunicipio}
                onChange={(e) => {
                  setFiltroMunicipio(e.target.value);
                  setPaginaAtual(1);
                }}
                className="rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="">Todos os Municípios</option>
                {[...new Set(agricultoresFiltrados.map(a => a.municipio))].map((municipio, idx) => (
                  <option key={idx} value={municipio}>{municipio}</option>
                ))}
              </select>

              {/* Filtro Status */}
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1);
                }}
                className="rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="">Todos os Status</option>
                {[...new Set(agricultoresFiltrados.map(a => a.status))].map((status, idx) => (
                  <option key={idx} value={status}>{status}</option>
                ))}
              </select>

              {/* Campo pesquisa */}
              <select
                value={campoPesquisa}
                onChange={(e) => setCampoPesquisa(e.target.value as 'nome' | 'cpf' | 'endereco')}
                className="rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="nome">Nome</option>
                <option value="cpf">CPF</option>
                <option value="endereco">Endereço</option>
              </select>

              {/* Barra de pesquisa com lupa */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder={`Pesquisar por ${campoPesquisa}...`}
                  value={pesquisaTexto}
                  onChange={(e) => {
                    setPesquisaTexto(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-96 pl-10 rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
                />
              </div>
            </div>

              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-600 border-b">
                    <th className="px-4 py-2">Nome Completo</th>
                    <th className="px-4 py-2">CPF</th>
                    <th className="px-4 py-2">Endereço</th>
                    <th className="px-4 py-2">Município</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...agricultoresFiltrados]
                    .filter(a =>
                    (!filtroMunicipio || a.municipio === filtroMunicipio) &&
                    (!filtroStatus || a.status === filtroStatus) &&
                    (!pesquisaTexto || a[campoPesquisa].toLowerCase().includes(pesquisaTexto.toLowerCase()))
                  )
                    .sort((a, b) =>
                      ordenacao === 'asc'
                        ? a.nome.localeCompare(b.nome)
                        : b.nome.localeCompare(a.nome)
                    )
                    .slice((paginaAtual - 1) * 10, paginaAtual * 10)
                    .map((agricultor, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{agricultor.nome}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{agricultor.cpf}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{agricultor.endereco}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{agricultor.municipio}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{agricultor.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="flex justify-center mt-6 space-x-2">
                <button
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    paginaAtual === 1
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                  }`}
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((prev) => prev - 1)}
                >
                  ← Anterior
                </button>

                <span className="px-4 py-2 text-lg font-semibold">
                  Página {paginaAtual} de {Math.ceil(
                    agricultoresFiltrados.filter(a =>
                      (!filtroMunicipio || a.municipio === filtroMunicipio) &&
                      (!filtroStatus || a.status === filtroStatus) &&
                      (!pesquisaTexto ||
                        a.nome.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.cpf.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.endereco.toLowerCase().includes(pesquisaTexto.toLowerCase()))
                    ).length / 10
                  )}
                </span>

                <button
                  className={`px-4 py-2 rounded-md transition-all duration-300 ${
                    paginaAtual * 10 >= agricultoresFiltrados.filter(a =>
                      (!filtroMunicipio || a.municipio === filtroMunicipio) &&
                      (!filtroStatus || a.status === filtroStatus) &&
                      (!pesquisaTexto ||
                        a.nome.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.cpf.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.endereco.toLowerCase().includes(pesquisaTexto.toLowerCase()))
                    ).length
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                  }`}
                  disabled={
                    paginaAtual * 10 >= agricultoresFiltrados.filter(a =>
                      (!filtroMunicipio || a.municipio === filtroMunicipio) &&
                      (!filtroStatus || a.status === filtroStatus) &&
                      (!pesquisaTexto ||
                        a.nome.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.cpf.toLowerCase().includes(pesquisaTexto.toLowerCase()) ||
                        a.endereco.toLowerCase().includes(pesquisaTexto.toLowerCase()))
                    ).length
                  }
                  onClick={() => setPaginaAtual((prev) => prev + 1)}
                >
                  Próximo →
                </button>
              </div>
              
            </div>
          )}
         {abaAtiva === 'Entidades' && (
          <div className="p-10">
            <h2 className="text-2xl font-bold mb-4 text-black">Lista de Entidades</h2>

            <div className="flex items-center gap-4 mb-4">
              {/* Ordenação */}
              <select
                value={ordenacaoEntidade}
                onChange={(e) => {
                  setOrdenacaoEntidade(e.target.value as 'asc' | 'desc');
                  setPaginaEntidade(1);
                }}
                className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="asc">Ordenar: A → Z</option>
                <option value="desc">Ordenar: Z → A</option>
              </select>

              {/* Filtro Município */}
              <select
                value={filtroMunicipioEntidade}
                onChange={(e) => {
                  setFiltroMunicipioEntidade(e.target.value);
                  setPaginaEntidade(1);
                }}
                className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
              >
                <option value="">Todos os Municípios</option>
                {[...new Set(entidadesFiltradas.map((a) => a.municipio))].map((municipio, idx) => (
                  <option key={idx} value={municipio as string}>{municipio as string}</option>
                ))}
              </select>

              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por nome da entidade..."
                  value={pesquisaEntidade}
                  onChange={(e) => {
                    setPesquisaEntidade(e.target.value);
                    setPaginaEntidade(1);
                  }}
                  className="w-96 pl-10 rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-600 border-b">
                  <th className="px-4 py-2">Entidade</th>
                  <th className="px-4 py-2">Município</th>
                  <th className="px-4 py-2">Doação (KG)</th>
                  <th className="px-4 py-2">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {[...entidadesFiltradas]
                  .filter((a) =>
                    (!filtroMunicipioEntidade || a.municipio === filtroMunicipioEntidade) &&
                    (!pesquisaEntidade || a.entidade.toLowerCase().includes(pesquisaEntidade.toLowerCase()))
                  )
                  .sort((a, b) =>
                    ordenacaoEntidade === 'asc'
                      ? a.entidade.localeCompare(b.entidade)
                      : b.entidade.localeCompare(a.entidade)
                  )
                  .slice((paginaEntidade - 1) * 10, paginaEntidade * 10)
                  .map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.entidade}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.municipio}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.doacaoKg}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.valor}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="flex justify-center mt-6 space-x-2">
              <button
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  paginaEntidade === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                }`}
                disabled={paginaEntidade === 1}
                onClick={() => setPaginaEntidade((prev) => prev - 1)}
              >
                ← Anterior
              </button>

              <span className="px-4 py-2 text-lg font-semibold">
                Página {paginaEntidade} de {Math.ceil(
                  entidadesFiltradas.filter((a) =>
                    (!filtroMunicipioEntidade || a.municipio === filtroMunicipioEntidade) &&
                    (!pesquisaEntidade || a.entidade.toLowerCase().includes(pesquisaEntidade.toLowerCase()))
                  ).length / 10
                )}
              </span>

              <button
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  paginaEntidade * 10 >= entidadesFiltradas.filter((a) =>
                    (!filtroMunicipioEntidade || a.municipio === filtroMunicipioEntidade) &&
                    (!pesquisaEntidade || a.entidade.toLowerCase().includes(pesquisaEntidade.toLowerCase()))
                  ).length
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                }`}
                disabled={
                  paginaEntidade * 10 >= entidadesFiltradas.filter((a) =>
                    (!filtroMunicipioEntidade || a.municipio === filtroMunicipioEntidade) &&
                    (!pesquisaEntidade || a.entidade.toLowerCase().includes(pesquisaEntidade.toLowerCase()))
                  ).length
                }
                onClick={() => setPaginaEntidade((prev) => prev + 1)}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}


       {abaAtiva === 'Cooperativas' && (
        <div className="p-10">
          <h2 className="text-2xl font-bold mb-4 text-black">Compras por Cooperativa</h2>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Filtro Cooperativa */}
            <select
              value={filtroCooperativa}
              onChange={(e) => {
                setFiltroCooperativa(e.target.value);
                setPaginaCompras(1);
              }}
              className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
            >
              <option value="">Todas as Cooperativas</option>
              {[...new Set(comprasFiltradas.map(item => item.cooperativa))].map((coop, idx) => (
                <option key={idx} value={coop}>{coop}</option>
              ))}
            </select>

            {/* Filtro Produto */}
            <select
              value={filtroProduto}
              onChange={(e) => {
                setFiltroProduto(e.target.value);
                setPaginaCompras(1);
              }}
              className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
            >
              <option value="">Todos os Produtos</option>
              {[...new Set(comprasFiltradas.map(item => item.produto))].map((prod, idx) => (
                <option key={idx} value={prod}>{prod}</option>
              ))}
            </select>

            {/* Filtro Município */}
            <select
              value={filtroMunicipioCompras}
              onChange={(e) => {
                setFiltroMunicipioCompras(e.target.value);
                setPaginaCompras(1);
              }}
              className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
            >
              <option value="">Todos os Municípios</option>
              {[...new Set(comprasFiltradas.map(item => item.municipio))].map((mun, idx) => (
                <option key={idx} value={mun}>{mun}</option>
              ))}
            </select>

            {/* Filtro Entidade */}
            <select
              value={filtroEntidadeCompras}
              onChange={(e) => {
                setFiltroEntidadeCompras(e.target.value);
                setPaginaCompras(1);
              }}
              className="rounded-full px-4 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
            >
              <option value="">Todas as Entidades</option>
              {[...new Set(comprasFiltradas.map(item => item.entidade))].map((ent, idx) => (
                <option key={idx} value={ent}>{ent}</option>
              ))}
            </select>

            {/* Campo de pesquisa (Nome ou CNPJ) */}
            <select
              value={campoPesquisaCompras}
              onChange={(e) => setCampoPesquisaCompras(e.target.value as 'cooperativa' | 'cnpj')}
              className="rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700"
            >
              <option value="cooperativa">Nome da Cooperativa</option>
              <option value="cnpj">CNPJ</option>
            </select>

            {/* Barra de pesquisa com lupa */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">🔍</span>
              <input
                type="text"
                placeholder={`Pesquisar por ${campoPesquisaCompras === 'cooperativa' ? 'nome' : 'CNPJ'}...`}
                value={pesquisaTextoCompras}
                onChange={(e) => {
                  setPesquisaTextoCompras(e.target.value);
                  setPaginaCompras(1);
                }}
                className="w-96 pl-10 rounded-full px-6 py-2 border border-gray-300 shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabela */}
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-600 border-b">
                {filtroCooperativa === '' && (
                  <>
                    <th className="px-4 py-2">Cooperativa</th>
                    <th className="px-4 py-2">CNPJ</th>
                  </>
                )}

                <th className="px-4 py-2">Nota</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Quantidade</th>
                <th className="px-4 py-2">Valor Unit.</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Entidade Beneficiada</th>
                <th className="px-4 py-2">Município Beneficiário</th>
              </tr>
            </thead>
            <tbody>
              {[...comprasFiltradas]
                .filter(item =>
                  (!filtroCooperativa || item.cooperativa === filtroCooperativa) &&
                  (!filtroProduto || item.produto === filtroProduto) &&
                  (!filtroMunicipioCompras || item.municipio === filtroMunicipioCompras) &&
                  (!filtroEntidadeCompras || item.entidade === filtroEntidadeCompras) &&
                  (!pesquisaTextoCompras || item[campoPesquisaCompras]?.toLowerCase().includes(pesquisaTextoCompras.toLowerCase()))
                )
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                .slice((paginaCompras - 1) * 10, paginaCompras * 10)
                .map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {filtroCooperativa === '' && (
                      <>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.cooperativa}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.cnpj}</td>
                      </>
                    )}
                    <td className="px-4 py-2 text-sm text-gray-900">{item.nrNota}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.data}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.produto}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.quantidade}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">R$ {item.valorUnidade}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">R$ {item.total}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.entidade}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.municipio}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="flex justify-center mt-6 space-x-2">
            <button
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                paginaCompras === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
              }`}
              disabled={paginaCompras === 1}
              onClick={() => setPaginaCompras(prev => prev - 1)}
            >
              ← Anterior
            </button>

            <span className="px-4 py-2 text-lg font-semibold">
              Página {paginaCompras} de {Math.ceil(
                comprasFiltradas.filter(item =>
                  (!filtroCooperativa || item.cooperativa === filtroCooperativa) &&
                  (!filtroProduto || item.produto === filtroProduto) &&
                  (!filtroMunicipioCompras || item.municipio === filtroMunicipioCompras) &&
                  (!filtroEntidadeCompras || item.entidade === filtroEntidadeCompras) &&
                  (!pesquisaTextoCompras || item[campoPesquisaCompras]?.toLowerCase().includes(pesquisaTextoCompras.toLowerCase()))
                ).length / 10
              )}
            </span>

            <button
              className={`px-4 py-2 rounded-md transition-all duration-300 ${
                paginaCompras * 10 >= comprasFiltradas.filter(item =>
                  (!filtroCooperativa || item.cooperativa === filtroCooperativa) &&
                  (!filtroProduto || item.produto === filtroProduto) &&
                  (!filtroMunicipioCompras || item.municipio === filtroMunicipioCompras) &&
                  (!filtroEntidadeCompras || item.entidade === filtroEntidadeCompras) &&
                  (!pesquisaTextoCompras || item[campoPesquisaCompras]?.toLowerCase().includes(pesquisaTextoCompras.toLowerCase()))
                ).length
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
              }`}
              disabled={
                paginaCompras * 10 >= comprasFiltradas.filter(item =>
                  (!filtroCooperativa || item.cooperativa === filtroCooperativa) &&
                  (!filtroProduto || item.produto === filtroProduto) &&
                  (!filtroMunicipioCompras || item.municipio === filtroMunicipioCompras) &&
                  (!filtroEntidadeCompras || item.entidade === filtroEntidadeCompras) &&
                  (!pesquisaTextoCompras || item[campoPesquisaCompras]?.toLowerCase().includes(pesquisaTextoCompras.toLowerCase()))
                ).length
              }
              onClick={() => setPaginaCompras(prev => prev + 1)}
            >
              Próximo →
            </button>
          </div>
        </div>
      )}



          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
