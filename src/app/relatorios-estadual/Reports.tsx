// src/app/relatorio-estadual/Reports.tsx

"use client";

import React from "react";
// Removido import de jsPDF e autoTable, pois não são usados aqui
import styles from "./style.module.css";
// Removido import de BotaoImpressao, pois não é usado aqui

const Reports = ({
  data,
  selectedRegionals = [],
  selectedMunicipalities = [],
}: {
  data: any[];
  selectedRegionals?: string[];
  selectedMunicipalities?: string[];
}) => {
  const findKey = (columnName: string) => {
    if (!data || data.length === 0 || !data[0]) return "";
    return Object.keys(data[0]).find(
      (key) => key.replace(/\s+/g, " ").trim().toLowerCase() === columnName.replace(/\s+/g, " ").trim().toLowerCase()
    ) || "";
  };

  const parseNumber = (value: any): number => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    return parseFloat(value.toString().replace(/\./g, "").replace(",", ".").trim()) || 0;
  };
  
  // Os dados de entrada já vêm filtrados do componente pai.
  const usedData = data;

  const total2010Key = findKey("População - CENSO - IBGE/2010 - Total 2010");
  const urbana2010Key = findKey("População - CENSO - IBGE/2010 - Urbana");
  const rural2010Key = findKey("População - CENSO - IBGE/2010 - Rural");

  const total2022Key = findKey("População  CENSO - IBGE/2022 - Total 2022");
  const urbana2022PercentKey = findKey("População  CENSO - IBGE/2022 - % Urbana  ref 2010");
  const rural2022PercentKey = findKey("População  CENSO - IBGE/2022 - % Rural  ref 2010");

  const total2010 = usedData.reduce((sum, row) => sum + parseNumber(row[total2010Key]), 0);
  const total2022 = usedData.reduce((sum, row) => sum + parseNumber(row[total2022Key]), 0);

  const urbana2010 = usedData.reduce((sum, row) => sum + parseNumber(row[urbana2010Key]), 0);
  const urbana2022 = total2022 > 0
    ? Math.round(total2022 * (parseNumber(usedData[0][urbana2022PercentKey]) / 100))
    : 0;

  const rural2010 = usedData.reduce((sum, row) => sum + parseNumber(row[rural2010Key]), 0);
  const rural2022 = total2022 > 0
    ? Math.round(total2022 * (parseNumber(usedData[0][rural2022PercentKey]) / 100))
    : 0;

  const calcPercentChange = (oldValue: number, newValue: number) => {
    if (oldValue === 0) return "N/A";
    const percent = ((newValue - oldValue) / oldValue) * 100;

    if (percent === 0) return "0%";
    const sinal = percent > 0 ? "+ " : "- ";
    return `${sinal}${Math.abs(percent).toFixed(3)}%`;
  };

  const pobrezaKey = findKey("CADASTRO ÚNICO - Famílias em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00");
  const baixaRendaKey = findKey("CADASTRO ÚNICO - Famílias em situação de Baixa Renda - Renda per capita (R$) de 218,01 até 1/2 S.M.");
  const acimaMeioSMKey = findKey("CADASTRO ÚNICO - Famílias com Renda mensal acima de Meio Salário Mínimo");
  const totalFamiliasKey = findKey("CADASTRO ÚNICO - Total de Familias CadÚnico");

  const totalPobreza = usedData.reduce((sum, row) => sum + parseNumber(row[pobrezaKey]), 0);
  const totalBaixaRenda = usedData.reduce((sum, row) => sum + parseNumber(row[baixaRendaKey]), 0);
  const totalAcimaMeioSM = usedData.reduce((sum, row) => sum + parseNumber(row[acimaMeioSMKey]), 0);
  const totalFamilias = usedData.reduce((sum, row) => sum + parseNumber(row[totalFamiliasKey]), 0);

  const pobrezaKey1 = findKey("CADASTRO ÚNICO - Pessoas em situação de Pobreza - Renda per capita (R$) de 0,00 a 218,00");
  const totalpessoaKey = findKey("CADASTRO ÚNICO - Total de Pessoas CadÚnico");
  const totalPobreza1 = usedData.reduce((sum, row) => sum + parseNumber(row[pobrezaKey1]), 0);
  const totalpessoas = usedData.reduce((sum, row) => sum + parseNumber(row[totalpessoaKey]), 0);

  const fundamnental = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino fundamental (incompleto/completo)");
  const medio = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino médio (incompleto/completo)");
  const superior = findKey("Grau de Instrução - CADASTRO ÚNICO - Pessoas no CadÚnico com Ensino superior (incompleto ou mais)");
  const totalfundamnetal = usedData.reduce((sum, row) => sum + parseNumber(row[fundamnental]), 0);
  const totalmedio = usedData.reduce((sum, row) => sum + parseNumber(row[medio]), 0);
  const totalsuperior = usedData.reduce((sum, row) => sum + parseNumber(row[superior]), 0);

  const contaPropriaKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador por conta própria");
  const ruralKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural");
  const semCarteiraKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado sem carteira de trabalho assinada");
  const comCarteiraKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregado com carteira de trabalho assinada");
  const domesticoKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador doméstico c/ carteira de trabalho assinada");
  const naoRemuneradoFuncKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador não-remunerado");
  const militarServidorKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Militar ou servidor público");
  const empregadorKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Empregador");
  const estagiarioKey = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Estagiário ou aprendiz");

  const totalContaPropria = usedData.reduce((sum, row) => sum + parseNumber(row[contaPropriaKey]), 0);
  const totalRural = usedData.reduce((sum, row) => sum + parseNumber(row[ruralKey]), 0);
  const totalSemCarteira = usedData.reduce((sum, row) => sum + parseNumber(row[semCarteiraKey]), 0);
  const totalComCarteira = usedData.reduce((sum, row) => sum + parseNumber(row[comCarteiraKey]), 0);
  const totalDomestico = usedData.reduce((sum, row) => sum + parseNumber(row[domesticoKey]), 0);
  const totalNaoRemuneradoFunc = usedData.reduce((sum, row) => sum + parseNumber(row[naoRemuneradoFuncKey]), 0);
  const totalMilitarServidor = usedData.reduce((sum, row) => sum + parseNumber(row[militarServidorKey]), 0);
  const totalEmpregador = usedData.reduce((sum, row) => sum + parseNumber(row[empregadorKey]), 0);
  const totalEstagiario = usedData.reduce((sum, row) => sum + parseNumber(row[estagiarioKey]), 0);

  const totalTrabalho =
    totalContaPropria +
    totalRural +
    totalSemCarteira +
    totalComCarteira +
    totalDomestico +
    totalNaoRemuneradoFunc +
    totalMilitarServidor +
    totalEmpregador +
    totalEstagiario;

  const trabalhomenor14 = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador por conta própria");
  const trabanhomaior14 = findKey("Trabalho - CADASTRO ÚNICO - Pessoas de 14 anos ou mais no Cadúnico por função principal - Trabalhador temporário em área rural");
  const totaltrabalhomenor14 = usedData.reduce((sum, row) => sum + parseNumber(row[trabalhomenor14]), 0);
  const totaltrabanhomaior14 = usedData.reduce((sum, row) => sum + parseNumber(row[trabanhomaior14]), 0);

  const totalTrabalhomenoremaior =
    totaltrabalhomenor14 +
    totaltrabanhomaior14;

  const familiasPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família 06/2024");
  const familiasBaixaRendaPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Renda per capita até R$218,00 06/2024");
  const familiasPobrezaPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de FAMÍLIAS no Programa Bolsa Família - Baixa renda 06/2024");

  const pessoasPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família 06/2024");
  const pessoasBaixaRendaPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Renda per capita até R$218");
  const pessoasPobrezaPBFKey = findKey("PROGRAMA BOLSA FAMÍLIA - Total de PESSOAS no Programa Bolsa Família - Baixa renda 06/2024");

  const totalFamiliasPBF = usedData.reduce((sum, row) => sum + parseNumber(row[familiasPBFKey]), 0);
  const totalFamiliasBaixaRendaPBF = usedData.reduce((sum, row) => sum + parseNumber(row[familiasBaixaRendaPBFKey]), 0);
  const totalFamiliasPobrezaPBF = usedData.reduce((sum, row) => sum + parseNumber(row[familiasPobrezaPBFKey]), 0);

  const totalFamiliaBolsaF =
    totalFamiliasBaixaRendaPBF +
    totalFamiliasPobrezaPBF;

  const totalPessoasPBF = usedData.reduce((sum, row) => sum + parseNumber(row[pessoasPBFKey]), 0);
  const totalPessoasBaixaRendaPBF = usedData.reduce((sum, row) => sum + parseNumber(row[pessoasBaixaRendaPBFKey]), 0);
  const totalPessoasPobrezaPBF = usedData.reduce((sum, row) => sum + parseNumber(row[pessoasPobrezaPBFKey]), 0);

  const totalPessoasBolsaF =
    totalPessoasBaixaRendaPBF +
    totalPessoasPobrezaPBF;

  const isMunicipal = window.location.pathname.includes("relatorio-municipal");

  const crasKey = findKey("Proteção Social Básica - Unidade de CRAS");
  const primeiraInfanciaKey = findKey("Proteção Social Básica - Primeira Infância no SUAS");
  const orfaosKey = findKey("Proteção Social Básica - ÓRFÃOS do Programa Paraíba que Acolhe");
  const acessuasKey = findKey("Proteção Social Básica - Acessuas Trabalho");
  const cidadeMaduraKey = findKey("Proteção Social Básica - Residenciais Cidade Madura");
  const csuKey = findKey("Proteção Social Básica - Centros Sociais Urbanos - CSUs");
  const centrosConvivenciaKey = findKey("Proteção Social Básica - Centros de Convivência");

  const convertSimNao = (value: any) => {
    return value?.toString().trim().toLowerCase() === "sim" ? 1 : 0;
  };

  const totalCras = usedData.reduce((sum, row) => sum + parseNumber(row[crasKey]), 0);
  const totalPrimeiraInfancia = usedData.reduce((sum, row) => sum + convertSimNao(row[primeiraInfanciaKey]), 0);
  const totalOrfaos = usedData.reduce((sum, row) => sum + parseNumber(row[orfaosKey]), 0);
  const totalAcessuas = usedData.reduce((sum, row) => sum + convertSimNao(row[acessuasKey]), 0);
  const totalCidadeMadura = usedData.reduce((sum, row) => sum + parseNumber(row[cidadeMaduraKey]), 0);
  const totalCSU = usedData.reduce((sum, row) => sum + parseNumber(row[csuKey]), 0);
  const totalCentrosConvivencia = usedData.reduce((sum, row) => sum + parseNumber(row[centrosConvivenciaKey]), 0);

  const servicesData = [
    { name: "Unidades de CRAS", value: totalCras },
    { name: "Primeira Infância no SUAS", value: totalPrimeiraInfancia },
    { name: "Órfãos do Programa Paraíba que Acolhe", value: totalOrfaos },
    { name: "Acessuas Trabalho", value: totalAcessuas },
    { name: "Residenciais Cidade Madura", value: totalCidadeMadura },
    { name: "Centros Sociais Urbanos (CSUs)", value: totalCSU },
    { name: "Centros de Convivência", value: totalCentrosConvivencia },
  ];

  const filteredServices = isMunicipal
    ? servicesData.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesData;

  const creasKey = findKey("Proteção Social Especial - Unidade de CREAS");
  const centroPopKey = findKey("Proteção Social Especial - Unidade de Centro Pop");
  const centroDiaKey = findKey("Proteção Social Especial - Unidade de Centro Dia");
  const acolhimentoEstadualKey = findKey("Proteção Social Especial - Unidades de Acolhimento (Estadual )");
  const acolhimentoMunicipalKey = findKey("Proteção Social Especial - Unidades de Acolhimento (Municipal)");
  const familiaAcolhedoraKey = findKey("Proteção Social Especial - Municípios com Serviço de Família Acolhedora");
  const projetoAcolherKey = findKey("Proteção Social Especial - Projeto Acolher (municípios)");

  const totalCREAS = usedData.reduce((sum, row) => sum + parseNumber(row[creasKey]), 0);
  const totalCentroPop = usedData.reduce((sum, row) => sum + parseNumber(row[centroPopKey]), 0);
  const totalCentroDia = usedData.reduce((sum, row) => sum + parseNumber(row[centroDiaKey]), 0);
  const totalAcolhimentoEstadual = usedData.reduce((sum, row) => sum + convertSimNao(row[acolhimentoEstadualKey]), 0);
  const totalAcolhimentoMunicipal = usedData.reduce((sum, row) => sum + parseNumber(row[acolhimentoMunicipalKey]), 0);
  const totalFamiliaAcolhedora = usedData.reduce((sum, row) => sum + parseNumber(row[familiaAcolhedoraKey]), 0);
  const totalProjetoAcolher = usedData.reduce((sum, row) => sum + convertSimNao(row[projetoAcolherKey]), 0);

  const servicesEspecialData = [
    { name: "Unidades de CREAS", value: totalCREAS },
    { name: "Unidade de Centro Pop", value: totalCentroPop },
    { name: "Unidade de Centro Dia", value: totalCentroDia },
    { name: "Unidades de Acolhimento (Estadual)", value: totalAcolhimentoEstadual },
    { name: "Unidades de Acolhimento (Municipal)", value: totalAcolhimentoMunicipal },
    { name: "Municípios com Serviço de Família Acolhedora", value: totalFamiliaAcolhedora },
    { name: "Projeto Acolher (municípios)", value: totalProjetoAcolher },
  ];

  const filteredServicesEspecial = isMunicipal
    ? servicesEspecialData.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesEspecialData;

  const taNaMesaMunicipiosKey = findKey('Segurança Alimentar - Programa "Tá na mesa" (municípios)');
  const taNaMesaRefeicoesDiaKey = findKey('Segurança Alimentar - Programa "Tá na mesa" - Quant de refeição/dia');
  const taNaMesaRefeicoesMesKey = findKey('Segurança Alimentar - Programa "Tá na mesa" - Quant de refeição/mês');
  const taNaMesaValorMunicipalKey = findKey('Segurança Alimentar - Programa "Tá na mesa" - Valor por município mensal');
  const cartaoAlimentacaoBeneficiariosKey = findKey("Segurança Alimentar - Cartão Alimentação (beneficiários)");
  const cartaoAlimentacaoMunicipiosKey = findKey("Segurança Alimentar - Cartão Alimentação (municípios)");
  const cartaoAlimentacaoValorMunicipalKey = findKey("Segurança Alimentar - Cartão Alimentação - valor por município");
  const restaurantePopularKey = findKey("Segurança Alimentar - Restaurante Popular (municípios)");
  const paaLeiteKey = findKey("Segurança Alimentar - PAA LEITE (municípios)");
  const paaCdsKey = findKey("Segurança Alimentar - PAA CDS (municípios)");

  const parseCurrency = (value: any): number => {
    if (!value) return 0;
    return parseFloat(value.toString().replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
  };

  const totalTaNaMesaMunicipios = usedData.reduce((sum, row) => sum + convertSimNao(row[taNaMesaMunicipiosKey]), 0);
  const totalTaNaMesaRefeicoesDia = usedData.reduce((sum, row) => sum + parseNumber(row[taNaMesaRefeicoesDiaKey]), 0);
  const totalTaNaMesaRefeicoesMes = usedData.reduce((sum, row) => sum + parseNumber(row[taNaMesaRefeicoesMesKey]), 0);
  const totalTaNaMesaValorMunicipal = usedData.reduce((sum, row) => sum + parseCurrency(row[taNaMesaValorMunicipalKey]), 0);

  const totalCartaoAlimentacaoBeneficiarios = usedData.reduce((sum, row) => sum + parseNumber(row[cartaoAlimentacaoBeneficiariosKey]), 0);
  const totalCartaoAlimentacaoMunicipios = usedData.reduce((sum, row) => sum + convertSimNao(row[cartaoAlimentacaoMunicipiosKey]), 0);
  const totalCartaoAlimentacaoValorMunicipal = usedData.reduce((sum, row) => sum + parseCurrency(row[cartaoAlimentacaoValorMunicipalKey]), 0);

  const totalRestaurantePopular = usedData.reduce((sum, row) => sum + parseNumber(row[restaurantePopularKey]), 0);
  const totalPaaLeite = usedData.reduce((sum, row) => sum + convertSimNao(row[paaLeiteKey]), 0);
  const totalPaaCds = usedData.reduce((sum, row) => sum + convertSimNao(row[paaCdsKey]), 0);

  const servicesTaNaMesa = [
    { name: "Municípios atendidos", value: totalTaNaMesaMunicipios },
    { name: "Refeições por dia", value: totalTaNaMesaRefeicoesDia },
    { name: "Refeições por mês", value: totalTaNaMesaRefeicoesMes },
    { name: "Valor por município mensal", value: totalTaNaMesaValorMunicipal },
  ];

  const servicesCartaoAlimentacao = [
    { name: "Beneficiários", value: totalCartaoAlimentacaoBeneficiarios },
    { name: "Municípios atendidos", value: totalCartaoAlimentacaoMunicipios },
    { name: "Valor por município", value: totalCartaoAlimentacaoValorMunicipal },
  ];

  const servicesOutrosProgramas = [
    { name: "Restaurantes Populares (municípios)", value: totalRestaurantePopular },
    { name: "PAA LEITE (municípios)", value: totalPaaLeite },
    { name: "PAA CDS (municípios)", value: totalPaaCds },
  ];

  const filteredServicesTaNaMesa = isMunicipal
    ? servicesTaNaMesa.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesTaNaMesa;

  const filteredServicesCartaoAlimentacao = isMunicipal
    ? servicesCartaoAlimentacao.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesCartaoAlimentacao;

  const filteredServicesOutrosProgramas = isMunicipal
    ? servicesOutrosProgramas.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesOutrosProgramas;

  const casacidadania = findKey('Quantidade de Casa da Cidadania');
  const totalcasacidadania = usedData.reduce((sum, row) => sum + parseNumber(row[casacidadania]), 0);

  const servicesCasaCidadania = [
    { name: "Casas da Cidadania", value: totalcasacidadania },
  ];

  const filteredServicesCasaCidadania = isMunicipal
    ? servicesCasaCidadania.filter((service) => service.value !== 0 && service.value !== "" && service.value?.toString().trim().toLowerCase() !== "não")
    : servicesCasaCidadania;

  const abonofamilia = findKey('Abono Natalino (quantidade de famílias atendidas - Dez/2023)');
  const totalabonofamilia = usedData.reduce((sum, row) => sum + parseNumber(row[abonofamilia]), 0);
  const abononatalinovalor = findKey('Abono Natalino (valores - previsão 2024 - Fonte: Folha de Pagamentos do Programa Bolsa Família,mar/2024)');
  const totalabononatalinovalor = usedData.reduce((sum, row) => sum + parseCurrency(row[abononatalinovalor]), 0);

  const saudevacinas = findKey('Saúde - Vacinas (doses aplicadas)');
  const totalsaudevacinas = usedData.reduce((sum, row) => sum + parseNumber(row[saudevacinas]), 0);

  const saudevacinaspercent = findKey('Saúde - Vacinas (% média da cobertura)');
  const totalVacinasPercent = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseCurrency(row[saudevacinaspercent]), 0) / usedData.length
    : 0;

  const saudeHospitalGeral = findKey('Saúde - Hospital Geral');
  const saudeCentroSaude = findKey('Saúde - Centro de Saúde/Unidade Básica de Saúde');
  const saudePostoSaude = findKey('Saúde - Posto de Saúde');

  const totalHospitalGeral = usedData.reduce((sum, row) => sum + parseNumber(row[saudeHospitalGeral] || 0), 0);
  const totalCentroSaude = usedData.reduce((sum, row) => sum + parseNumber(row[saudeCentroSaude] || 0), 0);
  const totalPostoSaude = usedData.reduce((sum, row) => sum + parseNumber(row[saudePostoSaude] || 0), 0);

  const saudeMortalidadeInfantil = findKey('Saúde - Mortalidade infantil - óbitos por mil nascidos vivos (IBGE, 2022)');
  const mediaMortalidadeInfantil = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[saudeMortalidadeInfantil] || 0), 0) / usedData.length
    : 0;

  const educacaoTaxaEscolarizacao = findKey('Educação - Taxa de Escolarização 6 a 14 anos - % (2010)');

  const mediaEscolarizacaoPercent = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[educacaoTaxaEscolarizacao] || 0), 0) / usedData.length
    : 0;

  const totalEscolarizados2010 = total2010 > 0
    ? Math.round(total2010 * (mediaEscolarizacaoPercent / 100))
    : 0;

  const educacaoTaxaAlfabetizacao = findKey('Educação - Taxa de alfabetização das pessoas de 15 anos ou mais de idade % (IBGE, 2022)');

  const mediaAlfabetizacaoPercent = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[educacaoTaxaAlfabetizacao] || 0), 0) / usedData.length
    : 0;

  const totalAlfabetizados2022 = total2022 > 0
    ? Math.round(total2022 * (mediaAlfabetizacaoPercent / 100))
    : 0;

  const calcPercent = (value: number, total: number) => {
    if (total === 0) return "0.00%";
    return `${((value / total) * 100).toFixed(2)}%`;
  };

  const idebAnosIniciais = findKey('Educação - IDEB Anos iniciais do ensino fundamental (2023)');
  const idebAnosFinais = findKey('Educação - IDEB Anos finais do ensino fundamental (2023)');
  const idebEnsinoMedio = findKey('Educação - IDEB Ensino Médio (2023)');
  const indiceGini = findKey('Saúde - Índice de Gini (IBGE, 2010)');
  const idhMunicipal = findKey('IDH_M (IBGE, 2010)');

  const mediaIdebIniciais = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[idebAnosIniciais] || 0), 0) / usedData.length
    : 0;

  const mediaIdebFinais = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[idebAnosFinais] || 0), 0) / usedData.length
    : 0;

  const mediaIdebEnsinoMedio = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[idebEnsinoMedio] || 0), 0) / usedData.length
    : 0;

  const mediaIndiceGini = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[indiceGini] || 0), 0) / usedData.length
    : 0;

  const mediaIDH = usedData.length > 0
    ? usedData.reduce((sum, row) => sum + parseNumber(row[idhMunicipal] || 0), 0) / usedData.length
    : 0;

  return (
    <>
      <div id="relatorio-content" className="w-full">
        <div id="Indicadores" className="mt-4">
          <h2 className="text-2xl font-semibold mb-6">
            Indicadores Gerais
          </h2>
          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2 text-left">Indicador</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Média</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  IDH Municipal (2010)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaIDH.toFixed(3)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  IDEB - Anos Iniciais (2023)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaIdebIniciais.toFixed(2)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  IDEB - Anos Finais (2023)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaIdebFinais.toFixed(2)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  IDEB - Ensino Médio (2023)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaIdebEnsinoMedio.toFixed(2)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Índice de Gini (2010)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaIndiceGini.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="População" className="mt-4">
          <h2 className="text-2xl font-semibold mb-6">População</h2>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2 text-left">População</th>
                <th className="border border-gray-300 px-4 py-2 text-center">2010</th>
                <th className="border border-gray-300 px-4 py-2 text-center">2022</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Crescimento/Redução</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Total</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{total2010.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{total2022.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {calcPercentChange(total2010, total2022)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Urbana</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{urbana2010.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{urbana2022.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {calcPercentChange(urbana2010, urbana2022)}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Rural</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{rural2010.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{rural2022.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {calcPercentChange(rural2010, rural2022)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Cadastro Único" className="mt-4">
          <h2 className="text-2xl font-semibold mt-6 mb-6">
            Cadastro Único
          </h2>

          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Famílias
          </h3>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Cadastro Único</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Pobreza (R$ 0,00 - R$ 218,00)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalPobreza.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalPobreza / totalFamilias) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Baixa Renda (R$ 218,01 - 1/2 SM)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalBaixaRenda.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalBaixaRenda / totalFamilias) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Acima de 1/2 SM</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalAcimaMeioSM.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalAcimaMeioSM / totalFamilias) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Famílias CadÚnico</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalFamilias.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Pessoas
          </h3>


          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Cadastro Único</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Pobreza (R$ 0,00 - R$ 218,00)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalPobreza1.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalPobreza1 / totalpessoas) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas CadÚnico</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalpessoas.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Grau de Instrução
          </h3>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Cadastro Único</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Ensino fundamental (incompleto/completo)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalfundamnetal.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalfundamnetal / totalpessoas) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Ensino médio (incompleto/completo)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalmedio.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalmedio / totalpessoas) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Ensino superior (incompleto ou mais)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalsuperior.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalsuperior / totalpessoas) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas com Grau de Instrução</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{(totalmedio + totalfundamnetal + totalsuperior).toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Vínculo Trabalhista
          </h3>

          <h4 className="text-md font-medium mb-1 text-gray-600">
            Função
          </h4>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Cadastro Único - Trabalho</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Trabalhador por conta própria</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalContaPropria.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalContaPropria / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Trabalhador temporário rural</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalRural.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalRural / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Empregado sem carteira</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalSemCarteira.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalSemCarteira / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Empregado com carteira</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalComCarteira.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalComCarteira / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Trabalhador doméstico com carteira</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalDomestico.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalDomestico / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Trabalhador não-remunerado</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalNaoRemuneradoFunc.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalNaoRemuneradoFunc / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Militar/Servidor Público</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalMilitarServidor.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalMilitarServidor / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Empregador</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalEmpregador.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalEmpregador / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Estagiário/Aprendiz</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalEstagiario.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalEstagiario / totalTrabalho) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas com Vínculo Trabalhista</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalTrabalho.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>

          <h4 className="text-md font-medium mt-4 mb-1 text-gray-600">
            Idade
          </h4>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Cadastro Único - Idade</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">14 anos ou mais que não exerceram trabalho remunerado nos últimos 12 meses</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totaltrabalhomenor14.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totaltrabalhomenor14 / totalTrabalhomenoremaior) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">14 anos ou mais que exerceram trabalho remunerado nos últimos 12 meses</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totaltrabanhomaior14.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totaltrabanhomaior14 / totalTrabalhomenoremaior) * 100).toFixed(2)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas que execeram e não trabalho remunerado nos últimos 12 meses</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalTrabalhomenoremaior.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Bolsa Família" className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Bolsa Família
          </h3>

          <h4 className="text-md font-medium mb-1 text-gray-600">
            Famílias
          </h4>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Bolsa Família</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Total de Famílias no Programa Bolsa Família</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalFamiliasPBF.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalFamiliasPBF / totalFamiliasPBF) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Famílias com Renda per capita até R$218,00</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalFamiliasBaixaRendaPBF.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalFamiliasBaixaRendaPBF / totalFamiliasPBF) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Famílias de Baixa Renda</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalFamiliasPobrezaPBF.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalFamiliasPobrezaPBF / totalFamiliasPBF) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas no Bolsa Família</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalFamiliaBolsaF.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>

          <h4 className="text-md font-medium mb-1 text-gray-600">
            Pessoas
          </h4>

          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2">Bolsa Família</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center">% do Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Pessoas com Renda per capita até R$218,00</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalPessoasBaixaRendaPBF.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalPessoasBaixaRendaPBF / totalPessoasPBF) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2">Pessoas em Baixa Renda</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalPessoasPobrezaPBF.toLocaleString("pt-BR")}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {((totalPessoasPobrezaPBF / totalPessoasPBF) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">Total de Pessoas no Bolsa Família</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalPessoasBolsaF.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {filteredServices.length > 0 && (
          <div id="Protecão Básica" className="mt-4">
            <h2 className="text-2xl font-semibold mb-6">
              Proteção Social Básica
            </h2>

            <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
              <thead>
                <tr className="bg-gray-200 text-black text-lg">
                  <th className="border border-gray-300 px-4 py-2 text-left">Serviço</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-lg">
                {filteredServices.map((service, index) => (
                  <tr key={index} className="border">
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredServicesEspecial.length > 0 && (
          <div id="Protecão Especial" className="mt-4">
            <h2 className="text-2xl font-semibold mb-6">
              Proteção Social Especial
            </h2>

            <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
              <thead>
                <tr className="bg-gray-200 text-black text-lg">
                  <th className="border border-gray-300 px-4 py-2 text-left">Serviço</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-lg">
                {filteredServicesEspecial.map((service, index) => (
                  <tr key={index} className="border">
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(filteredServicesTaNaMesa.length > 0 ||
          filteredServicesCartaoAlimentacao.length > 0 ||
          filteredServicesOutrosProgramas.length > 0) && (
            <div id="Segurança Alimentar" className="mt-4">
              <h2 className="text-2xl font-semibold mb-6">
                Segurança Alimentar
              </h2>

              {filteredServicesTaNaMesa.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">
                    Programa "Tá na Mesa"
                  </h3>
                  <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
                    <thead>
                      <tr className="bg-gray-200 text-black text-lg">
                        <th className="border border-gray-300 px-4 py-2 text-left">Serviço</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 text-lg">
                      {filteredServicesTaNaMesa.map((service, index) => (
                        <tr key={index} className="border">
                          <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {filteredServicesCartaoAlimentacao.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">
                    Cartão Alimentação
                  </h3>
                  <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
                    <thead>
                      <tr className="bg-gray-200 text-black text-lg">
                        <th className="border border-gray-300 px-4 py-2 text-left">Serviço</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 text-lg">
                      {filteredServicesCartaoAlimentacao.map((service, index) => (
                        <tr key={index} className="border">
                          <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {filteredServicesOutrosProgramas.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">
                    Outros Programas
                  </h3>
                  <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
                    <thead>
                      <tr className="bg-gray-200 text-black text-lg">
                        <th className="border border-gray-300 px-4 py-2 text-left">Serviço</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 text-lg">
                      {filteredServicesOutrosProgramas.map((service, index) => (
                        <tr key={index} className="border">
                          <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

        {filteredServicesCasaCidadania.length > 0 && (
          <div id="Casas da Cidadanias" className="mt-4">
            <h2 className="text-2xl font-semibold mb-6">
              Casa da Cidadania
            </h2>

            <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
              <thead>
                <tr className="bg-gray-200 text-black text-lg">
                  <th className="border border-gray-300 px-4 py-2 text-left">Casas da Cidadania</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-lg">
                {filteredServicesCasaCidadania.map((service, index) => (
                  <tr key={index} className="border">
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">{service.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{service.value.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div id="Abono Natalino" className="mt-4">
          <h2 className="text-2xl font-semibold mb-6">
            Abono Natalino
          </h2>
          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2 text-left">Abono Natalito</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Famílias Atendidas (DEZ/2023)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalabonofamilia.toLocaleString("pt-BR")}</td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Previsão de Valores (2024)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{totalabononatalinovalor.toLocaleString("pt-BR")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Saúde" className="mt-4">
          <h2 className="text-2xl font-semibold mb-6">
            Saúde
          </h2>
          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2 text-left">Saúde</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Doses Aplicadas</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalsaudevacinas.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Cobertura Vacinal</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalVacinasPercent.toLocaleString("pt-BR")} %
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Hospitais Gerais</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalHospitalGeral.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Centros de Saúde / UBS</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalCentroSaude.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Postos de Saúde</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalPostoSaude.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">Mortalidade Infantil (Média por mil nascidos vivos)</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaMortalidadeInfantil.toFixed(2)} %
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="Educacão" className="mt-4">
          <h2 className="text-2xl font-semibold mb-6">
            Educação
          </h2>
          <table className="w-full border-collapse rounded-lg shadow-sm mt-6">
            <thead>
              <tr className="bg-gray-200 text-black text-lg">
                <th className="border border-gray-300 px-4 py-2 text-left">Indicador</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-lg">
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Crianças Escolarizadas (6 a 14 anos) - 2010
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalEscolarizados2010.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Representatividade da População Escolarizada (%)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaEscolarizacaoPercent.toFixed(2)} %
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Pessoas Alfabetizadas (15 anos ou mais) - 2022
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {totalAlfabetizados2022.toLocaleString("pt-BR")}
                </td>
              </tr>
              <tr className="border">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Representatividade da População Alfabetizada (%)
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {mediaAlfabetizacaoPercent.toFixed(2)} %
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
};

export default Reports;