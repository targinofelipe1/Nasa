"use client";

import { JSX, useState } from "react";
import { toast } from "sonner";
import ReactDOMServer from 'react-dom/server';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiData: any[];
}

const getTituloRelatorio = (): string => {
  return window.location.pathname.includes("relatorio-municipal")
    ? "Relatório Municipal"
    : "Relatório Estadual";
};

// Componente JSX do cabeçalho
const LogoHeader = ({
  selectedRegionals,
  selectedMunicipios,
  data,
}: {
  selectedRegionals: string[];
  selectedMunicipios: string[];
  data: any[];
}): JSX.Element => {
  const titulo = getTituloRelatorio();

  const municipiosDoEstadual =
    titulo === "Relatório Estadual" && selectedRegionals.length > 0
      ? data
          .filter((row) => selectedRegionals.includes(row.RGA))
          .map((row) => row.Município)
          .sort()
      : [];

  return (
    <div
      id="print-header"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        padding: "20px",
        pageBreakAfter: "always",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>{titulo}</h1>
      <h2 style={{ fontSize: "24px", marginTop: "10px" }}>DataMetrics</h2>

      {titulo === "Relatório Estadual" && selectedRegionals.length > 0 && (
        <>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Regionais Selecionadas: {selectedRegionals.join(", ")}
          </p>
          <p style={{ fontSize: "16px" }}>
            <strong>Municípios:</strong> {municipiosDoEstadual.join(", ")}
          </p>
        </>
      )}

      {titulo === "Relatório Municipal" && selectedMunicipios.length > 0 && (
        <p style={{ fontSize: "18px", fontWeight: "bold" }}>
          Municípios Selecionados: {selectedMunicipios.join(", ")}
        </p>
      )}
    </div>
  );
};

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, apiData }) => {
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<string[]>([]);
  
  const todasAsTabelas = ["Indicadores", "População", "Cadastro Único", "Bolsa Família", "Protecão Básica", "Protecão Especial", "Segurança Alimentar", "Casas da Cidadanias","Posto do SINE", "Abono Natalino", "Saúde", "Educacão"];

  const handleTabelaSelecionada = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setTabelasSelecionadas(checked ? [...tabelasSelecionadas, value] : tabelasSelecionadas.filter((t) => t !== value));
  };

  const toggleSelecionarTodas = () => {
    setTabelasSelecionadas(tabelasSelecionadas.length === todasAsTabelas.length ? [] : todasAsTabelas);
  };

  const imprimirRelatorio = () => {
    if (tabelasSelecionadas.length === 0) {
      toast.info("Selecione pelo menos uma tabela para imprimir.");
      return;
    }

    const selectedRegionals = JSON.parse(sessionStorage.getItem("selectedRegionals") || "[]");
    const selectedMunicipios = JSON.parse(sessionStorage.getItem("selectedMunicipals") || "[]");

    const printContainer = document.createElement("div");
    printContainer.id = "print-container";

    const headerContainer = document.createElement("div");
    // Adiciona o componente LogoHeader ao DOM de impressão
    const headerElement = (
      <LogoHeader
        selectedRegionals={selectedRegionals}
        selectedMunicipios={selectedMunicipios}
        data={apiData}
      />
    );
    // Para renderizar JSX para string HTML
    headerContainer.innerHTML = ReactDOMServer.renderToString(headerElement);
    printContainer.appendChild(headerContainer);

    let hasContent = false;
    tabelasSelecionadas.forEach((id, index) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        hasContent = true;
        
        if (index > 0) {
          const pageBreak = document.createElement("div");
          pageBreak.className = "page-break-before";
          printContainer.appendChild(pageBreak);
        }

        const sectionHeader = document.createElement("div");
        sectionHeader.className = "section-header";
        sectionHeader.innerHTML = `
          <h1 style="font-size: 24px; font-weight: bold;">${id.replace(/([A-Z])/g, " $1")}</h1>
          <hr style="margin: 20px 0; border: 1px solid black;">
        `;
        printContainer.appendChild(sectionHeader);

        const clone = elemento.cloneNode(true) as HTMLElement;
        printContainer.appendChild(clone);
      }
    });

    if (!hasContent) {
      toast.info("Nenhuma tabela selecionada possui conteúdo para impressão.");
      return;
    }

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
        }
        #print-header {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100%;
          page-break-after: always;
        }
        .page-break-before {
          page-break-before: always;
        }
        .no-print {
          display: none !important;
        }
        
        table, table tr {
          page-break-inside: avoid;
        }
        h2 {
          page-break-after: avoid;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(style);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)'
      }}>
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm relative"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Fechar"
        >
          &times;
        </button>
        <h3 className="font-bold text-lg mb-2">Selecione a tabela:</h3>

        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={tabelasSelecionadas.length === todasAsTabelas.length}
            onChange={toggleSelecionarTodas}
            className="mr-2"
          />
          Selecionar Todas
        </label>
        {todasAsTabelas.map((tabela) => (
          <label key={tabela} className="flex items-center mb-2">
            <input
              type="checkbox"
              value={tabela}
              checked={tabelasSelecionadas.includes(tabela)}
              onChange={handleTabelaSelecionada}
              className="mr-2"
            />
            {tabela.charAt(0).toUpperCase() + tabela.slice(1).replace(/([A-Z])/g, " $1")}
          </label>
        ))}

        <button
          onClick={imprimirRelatorio}
          className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 w-full"
        >
          Confirmar Geração
        </button>
      </div>
    </div>
  );
};

export default PrintModal;