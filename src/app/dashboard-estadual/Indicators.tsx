import { useState, useEffect, ReactNode } from "react";
import Card from "@/components/ui/Card";

interface Indicator {
  value: number;
  label: string;
  modalContent?: ReactNode;
  selectOptions?: { id: string; label: string; value: number }[]; 
}


export default function Indicators({
  data = [],
  setIsModalOpen, 
}: {
  data?: any[];
  setIsModalOpen: (state: boolean) => void;
}) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    
    const findKey = (columnName: string) =>
      Object.keys(data[0]).find(
        key => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.toLowerCase()
      ) || "";

    const municipioKey = findKey("Município");
    const populacaoKey = findKey("População CENSO - IBGE/2022 - Total 2022");
    const idhKey = findKey("IDH_M (IBGE, 2010)");
    const semiaridoKey = findKey("Municípios do Semiárido");
    const cadUnicoFamiliasKey = findKey("CADASTRO ÚNICO - Total de Familias CadÚnico");

    const cadUnicoFamiliasPobrezaKey = findKey(
      "CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00"
    );
    const cadUnicoFamiliasBaixaRendaKey = findKey(
      "CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de 218,01 até 1/2 S.M."
    );
    const cadUnicoFamiliasAcimaRendaKey = findKey(
      "CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo"
    );

   
    const totalMunicipios = municipioKey ? data.filter(row => row[municipioKey]).length : 0;

    const renderListaMunicipiosModal = (municipios: string[], total: number) => (
      <div>
        <h3 className="font-bold mb-4">Lista Completa de Municípios ({total})</h3>
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {municipios.map((municipio, index) => (
            <div key={index} className="p-2 border-b">
              {municipio}
            </div>
          ))}
        </div>
      </div>
    );

    const totalPopulacao = populacaoKey
      ? data.reduce((sum, row) => sum + (parseInt(row[populacaoKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    const totalIDH = idhKey
      ? data.reduce((sum, row) => sum + (parseFloat(row[idhKey]?.toString().replace(",", ".")) || 0), 0)
      : 0;
    const mediaIDH = totalMunicipios > 0 ? totalIDH / totalMunicipios : 0;
    const totalMunicipiosSemiarido = semiaridoKey
      ? data.filter(row => row[semiaridoKey]?.trim().toLowerCase() === "x").length
      : 0;

      const renderMunicipiosModal = (municipios: string[]) => (
        <div>
          <h3 className="font-bold mb-4">Lista de Municípios do Semiárido ({municipios.length})</h3>
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {municipios.map((municipio, index) => (
              <div key={index} className="p-2 border-b">
                {municipio}
              </div>
            ))}
          </div>
        </div>
      );

    const totalFamiliasCadUnico = cadUnicoFamiliasKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoFamiliasKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    const totalFamiliasPobreza = cadUnicoFamiliasPobrezaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoFamiliasPobrezaKey]?.toString().replace(/\s+/g, "").replace(/\./g, "")) || 0), 0)
      : 0;
    const totalFamiliasBaixaRenda = cadUnicoFamiliasBaixaRendaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoFamiliasBaixaRendaKey]?.toString().replace(/\s+/g, "").replace(/\./g, "")) || 0), 0)
      : 0;
    const totalFamiliasAcimaRenda = cadUnicoFamiliasAcimaRendaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoFamiliasAcimaRendaKey]?.toString().replace(/\s+/g, "").replace(/\./g, "")) || 0), 0)
      : 0;


    const cadUnicoModalContent = (
      <>
        <p><strong>Famílias em situação de Pobreza:</strong> {totalFamiliasPobreza.toLocaleString("pt-BR")}</p>
        <p><strong>Famílias de Baixa Renda:</strong> {totalFamiliasBaixaRenda.toLocaleString("pt-BR")}</p>
        <p><strong>Renda Acima de Meio Salário Mínimo:</strong> {totalFamiliasAcimaRenda.toLocaleString("pt-BR")}</p>
      </>
    );
    
    const populacaoUrbanaKey = findKey("População CENSO - IBGE/2022 - % Urbana ref 2010");
    const populacaoRuralKey = findKey("População CENSO - IBGE/2022 - % Rural ref 2010");

    const totalPopulacaoUrbana = populacaoUrbanaKey && populacaoKey
      ? Math.round(totalPopulacao * (parseFloat(data[0][populacaoUrbanaKey].replace(",", ".")) / 100))
      : 0;

    const totalPopulacaoRural = populacaoRuralKey && populacaoKey
      ? Math.round(totalPopulacao * (parseFloat(data[0][populacaoRuralKey].replace(",", ".")) / 100))
      : 0;

    const popModalContent = (
      <>
        <p><strong>População Urbana:</strong> {totalPopulacaoUrbana.toLocaleString("pt-BR")}</p>
        <p><strong>População Rural:</strong> {totalPopulacaoRural.toLocaleString("pt-BR")}</p>
      </>
    );

    const cadUnicoPessoasKey = findKey("CADASTRO ÚNICO - Total de Pessoas CadÚnico");
    const cadUnicoPessoasPobrezaKey = findKey(
      "CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00"
    );

    const totalPessoasCadUnico = cadUnicoPessoasKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoPessoasKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;

    const totalPessoasPobreza = cadUnicoPessoasPobrezaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoPessoasPobrezaKey]?.toString().replace(/\s+/g, "").replace(/\./g, "")) || 0), 0)
      : 0;

    const cadUnicoPessoasModalContent = (
      <>
        <p><strong>Pessoas em situação de Pobreza:</strong> {totalPessoasPobreza.toLocaleString("pt-BR")}</p>
      </>
    );

    const cadUnicoFundamentalKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)");
    const cadUnicoMedioKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)");
    const cadUnicoSuperiorKey = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)");

    const totalPessoasFundamental = cadUnicoFundamentalKey
    ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoFundamentalKey]?.toString().replace(/\./g, "")) || 0), 0)
    : 0;
  
    const totalPessoasMedio = cadUnicoMedioKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoMedioKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalPessoasSuperior = cadUnicoSuperiorKey
      ? data.reduce((sum, row) => sum + (parseInt(row[cadUnicoSuperiorKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalPessoasInstrucao = totalPessoasFundamental + totalPessoasMedio + totalPessoasSuperior;

    const instrucaoModalContent = (
      <>
        <p><strong>Ensino Fundamental:</strong> {totalPessoasFundamental.toLocaleString("pt-BR")}</p>
        <p><strong>Ensino Médio:</strong> {totalPessoasMedio.toLocaleString("pt-BR")}</p>
        <p><strong>Ensino Superior ou mais:</strong> {totalPessoasSuperior.toLocaleString("pt-BR")}</p>
      </>
    );

    const trabalhoContaPropriaKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador por conta própria");
    const trabalhoRuralKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural");
    const trabalhoSemCarteiraKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada");
    const trabalhoComCarteiraKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada");
    const trabalhoDomesticoKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada");
    const trabalhoNaoRemuneradoKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado");
    const trabalhoServidorPublicoKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público");
    const trabalhoEmpregadorKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador");
    const trabalhoEstagiarioKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz");

    
    const totalContaPropria = trabalhoContaPropriaKey
    ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoContaPropriaKey]?.toString().replace(/\./g, "")) || 0), 0)
    : 0;
  
    const totalRural = trabalhoRuralKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoRuralKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalSemCarteira = trabalhoSemCarteiraKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoSemCarteiraKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalComCarteira = trabalhoComCarteiraKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoComCarteiraKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalDomestico = trabalhoDomesticoKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoDomesticoKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalNaoRemunerado = trabalhoNaoRemuneradoKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoNaoRemuneradoKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalServidorPublico = trabalhoServidorPublicoKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoServidorPublicoKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalEmpregador = trabalhoEmpregadorKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoEmpregadorKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalEstagiario = trabalhoEstagiarioKey
      ? data.reduce((sum, row) => sum + (parseInt(row[trabalhoEstagiarioKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalTrabalho = totalContaPropria + totalRural + totalSemCarteira + totalComCarteira + totalDomestico + totalNaoRemunerado + totalServidorPublico + totalEmpregador + totalEstagiario;
    
    const trabalhoModalContent = (
      <>
        <p><strong>Trabalhador por conta própria:</strong> {totalContaPropria.toLocaleString("pt-BR")}</p>
        <p><strong>Trabalhador temporário rural:</strong> {totalRural.toLocaleString("pt-BR")}</p>
        <p><strong>Empregado sem carteira:</strong> {totalSemCarteira.toLocaleString("pt-BR")}</p>
        <p><strong>Empregado com carteira:</strong> {totalComCarteira.toLocaleString("pt-BR")}</p>
        <p><strong>Trabalhador doméstico:</strong> {totalDomestico.toLocaleString("pt-BR")}</p>
        <p><strong>Trabalhador não-remunerado:</strong> {totalNaoRemunerado.toLocaleString("pt-BR")}</p>
        <p><strong>Militar ou servidor público:</strong> {totalServidorPublico.toLocaleString("pt-BR")}</p>
        <p><strong>Empregador:</strong> {totalEmpregador.toLocaleString("pt-BR")}</p>
        <p><strong>Estagiário ou aprendiz:</strong> {totalEstagiario.toLocaleString("pt-BR")}</p>
      </>
    );

    const bolsaFamiliaTotalKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024");
    const bolsaFamiliaPobrezaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024");
    const bolsaFamiliaBaixaRendaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024");

    const totalBolsaFamilia = bolsaFamiliaTotalKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaTotalKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;

    const totalBolsaFamiliaPobreza = bolsaFamiliaPobrezaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaPobrezaKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;

    const totalBolsaFamiliaBaixaRenda = bolsaFamiliaBaixaRendaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaBaixaRendaKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;

    const bolsaFamiliaModalContent = (
      <>
         <p><strong>Famílias com renda até R$218,00:</strong> {totalBolsaFamiliaPobreza.toLocaleString("pt-BR")}</p>
         <p><strong>Famílias de Baixa Renda:</strong> {totalBolsaFamiliaBaixaRenda.toLocaleString("pt-BR")}</p>
      </>
    );

    const bolsaFamiliaPessoasTotalKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024");
    const bolsaFamiliaPessoasPobrezaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218");
    const bolsaFamiliaPessoasBaixaRendaKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024");
    
    const totalBolsaFamiliaPessoas = bolsaFamiliaPessoasTotalKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaPessoasTotalKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalBolsaFamiliaPessoasPobreza = bolsaFamiliaPessoasPobrezaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaPessoasPobrezaKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
    
    const totalBolsaFamiliaPessoasBaixaRenda = bolsaFamiliaPessoasBaixaRendaKey
      ? data.reduce((sum, row) => sum + (parseInt(row[bolsaFamiliaPessoasBaixaRendaKey]?.toString().replace(/\./g, "")) || 0), 0)
      : 0;
      
    const bolsaFamiliaPessoasModalContent = (
       <>
         <p><strong>Pessoas com renda até R$218,00:</strong> {totalBolsaFamiliaPessoasPobreza.toLocaleString("pt-BR")}</p>
         <p><strong>Pessoas de Baixa Renda:</strong> {totalBolsaFamiliaPessoasBaixaRenda.toLocaleString("pt-BR")}</p>
      </>
    );

    const protecaoSocialKeys = [
      { key: "Proteção Social Básica - Unidade de CRAS", label: "Unidade de CRAS" },
      { key: "Proteção Social Básica - Primeira Infância no SUAS", label: "Primeira Infância no SUAS", binary: true },
      { key: "Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe", label: "Órfãos do Programa Paraíba que Acolhe" },
      { key: "Proteção Social Básica - Acessuas Trabalho", label: "Acessuas Trabalho", binary: true },
      { key: "Proteção Social Básica - Residenciais Cidade Madura", label: "Residenciais Cidade Madura" },
      { key: "Proteção Social Básica - Centros Sociais Urbanos - CSUs", label: "Centros Sociais Urbanos - CSUs" },
      { key: "Proteção Social Básica - Centros de Convivência", label: "Centros de Convivência" },
    ];
    
    let totalProtecaoSocial = 0;
    const protecaoSocialOptions = protecaoSocialKeys
      .map(({ key, label, binary }) => {
        const keyFound = findKey(key);
        if (!keyFound) return null; // Se não encontrar a chave, ignora
    
        let value = data.reduce((sum, row) => {
          const fieldValue = row[keyFound]?.toString().trim().toLowerCase();
          return sum + (binary ? (fieldValue?.toLowerCase() === "sim" ? 1 : 0) : parseInt(fieldValue?.toString().replace(/\./g, "")) || 0);
        }, 0);
    
        if (value > 0) {
          totalProtecaoSocial += value;
          return { id: key, label, value };
        }
    
        return null; // Remove entradas com valor 0
      })
      .filter((item): item is { id: string; label: string; value: number } => item !== null); // Remove os `null` do array
    

    const protecaoSocialEspecialKeys = [
        { key: "Proteção Social Especial - Unidade de CREAS", label: "Unidade de CREAS" },
        { key: "Proteção Social Especial - Unidade de Centro Pop", label: "Unidade de Centro Pop" },
        { key: "Proteção Social Especial - Unidade de Centro Dia", label: "Unidade de Centro Dia" },
        { key: "Proteção Social Especial - Unidades de Acolhimento (Estadual)", label: "Unidades de Acolhimento (Estadual)", binary: true },
        { key: "Proteção Social Especial - Unidades de Acolhimento (Municipal)", label: "Unidades de Acolhimento (Municipal)" },
        { key: "Proteção Social Especial - Municípios com Serviço de Família Acolhedora", label: "Municípios com Serviço de Família Acolhedora" },
        { key: "Proteção Social Especial - Projeto Acolher (municípios)", label: "Projeto Acolher (municípios)", binary: true },
    ];

    let totalProtecaoSocialEspecial = 0;
    const protecaoSocialEspecialOptions = protecaoSocialEspecialKeys
      .map(({ key, label, binary }) => {
        const keyFound = findKey(key);
         if (!keyFound) return null; 

        let value = data.reduce((sum, row) => {
          const fieldValue = row[keyFound];
           return sum + (binary ? (fieldValue?.toLowerCase() === "sim" ? 1 : 0) : parseInt(fieldValue?.toString().replace(/\./g, "")) || 0);
        }, 0);

        if (value > 0) {
          return { id: key, label, value };
        }

        return null; 
      })
      .filter((item): item is { id: string; label: string; value: number } => item !== null);

    totalProtecaoSocialEspecial = protecaoSocialEspecialOptions.reduce((sum, option) => sum + option.value, 0);
    

    const segurancaAlimentarKeys = [
      { key: 'Segurança Alimentar - Programa "Tá na mesa" (municípios)', label: 'Programa Tá na Mesa', binary: true },
      { key: "Segurança Alimentar - Cartão Alimentação (municípios)", label: "Cartão Alimentação", binary: true },
      { key: "Segurança Alimentar - Restaurante Popular (municípios)", label: "Restaurante Popular"},
      { key: "Segurança Alimentar - PAA LEITE (municípios)", label: "PAA LEITE", binary: true },
      { key: "Segurança Alimentar - PAA CDS (municípios)", label: "PAA CDS", binary: true },
    ];
    
    let totalSegurancaAlimentar = 0;
    const segurancaAlimentarOptions: { id: string; label: string; value: number }[] = segurancaAlimentarKeys
      .map(({ key, label, binary }) => {
        const keyFound = findKey(key);
        if (!keyFound) return null; // Se a coluna não existir, ignora
    
        let value = data.reduce((sum, row) => {
          const fieldValue = row[keyFound]?.toString().trim().toLowerCase();
          return sum + (binary ? (fieldValue === "sim" ? 1 : 0) : parseInt(fieldValue.replace(/\./g, "")) || 0);
        }, 0);
    
        if (value > 0) { // 🔹 Só adiciona a opção se tiver dados!
          totalSegurancaAlimentar += value;
          return { id: key, label, value };
        }
        
        return null; // 🔹 Remove opções sem dados
      })
      .filter((item): item is { id: string; label: string; value: number } => item !== null);
    
    // 🔹 Função para converter valores monetários corretamente
    const parseCurrency = (value: string | undefined): number => {
      if (!value) return 0;
      return parseFloat(value.replace("R$", "").trim().replace(/\./g, "").replace(",", "."));
    };
    
    // 🔹 Renderiza o modal SOMENTE SE houver dados disponíveis
    const segurancaAlimentarModalContent = totalSegurancaAlimentar > 0 && (
      <>
        <p>
          <strong>Programa "Tá na Mesa" - Refeições por dia:</strong>{" "}
          {findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Quant de refeição/dia")
            ? data.reduce((sum, row) => sum + (parseInt(row[findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Quant de refeição/dia")]?.toString().replace(/\./g, "")) || 0), 0).toLocaleString("pt-BR")
            : "N/A"}
        </p>
        <p>
          <strong>Programa "Tá na Mesa" - Refeições por mês:</strong>{" "}
          {findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Quant de refeição/mês")
            ? data.reduce((sum, row) => sum + (parseInt(row[findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Quant de refeição/mês")]?.toString().replace(/\./g, "")) || 0), 0).toLocaleString("pt-BR")
            : "N/A"}
        </p>
        <p>
          <strong>Programa "Tá na Mesa" - Valor mensal:</strong>{" "}
          {findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Valor por município mensal")
            ? data.reduce((sum, row) => sum + parseCurrency(row[findKey("Segurança Alimentar - Programa \"Tá na mesa\" - Valor por município mensal")]), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : "N/A"}
        </p>
        <p>
          <strong>Cartão Alimentação - Beneficiários:</strong>{" "}
          {findKey("Segurança Alimentar - Cartão Alimentação (beneficiários)")
            ? data.reduce((sum, row) => sum + (parseInt(row[findKey("Segurança Alimentar - Cartão Alimentação (beneficiários)")]?.toString().replace(/\./g, "")) || 0), 0).toLocaleString("pt-BR")
            : "N/A"}
        </p>
        <p>
          <strong>Cartão Alimentação - Valor por município:</strong>{" "}
          {findKey("Segurança Alimentar - Cartão Alimentação - valor por município")
            ? data.reduce((sum, row) => sum + parseCurrency(row[findKey("Segurança Alimentar - Cartão Alimentação - valor por município")]), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : "N/A"}
        </p>
      </>
    );
    

      const saudeKeys = [
        { key: "Saúde - Vacinas (doses aplicadas)", label: "Saúde - Vacinas" },
        { key: "Saúde - Hospital Geral", label: "Saúde - Hospital Geral" },
        { key: "Saúde - Posto de Saúde", label: "Saúde - Posto de Saúde" },
        { key: "Saúde - Centro de Saúde/Unidade Básica de Saúde", label: "Centro de Saúde/UBS" },
      ];
      
      let totalSaude = 0;
      const saudeOptions: { id: string; label: string; value: number }[] = saudeKeys
        .map(({ key, label }) => {
          const keyFound = findKey(key);
          if (!keyFound) return null;
      
          let value = data.reduce((sum, row) => {
            const fieldValue = row[keyFound]?.toString().trim();
            return sum + (fieldValue ? parseInt(fieldValue.replace(/\./g, "")) || 0 : 0);
          }, 0);
      
          totalSaude += value;
          return { id: key, label, value };
        })
        .filter((item): item is { id: string; label: string; value: number } => item !== null);
      
      // Cálculo das médias para o Índice de Gini e Mortalidade Infantil
      const giniKey = findKey("Saúde - Índice de Gini (IBGE, 2010)");
      const mortalidadeKey = findKey("Saúde - Mortalidade infantil - óbitos por mil nascidos vivos (IBGE, 2022)");
      
      const totalMunicipiosGini = giniKey ? data.filter(row => row[giniKey]).length : 0;
      const totalMunicipiosMortalidade = mortalidadeKey ? data.filter(row => row[mortalidadeKey]).length : 0;
      
      const mediaGini =
        giniKey && totalMunicipiosGini > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[giniKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosGini
            ).toFixed(3).replace(".", ",")
          : "N/A";
      
      const mediaMortalidade =
        mortalidadeKey && totalMunicipiosMortalidade > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[mortalidadeKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosMortalidade
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      const saudeModalContent = (
        <>
          <p>
            <strong>Saúde - Mortalidade infantil (óbitos por mil nascidos vivos - IBGE 2022):</strong> {mediaMortalidade}
          </p>
          <p>
            <strong>Saúde - Índice de Gini (IBGE, 2010):</strong> {mediaGini}
          </p>
        </>
      );

      const educacaoKeys = [
        { key: "Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)", label: "Taxa de Alfabetização" },
        { key: "Educação - Taxa de Escolarização 6 a 14 anos - % (2010)", label: "Taxa de Escolarização 6 a 14 anos" },
      ];
      
      // Cálculo da média das taxas
      const taxaAlfabetizacaoKey = findKey("Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)");
      const taxaEscolarizacaoKey = findKey("Educação - Taxa de Escolarização 6 a 14 anos - % (2010)");
      
      const totalMunicipiosAlfabetizacao = taxaAlfabetizacaoKey ? data.filter(row => row[taxaAlfabetizacaoKey]).length : 0;
      const totalMunicipiosEscolarizacao = taxaEscolarizacaoKey ? data.filter(row => row[taxaEscolarizacaoKey]).length : 0;
      
      const mediaTaxaAlfabetizacao =
        taxaAlfabetizacaoKey && totalMunicipiosAlfabetizacao > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[taxaAlfabetizacaoKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosAlfabetizacao
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      const mediaTaxaEscolarizacao =
        taxaEscolarizacaoKey && totalMunicipiosEscolarizacao > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[taxaEscolarizacaoKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosEscolarizacao
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      // Cálculo das médias para os valores do IDEB
      const idebInicialKey = findKey("Educação - IDEB Anos iniciais do ensino fundamental (2023)");
      const idebFinalKey = findKey("Educação - IDEB Anos finais do ensino fundamental (2023)");
      const idebMedioKey = findKey("Educação - IDEB Ensino Médio (2023)");
      
      const totalMunicipiosIDEBInicial = idebInicialKey ? data.filter(row => row[idebInicialKey]).length : 0;
      const totalMunicipiosIDEBFinal = idebFinalKey ? data.filter(row => row[idebFinalKey]).length : 0;
      const totalMunicipiosIDEBMedio = idebMedioKey ? data.filter(row => row[idebMedioKey]).length : 0;
      
      const mediaIDEBInicial =
        idebInicialKey && totalMunicipiosIDEBInicial > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[idebInicialKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosIDEBInicial
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      const mediaIDEBFinal =
        idebFinalKey && totalMunicipiosIDEBFinal > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[idebFinalKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosIDEBFinal
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      const mediaIDEBMedio =
        idebMedioKey && totalMunicipiosIDEBMedio > 0
          ? (
              data.reduce((sum, row) => sum + (parseFloat(row[idebMedioKey]?.toString().replace(",", ".")) || 0), 0) /
              totalMunicipiosIDEBMedio
            ).toFixed(2).replace(".", ",")
          : "N/A";
      
      const educacaoModalContent = (
        <>
          <p>
            <strong>Educação - IDEB Anos iniciais do ensino fundamental (2023):</strong> {mediaIDEBInicial}
          </p>
          <p>
            <strong>Educação - IDEB Anos finais do ensino fundamental (2023):</strong> {mediaIDEBFinal}
          </p>
          <p>
            <strong>Educação - IDEB Ensino Médio (2023):</strong> {mediaIDEBMedio}
          </p>
        </>
      );

      const casaCidadaniaKey = findKey("Quantidade de Casa da Cidadania");

      const totalCasaCidadania = casaCidadaniaKey
        ? data.reduce((sum, row) => sum + (parseInt(row[casaCidadaniaKey]?.toString().replace(/\./g, "")) || 0), 0)
        : 0;

        const renderListaCidadesModal = (dados: {cidade: string, quantidade: number}[]) => (
          <div>
            <h3 className="font-bold mb-4">Cidades com Casa da Cidadania ({dados.length})</h3>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {dados.map((item, index) => (
                <div key={index} className="p-2 border-b">
                  <div>{item.cidade}</div>
                  {item.quantidade > 1 && (
                    <div className="text-xs text-gray-500">  
                      {item.quantidade} unidades
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
    setIndicators([
      {
        value: totalMunicipios,
        label: "Total de Municípios",
        modalContent: renderListaMunicipiosModal(
          data
            .filter(row => row[municipioKey])
            .map(row => row[municipioKey] || "")
            .filter(Boolean), // Remove valores vazios
          totalMunicipios
        )
      },
      { value: parseFloat(mediaIDH.toFixed(3)), label: "Média do IDH (2010)" },
      {
        value: totalMunicipiosSemiarido,
        label: "Municípios do Semiárido",
        modalContent: renderMunicipiosModal(
          data
            .filter(row => row[semiaridoKey]?.trim().toLowerCase() === "x")
            .map(row => row[municipioKey] || "")
            .filter(Boolean)
        )
      },
      {
        value: totalCasaCidadania,
        label: "Quantidade de Casa da Cidadania",
        modalContent: renderListaCidadesModal(
          data
            .filter(row => {
              const qtd = parseInt(row[casaCidadaniaKey]?.toString() || "0");
              return qtd > 0;
            })
            .map(row => ({
              cidade: row[municipioKey] || "",
              quantidade: parseInt(row[casaCidadaniaKey]?.toString() || "0")
            }))
            .filter(item => item.cidade) 
        )
      },
      {
        value: totalPopulacao,
        label: "População Total (CENSO 2022)",
        modalContent: popModalContent,
      },
      {
        value: totalFamiliasCadUnico,
        label: "Total de Famílias no Cadastro Único",
        modalContent: cadUnicoModalContent,
      },
      {
        value: totalPessoasCadUnico,
        label: "Total de Pessoas no Cadastro Único",
        modalContent: cadUnicoPessoasModalContent,
      },
      {
        value: totalPessoasInstrucao,
        label: "Pessoas por Grau de Instrução",
        modalContent: instrucaoModalContent,
      },
      {
        value: totalTrabalho,
        label: "Pessoas por Tipo de Trabalho",
        modalContent: trabalhoModalContent,
      },
      {
        value: totalBolsaFamilia,
        label: "Famílias no Programa Bolsa Família",
        modalContent: bolsaFamiliaModalContent,
      },
      {
        value: totalBolsaFamiliaPessoas,
        label: "Pessoas no Programa Bolsa Família",
        modalContent: bolsaFamiliaPessoasModalContent,
      },
      {
        value: totalProtecaoSocial,
        label: "Proteção Social Básica",
        selectOptions: protecaoSocialOptions,
      },
      {
        value: totalProtecaoSocialEspecial,
        label: "Proteção Social Especial",
        selectOptions: protecaoSocialEspecialOptions,
      },
      {
        value: totalSegurancaAlimentar,
        label: "Segurança Alimentar",
        selectOptions: segurancaAlimentarOptions,
        modalContent: segurancaAlimentarModalContent,
      },
      {
        value: totalSaude,
        label: "Saúde",
        selectOptions: saudeOptions,
        modalContent: saudeModalContent,
      },
      {
        value: 0, // Não exibe um valor único, pois são médias
        label: "Educação",
        selectOptions: [
          { id: "taxa_alfabetizacao", label: "Taxa de Alfabetização", value: parseFloat(mediaTaxaAlfabetizacao.replace(",", ".")) || 0 },
          { id: "taxa_escolarizacao", label: "Taxa de Escolarização 6 a 14 anos", value: parseFloat(mediaTaxaEscolarizacao.replace(",", ".")) || 0 },
        ],
        modalContent: educacaoModalContent,
      },
    ]);
  }, [data]);

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold">Indicadores</h2>
      <p>Visualização detalhada dos principais indicadores.</p>
      <p></p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((item, index) => (
          <Card
            key={index}
            value={item.value}
            label={item.label}
            modalContent={item.modalContent}
            selectOptions={item.selectOptions} 
            setIsModalOpen={setIsModalOpen}
          />
        ))}
      </div>
      <p></p>
    </div>
  );
}
