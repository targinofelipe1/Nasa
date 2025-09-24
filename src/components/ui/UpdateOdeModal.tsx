"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, SquarePen, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// 🔹 SETORES
const setores = [
  "Proteção Social Básica",
  "Proteção Social Especial de Média Complexidade",
  "Proteção Social Especial de Alta Complexidade",
  "Diretoria do SUAS",
  "Segurança Alimentar",
  "Engenharia",
  "FUNCEP",
  "Casa da Cidadania",
  "SINE",
  "Cadastro Único e Bolsa Família",
  "Vigilância Socioassistencial",
];

// 🔹 REGIÕES E MUNICÍPIOS
const regioes: Record<string, string[]> = {
  "1ª": ["ALHANDRA","BAYEUX","CAAPORÃ","CABEDELO","CONDE","CRUZ DO ESPÍRITO SANTO","LUCENA","MARI","PITIMBU","RIACHÃO DO POÇO","SANTA RITA","SAPÉ","SOBRADO","JOÃO PESSOA"],
  "2ª": ["ALAGOINHA","ARAÇAGI","ARARUNA","BANANEIRAS","BELÉM","BORBOREMA","CACIMBA DE DENTRO","CAIÇARA","CASSERENGUE","CUITEGI","DONA INÊS","DUAS ESTRADAS","GUARABIRA","LOGRADOURO","MULUNGU","PILÕES","PILÕEZINHOS","PIRPIRITUBA","RIACHÃO","SERRA DA RAIZ","SERRARIA","SERTÃOZINHO","SOLÂNEA","TACIMA"],
  "3ª": ["ALAGOA GRANDE","ALAGOA NOVA","ALCANTIL","ALGODÃO DE JANDAÍRA","ARARA","AREIA","AREIAL","AROEIRAS","ASSUNÇÃO","BARRA DE SANTANA","BARRA DE SÃO MIGUEL","BOA VISTA","BOQUEIRÃO","CATURITÉ","CABACEIRAS","ESPERANÇA","FAGUNDES","GADO BRAVO","JUAZEIRINHO","LAGOA SECA","LIVRAMENTO","MASSARANDUBA","MATINHAS","MONTADAS","NATUBA","OLIVEDOS","POCINHOS","PUXINANÃ","QUEIMADAS","REMÍGIO","RIACHO DE SANTO ANTÔNIO","SANTA CECÍLIA","SÃO DOMINGOS DO CARIRI","SÃO SEBASTIÃO DE LAGOA DE ROÇA","SOLEDADE","TAPEROÁ","TENÓRIO","UMBUZEIRO","CAMPINA GRANDE"],
  "4ª": ["BARAÚNA","BARRA DE SANTA ROSA","CUBATI","CUITÉ","DAMIÃO","FREI MARTINHO","NOVA FLORESTA","NOVA PALMEIRA","PEDRA LAVRADA","PICUÍ","SÃO VICENTE DO SERIDÓ","SOSSÊGO"],
  "5ª": ["AMPARO","CAMALAÚ","CARAÚBAS","CONGO","COXIXOLA","GURJÃO","MONTEIRO","OURO VELHO","PARARI","PRATA","SANTO ANDRÉ","SÃO JOÃO DO CARIRI","SÃO JOÃO DO TIGRE","SÃO JOSÉ DOS CORDEIROS","SÃO SEBASTIÃO DO UMBUZEIRO","SERRA BRANCA","SUMÉ","ZABELÊ"],
  "6ª": ["AREIA DE BARAÚNAS","CACIMBA DE AREIA","CACIMBAS","CATINGUEIRA","DESTERRO","EMAS","JUNCO DO SERIDÓ","MÃE D'ÁGUA","MALTA","MATURÉIA","PASSAGEM","PATOS","QUIXABA","SALGADINHO","SANTA LUZIA","SANTA TERESINHA","SÃO JOSÉ DE ESPINHARAS","SÃO JOSÉ DO BONFIM","SÃO JOSÉ DO SABUGI","SÃO MAMEDE","TEIXEIRA","VÁRZEA"],
  "7ª": ["AGUIAR","BOA VENTURA","CONCEIÇÃO","COREMAS","CURRAL VELHO","DIAMANTE","IBIARA","IGARACY","ITAPORANGA","NOVA OLINDA","OLHO D'ÁGUA","PEDRA BRANCA","PIANCÓ","SANTA INÊS","SANTANA DE MANGUEIRA","SERRA GRANDE","SANTANA DOS GARROTES","SÃO JOSÉ DE CAIANA"],
  "8ª": ["BELÉM DO BREJO DO CRUZ","BOM SUCESSO","BREJO DO CRUZ","BREJO DOS SANTOS","CATOLÉ DO ROCHA","JERICÓ","MATO GROSSO","RIACHO DOS CAVALOS","SÃO BENTO","SÃO JOSÉ DO BREJO DO CRUZ"],
  "9ª": ["BERNARDINO BATISTA","BONITO DE SANTA FÉ","BOM JESUS","CACHOEIRA DOS ÍNDIOS","CAJAZEIRAS","CARRAPATEIRA","JOCA CLAUDINO","MONTE HOREBE","POÇO DANTAS","POÇO DE JOSÉ DE MOURA","SANTA HELENA","SÃO JOÃO DO RIO DO PEIXE","SÃO JOSÉ DE PIRANHAS","TRIUNFO","UIRAÚNA"],
  "10ª": ["LASTRO","MARIZÓPOLIS","NAZAREZINHO","SANTA CRUZ","SÃO FRANCISCO","SÃO JOSÉ DA LAGOA TAPADA","SOUSA","VIEIRÓPOLIS"],
  "11ª": ["ÁGUA BRANCA","IMACULADA","JURU","MANAÍRA","PRINCESA ISABEL","SÃO JOSÉ DE PRINCESA","TAVARES"],
  "12ª": ["CALDAS BRANDÃO","GURINHÉM","INGÁ","ITABAIANA","ITATUBA","JUAREZ TÁVORA","JURIPIRANGA","MOGEIRO","PEDRAS DE FOGO","PILAR","RIACHÃO DO BACAMARTE","SALGADO DE SÃO FÉLIX","SÃO JOSÉ DOS RAMOS","SÃO MIGUEL DE TAIPU","SERRA REDONDA"],
  "13ª": ["APARECIDA","CAJAZEIRINHAS","CONDADO","LAGOA","PAULISTA","POMBAL","SÃO BENTINHO","SÃO DOMINGOS","VISTA SERRANA"],
  "14ª": ["BAÍA DA TRAIÇÃO","CAPIM","CUITÉ DE MAMANGUAPE","CURRAL DE CIMA","ITAPOROROCA","JACARAÚ","LAGOA DE DENTRO","MAMANGUAPE","MARCAÇÃO","MATARACA","PEDRO RÉGIS","RIO TINTO"],
};

// 🔹 DESCRIÇÃO
const descricoes = [
  "Programa Estadual de Proteção aos Defensores de Direitos Humanos - PEPDDH",
  "Programa de Proteção à Vítimas e Testemunhas - PROVITA",
  "Programa de Proteção a Crianças e Adolescentes Ameaçadas de Morte - PPCAAM",
  "Abrigamento dos Indígenas Venezuelanos Migrantes Refugiados da etnia Warao",
  "Núcleo Estadual de Enfrentamento ao Tráfico de Pessoas da Paraíba",
  "Projeto Acolher",
  "Capacita SUAS",
  "Abono natalino",
  "Tá na mesa",
  "Restaurante Popular",
  "Novo Tá na mesa",
  "Cartão Alimentação",
  "PAA - LEITE",
  "PAA - CDS",
  "Cistenas",
  "Paraíba que Acolhe",
  "Cofinanciamento para CRAS, CREAS, UNIDADES DE ACOLHIMENTO, GESTÃO MUNICIPAIS E BENEFICIOS EVENTUAIS",
  "Programa Cidade Madura",
  "Outro",
];

// 🔹 PROGRAMAS
const programas = [
  "5008 - Assistência Social, Direitos Humanos e Proteção Social",
  "5009 - Assistência Social, Direitos Humanos e Proteção Social",
  "(Novo PAC) 960186",
  "Trabalhadores(as)",
  "5008 - Assistência Social - Direitos Humanos e Proteção Social",
  "5008 - Assistência Social - Direitos",
  "500 - Segurança Alimentar - Direitos",
  "PAA ALIMENTOS",
];

// 🔹 AÇÕES
const acoes = [
  "BENEFICIÁRIOS",
  "TRANSFERÊNCIA DE RENDA",
  "REFEIÇÕES DIÁRIAS",
  "CISTERNAS",
  "BENEFICIÁRIOS – PESSOA IDOSA",
  "SERVIÇO DE ACOLHIMENTO CRIANÇA E ADOLESCENTE",
  "SERVIÇO DE ACOLHIMENTO FAMÍLIAS E ADULTOS",
  "BENEFICIÁRIOS – (ÓRFÃOS DECORRENTE DA COVID-19)",
  "DOCUMENTAÇÃO BÁSICA",
];

// 🔹 STATUS
const statusOptions = [
  "Contínuo",
  "Ações e/ou obras a iniciar, em licitação ou a licitar",
  "A iniciar",
  "Ações e/ou obras concluídas",
  "Concluído",
  "Em andamento",
  "A inaugurar (2025)/Lançar",
  "Paralisado",
];

interface TableData {
  [key: string]: any;
}

interface UpdateOdeModalProps {
  rowData: TableData;
  rowIndex: number;
  onUpdate: () => void;
  onClose: () => void;
  activeTab: string;
  tabGroups: { [key: string]: string[] };
}

export default function UpdateOdeModal({
  rowData,
  rowIndex,
  onUpdate,
  onClose,
  activeTab,
  tabGroups,
}: UpdateOdeModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<TableData>(rowData);

  // Campos editáveis
  const editableKeys = useMemo(() => {
    const currentTabKeys = tabGroups[activeTab] || [];
    return currentTabKeys.filter(
      (key) => key !== "CÓDIGO IBGE" && key !== "Município" && key !== "NOME"
    );
  }, [activeTab, tabGroups]);

  const handleUpdate = async (shouldClose: boolean) => {
    setLoading(true);

    try {
      const updates = editableKeys.map((key) => ({
        key,
        row: rowData.__rowNumber || rowIndex + 2,
        originalValue: rowData[key],
        value: values[key],
      }));

      const payload = {
        updates,
        programa: "ode",
        userId,
        municipio: rowData["Município"],
      };

      const response = await fetch(`/api/ode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Dados atualizados com sucesso!");
      onUpdate();
      if (shouldClose) onClose();
    } catch (error: any) {
      console.error("❌ Erro ao atualizar:", error);
      toast.error(error.message || "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  if (editableKeys.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Não há campos editáveis nesta aba.</p>
        <Button onClick={onClose} className="mt-4">
          Fechar
        </Button>
      </div>
    );
  }

  const currentKey = editableKeys[currentStep];

  // 🔹 Mapa de campos → opções
  const fieldOptions: Record<string, string[]> = {
    "Setor de Trabalho": setores,
    Região: Object.keys(regioes),
    Município: values["Região"] ? regioes[values["Região"]] || [] : [],
    Descrição: descricoes,
    "Programa/Projeto/Entidade": programas,
    Ação: acoes,
    Status: statusOptions,
    Obra: ["Sim", "Não"],
    Serviço: ["Sim", "Não"],
  };

  const options = fieldOptions[currentKey] || null;

  return (
    <>
      <DialogHeader className="p-4 border-b">
        <DialogTitle>Atualizar Dados do Município</DialogTitle>
        <DialogDescription>
          Município: <strong>{rowData["Município"]}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium">{currentKey}</label>
          {options ? (
            <select
              value={values[currentKey] || ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [currentKey]: e.target.value }))
              }
              disabled={loading}
              className="mt-2 w-full border rounded-md p-2 text-sm"
            >
              <option value="">Selecione...</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type="text"
              value={values[currentKey] || ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [currentKey]: e.target.value }))
              }
              disabled={loading}
              className="mt-2"
            />
          )}
        </div>
      </div>

      <div className="flex justify-between p-4 border-t gap-2 items-center">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <div className="flex space-x-2">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          )}

          <Button onClick={() => handleUpdate(true)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <SquarePen className="mr-2 h-4 w-4" /> Salvar
              </>
            )}
          </Button>

          {currentStep < editableKeys.length - 1 && (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={loading}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
