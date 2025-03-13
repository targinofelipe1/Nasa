import { useState } from "react";
import { toast } from "sonner";

const getTituloRelatorio = () => {
  return window.location.pathname.includes("relatorio-municipal") 
    ? "Relatório Municipal" 
    : "Relatório Estadual";
};

// Função para renderizar o cabeçalho do relatório
const LogoHeader = (selectedRegionals: string[], selectedMunicipios: string[]): string => {
  return `
    <div id="print-header" style="
      text-align: center; 
      margin-bottom: 20px; 
      display: flex; 
      flex-direction: column; 
      justify-content: center; 
      align-items: center; 
      height: 100vh;
      width: 100%; 
      padding: 20px;
      page-break-after: avoid;">
      
      <h1 style="font-size: 32px; font-weight: bold; text-align: center;">${getTituloRelatorio()}</h1>
      <h2 style="font-size: 24px; text-align: center; margin-top: 10px;">SEDH - Secretaria de Estado do Desenvolvimento Humano</h2>

      ${getTituloRelatorio() === "Relatório Estadual" && selectedRegionals.length > 0 
        ? `<p style="font-size: 18px; font-weight: bold;">Regionais Selecionadas: ${selectedRegionals.join(", ")}</p>` 
        : ""}
  
      ${getTituloRelatorio() === "Relatório Municipal" && selectedMunicipios.length > 0 
        ? `<p style="font-size: 18px; font-weight: bold;">Municípios Selecionados: ${selectedMunicipios.join(", ")}</p>` 
        : ""}
    </div>
  `;
};

const SecretariaHeader = () => {
  return `
    <div class="page-header" style="text-align: center; margin-bottom: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
      <h1 style="font-size: 28px; font-weight: bold; text-align: center;">Pollyanna Werton</h1>
      <h2 style="font-size: 22px; text-align: center; margin-top: 10px;">Secretária de Estado do Desenvolvimento Humano</h2>
    </div>
  `;
};

const BotaoImpressao = () => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<string[]>([]);

  const handleTabelaSelecionada = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setTabelasSelecionadas(checked ? [...tabelasSelecionadas, value] : tabelasSelecionadas.filter((t) => t !== value));
  };

  const imprimirRelatorio = () => {
    if (tabelasSelecionadas.length === 0) {
      toast.info("Selecione pelo menos uma tabela para imprimir.");
      return;
    }

    // 🔹 Obtém os valores ATUALIZADOS no momento da impressão
    const selectedRegionals = JSON.parse(sessionStorage.getItem("selectedRegionals") || "[]");
    const selectedMunicipios = JSON.parse(sessionStorage.getItem("selectedMunicipios") || "[]");

    const printContainer = document.createElement("div");
    printContainer.id = "print-container";

    printContainer.innerHTML += LogoHeader(selectedRegionals, selectedMunicipios);
    printContainer.innerHTML += SecretariaHeader();

    const pageHeader = `  
      <div class="page-header" style="text-align: center; margin-bottom: 20px; display: ${tabelasSelecionadas.length > 0 ? 'block' : 'none'};">
        <h1 style="font-size: 24px; font-weight: bold; text-align: center;">${getTituloRelatorio()}</h1>
        <h2 style="font-size: 18px; text-align: center;">SEDH - Secretaria de Estado do Desenvolvimento Humano</h2>
        
        ${getTituloRelatorio() === "Relatório Estadual" && selectedRegionals.length > 0 
          ? `<p style="font-size: 18px; font-weight: bold;">Regionais Selecionadas: ${selectedRegionals.join(", ")}</p>` 
          : ""}
    
        ${getTituloRelatorio() === "Relatório Municipal" && selectedMunicipios.length > 0 
          ? `<p style="font-size: 18px; font-weight: bold;">Municípios Selecionados: ${selectedMunicipios.join(", ")}</p>` 
          : ""}
        
        <hr style="margin: 20px 0; border: 1px solid black;">
      </div>
    `; 
    
    let hasContent = false;
    tabelasSelecionadas.forEach((id) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        hasContent = true;
        const clone = elemento.cloneNode(true) as HTMLElement;

        const pageBreak = document.createElement("div");
        pageBreak.innerHTML = pageHeader;
        pageBreak.style.pageBreakBefore = "always";
        printContainer.appendChild(pageBreak);

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
          padding: 20px;
        }
        .page-header {
          display: block;
          page-break-before: always;
        }
        .print-hidden {
          display: none;
        }
        @page :nth(2) {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(style);
  };

  const todasAsTabelas = ["indicadores", "populacao", "cadastrounico", "bolsafamilia", "protecaobasica", "protecaoepsecial", "segurancaalimentar", "casadacidadania", "abononatalino", "saude", "educacao"];

  const toggleSelecionarTodas = () => {
    setTabelasSelecionadas(tabelasSelecionadas.length === todasAsTabelas.length ? [] : todasAsTabelas);
  };

  return (
    <div className="relative">
      <div className="flex justify-end">
        <button
          onClick={() => setMostrarModal(!mostrarModal)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
        >
          🖨️ Imprimir Relatório
        </button>
      </div>

      {mostrarModal && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
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
            onClick={() => {
              setMostrarModal(false);
              imprimirRelatorio();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 w-full"
          >
            Confirmar Impressão
          </button>
        </div>
      )}
    </div>
  );
};

export default BotaoImpressao;
