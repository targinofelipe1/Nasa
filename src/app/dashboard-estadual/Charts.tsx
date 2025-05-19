"use client";

import { useEffect, useState } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
  LogarithmicScale,
} from "chart.js";

ChartJS.register(LineElement, BarElement,LogarithmicScale, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ArcElement);

export default function Charts({ data = [] }: { data?: any[] }) {
  const [populacaoTotal, setPopulacaoTotal] = useState<{ year: string; value: number }[]>([]);
  const [populacaoUrbana, setPopulacaoUrbana] = useState<{ year: string; value: number }[]>([]);
  const [populacaoRural, setPopulacaoRural] = useState<{ year: string; value: number }[]>([]);
  const [porteCounts, setPorteCounts] = useState<Record<string, number>>({});
  const [percentChange, setPercentChange] = useState<{ total: number; urbana: number; rural: number }>({ total: 0, urbana: 0, rural: 0 });

  const findKey = (columnName: string) => {
    if (!data || data.length === 0 || !data[0]) return ""; // 🔹 Evita erro se data estiver vazio
    return Object.keys(data[0]).find(
      key => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.trim().toLowerCase()
    ) || "";
  };
  
  
  const parseNumber = (value: any): number => {
    if (value === undefined || value === null) return 0; // 🔹 Evita erro se o valor for null ou undefined
    if (typeof value === "number") return value; // 🔹 Se já for número, retorna direto
    return parseFloat(value.toString().replace(/\./g, "").replace(",", ".").replace("%", "").trim()) || 0;
  };
  

  useEffect(() => {
    if (!data || data.length === 0) return;

    const total2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");
    const total2022Key = findKey("População CENSO - IBGE/2022 - Total 2022");
    
    const urbana2010Key = findKey("População - CENSO - IBGE/2010 - Urbana");
    const urbana2022PercentKey = findKey("População CENSO - IBGE/2022 - % Urbana ref 2010");

    const rural2010Key = findKey("População - CENSO - IBGE/2010 - Rural");
    const rural2022PercentKey = findKey("População CENSO - IBGE/2022 - % Rural ref 2010");

    const total2010 = data.reduce((sum, row) => sum + parseNumber(row[total2010Key]?.toString()), 0);
    const total2022 = data.reduce((sum, row) => sum + parseNumber(row[total2022Key]?.toString()), 0);

    const calcPercentChange = (oldValue: number, newValue: number) => {
      if (oldValue === 0) return 0;
      return ((newValue - oldValue) / oldValue) * 100;
    };

    setPercentChange({
      total: calcPercentChange(total2010, total2022),
      urbana: 0,
      rural: 0,
    });

    setPopulacaoTotal([
      { year: "2010", value: total2010 },
      { year: "2022", value: total2022 },
    ]);

    const urbana2010 = data.reduce((sum, row) => sum + parseNumber(row[urbana2010Key]?.toString()), 0);
    const urbana2022 = total2022 > 0
      ? Math.round(total2022 * (parseNumber(data[0][urbana2022PercentKey]?.toString()) / 100))
      : 0;

    setPercentChange(prev => ({ ...prev, urbana: calcPercentChange(urbana2010, urbana2022) }));

    setPopulacaoUrbana([
      { year: "2010", value: urbana2010 },
      { year: "2022", value: urbana2022 },
    ]);

    const rural2010 = data.reduce((sum, row) => sum + parseNumber(row[rural2010Key]?.toString()), 0);
    const rural2022 = total2022 > 0
      ? Math.round(total2022 * (parseNumber(data[0][rural2022PercentKey]?.toString()) / 100))
      : 0;

    setPercentChange(prev => ({ ...prev, rural: calcPercentChange(rural2010, rural2022) }));

    setPopulacaoRural([
      { year: "2010", value: rural2010 },
      { year: "2022", value: rural2022 },
    ]);

    const porteKey = findKey("Porte (CENSO, 2022)");
    if (porteKey) {
      const porteData = data.reduce((acc, row) => {
        const porte = row[porteKey]?.toString().trim() || "Desconhecido";
        acc[porte] = (acc[porte] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setPorteCounts(porteData);
    }
  }, [data]);

      // 🔹 Encontrando chaves corretas
        const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
        const taxaEscolarizacaoKey = findKey("Educação - Taxa de Escolarização 6 a 14 anos - % (2010)");
        const populacao2022Key = findKey("População CENSO - IBGE/2022 - Total 2022");
        const populacao2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");

        // 🔹 Garantindo que as colunas foram encontradas antes de acessar os dados
        const taxaAlfabetizacao = taxaAlfabetizacaoKey ? parseNumber(data[0][taxaAlfabetizacaoKey]) / 100 : 0;
        const taxaEscolarizacao = taxaEscolarizacaoKey ? parseNumber(data[0][taxaEscolarizacaoKey]) / 100 : 0;
        const populacao2022 = populacao2022Key ? parseNumber(data[0][populacao2022Key]) : 0;
        const populacao2010 = populacao2010Key ? parseNumber(data[0][populacao2010Key]) : 0;

        // 🔹 Cálculo correto com base na população correspondente
        const alfabetizados = Math.round(taxaAlfabetizacao * populacao2022);
        const escolarizados = Math.round(taxaEscolarizacao * populacao2010);

        // 🔹 Garantindo que os valores não ultrapassem a população correspondente
        const alfabetizadosCorrigido = Math.min(alfabetizados, populacao2022);
        const escolarizadosCorrigido = Math.min(escolarizados, populacao2010);


        const formatPercent = (value: number) => {
          if (value === 0) return "0";
          const sinal = value > 0 ? "+" : "-";
          return `${sinal} ${Math.abs(value).toFixed(3)}%`;
        };
        
        

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const, // ✅ Mantém a legenda no topo
        labels: {
          font: {
            size: 14,
          },
          color: "#333",
          boxWidth: 15, // ✅ Define o tamanho do quadrado da legenda
          usePointStyle: false, // ✅ Usa quadrado sólido ao invés de bolinha
          padding: 10, // ✅ Espaçamento uniforme
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255, 255, 255, 0.9)", // ✅ Fundo branco suave
        titleColor: "#333", // ✅ Cor do título do tooltip
        bodyColor: "#333", // ✅ Cor do texto do tooltip
        borderColor: "#ccc", // ✅ Borda sutil
        borderWidth: 1, // ✅ Mantém borda fina
        displayColors: true, // ✅ Exibe a cor correta no tooltip
        callbacks: {
          labelColor: function (context: any) {
            return {
              borderColor: context.dataset.borderColor, // ✅ Usa a cor da linha
              backgroundColor: context.dataset.borderColor, // ✅ Usa a cor da linha
              borderWidth: 0, // ✅ Remove qualquer borda extra
            };
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: false, grid: { display: false } }, // ✅ Remove grades do eixo Y
      x: { beginAtZero: false, grid: { display: false } }, // ✅ Remove grades do eixo X
    },
  };
  

  return (

  <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold">Gráficos</h2>
      <p>Visualização Gráfica.</p>
      <p></p>
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* População Total */}
      <div className="h-[350px]">
        <h2 className="text-lg font-bold text-center">População Total</h2>
        <Line
          data={{
            labels: populacaoTotal.map(p => p.year),
            datasets: [
              {
                label: formatPercent(percentChange.total),
                data: populacaoTotal.map(p => p.value),
                borderColor: "#4A90E2",
                backgroundColor: "transparent",
              },
            ],
          }}
          options={chartOptions}
        />
      </div>

      {/* População Urbana */}
      <div className="h-[350px]">
        <h2 className="text-lg font-bold text-center">População Urbana</h2>
        <Line
          data={{
            labels: populacaoUrbana.map(p => p.year),
            datasets: [
              {
                label: formatPercent(percentChange.urbana),
                data: populacaoUrbana.map(p => p.value),
                borderColor: "#50C878",
                backgroundColor: "transparent",
              },
            ],
          }}
          options={chartOptions}
        />
      </div>

      {/* População Rural */}
      <div className="h-[350px]">
        <h2 className="text-lg font-bold text-center">População Rural</h2>
        <Line
          data={{
            labels: populacaoRural.map(p => p.year),
            datasets: [
              {
                label: formatPercent(percentChange.rural),
                data: populacaoRural.map(p => p.value),
                borderColor: "#FF6B6B",
                backgroundColor: "transparent",
              },
            ],
          }}
          options={chartOptions}
        />
      </div>

      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Distribuição de Municípios por Porte (CENSO, 2022)</h2>
        <Doughnut
          data={{
            labels: Object.keys(porteCounts),
            datasets: [
              {
                data: Object.values(porteCounts),
                backgroundColor: ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
            },
          }}
        />
      </div>

      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Distribuição das Famílias por Faixa de Renda</h2>
        <Doughnut
          data={{
            labels: ["Pobreza (R$ 0,00 - R$ 218,00)", "Baixa Renda (R$ 218,01 - 1/2 SM)", "Acima de 1/2 SM"],
            datasets: [
              {
                data: [
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de 218,01 até 1/2 S.M.")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo")]?.toString()), 0),
                ],
                backgroundColor: ["#ff6b6b", "#f39c12", "#50c878"],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
            },
          }}
        />
      </div>

      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Distribuição da População por Grau de Instrução</h2>
        <Doughnut
          data={{
            labels: ["Ensino Fundamental", "Ensino Médio", "Ensino Superior"],
            datasets: [
              {
                data: [
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)")]?.toString()), 0),
                ],
                backgroundColor: ["#3498db", "#2ecc71", "#f39c12"],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
            },
          }}
        />
      </div>

      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Distribuição por Setor de Trabalho</h2>
        <Bar
          data={{
            labels: [
              "Conta Própria",
              "Temp. Rural",
              "Sem Carteira",
              "Com Carteira",
              "Doméstico (c/ carteira)",
              "Não-remunerado",
              "Militar/Servidor",
              "Empregador",
              "Estagiário/Aprendiz"
            ],
            datasets: [
              {
                label: "Quantidade de Pessoas",
                data: [
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador por conta própria")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador")]?.toString()), 0),
                  data.reduce((sum, row) => sum + parseNumber(row[findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz")]?.toString()), 0)
                ],
                backgroundColor: ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#8e44ad", "#e67e22", "#95a5a6"],
                borderRadius: 5,
              },
            ],
          }}
          options={{
            indexAxis: "y", 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }, 
              tooltip: { enabled: true },
            },
            scales: {
              x: {
                type: "logarithmic", 
                min: 100, 
                max: Math.max(
                  1000, 
                  Math.max(...data.map(d => d.value)) * 1.1 
                ),
                grid: { display: false },
                ticks: { font: { size: 12 }, color: "#555" },
              },
              y: {
                grid: { display: false },
                ticks: { font: { size: 14 }, color: "#555" },
              },
            },
            
          }}
        />
      </div>

      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Comparação de Famílias no Bolsa Família</h2>
        <Bar
          data={{
            labels: ["Renda per capita até R$218,00", "Baixa Renda"],
            datasets: [
              {
                label: "Total de Famílias",
                data: [
                  data.reduce(
                    (sum, row) =>
                      sum +
                      parseNumber(
                        row[
                          findKey(
                            "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024"
                          )
                        ]?.toString()
                      ),
                    0
                  ),
                  data.reduce(
                    (sum, row) =>
                      sum +
                      parseNumber(
                        row[
                          findKey(
                            "PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024"
                          )
                        ]?.toString()
                      ),
                    0
                  ),
                ],
                backgroundColor: ["#4A90E2", "#FF6B6B"],
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }, // 🔹 Remove legenda separada
              tooltip: { enabled: true },
            },
            scales: {
              x: {
                grid: { display: false }, // 🔹 Remove as linhas do eixo X
                ticks: { font: { size: 12 }, color: "#555" },
              },
              y: {
                grid: { display: false }, // 🔹 Remove as linhas do eixo Y
                ticks: { font: { size: 12 }, color: "#555" },
              },
            },
          }}
        />
      </div>
      <div className="h-[350px] mt-10">
        <h2 className="text-lg font-bold text-center">Taxa de Alfabetização e Escolarização</h2>
        <Bar
          data={{
            labels: ["Alfabetizados (2022)", "Escolarizados (2010)"],
            datasets: [
              {
                label: "Quantidade de Pessoas",
                data: [alfabetizados, escolarizados],
                backgroundColor: ["#4A90E2", "#50C878"],
                borderRadius: 5,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 12 }, color: "#555" } },
              y: { grid: { display: false }, ticks: { font: { size: 12 }, color: "#555" } },
            },
          }}
        />
      </div>
    </div>
  </div>
  );
}
