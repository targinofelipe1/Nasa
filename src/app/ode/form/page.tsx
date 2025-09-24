"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { useUser } from "@clerk/nextjs";
import { useRef } from "react";



const screenId = "ode_form";

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

export default function OdeFormPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const [step, setStep] = useState(1);

  const toastShownRef = useRef(false);


  const [formData, setFormData] = useState<any>({
    nome: "",
    setor: "",
    regiao: "",
    municipio: "",
    descricao: "",
    outro: "",
    obra: "",
    servico: "",
    programa: "",
    acao: "",
    qtdBeneficios: "",
    status: "",
    ano: "",
    valor: "",
    fonte: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (!isLoaded || !user) return;

  const verify = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, {
        cache: "no-store",
      });
      const json = await res.json();

      const allowed = Array.isArray(json?.allowedTabs)
        ? json.allowedTabs.includes(screenId)
        : false;


      setHasPermission(allowed);

     if (!allowed && !toastShownRef.current) {
        toastShownRef.current = true; // 🔹 marca que já exibiu
        toast.error("Acesso negado: você não possui permissão!");
        router.push("/");
      }
    } catch (e) {
      console.error("Falha ao verificar permissões:", e);
      toast.error("Erro ao verificar permissões.");
      router.push("/");
    } finally {
      setIsVerifying(false);
    }
  };

  verify();
}, [isLoaded, user, router]);


  useEffect(() => {
    if (isLoaded && user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      setFormData((prev: any) => ({ ...prev, nome: fullName }));
    }
  }, [isLoaded, user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === "regiao") {
      setFormData((prev: any) => ({ ...prev, regiao: value, municipio: "" }));
    }
  };

  // 🔹 Validação por etapa
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.nome.trim() !== "" && formData.setor.trim() !== "";
      case 2:
        return formData.regiao.trim() !== "" && formData.municipio.trim() !== "";
      case 3:
        if (formData.descricao === "Outro") {
          return formData.outro.trim() !== "";
        }
        return formData.descricao.trim() !== "";
      case 4:
        return formData.programa.trim() !== "" && formData.acao.trim() !== "";
      case 5:
        return formData.status.trim() !== "" && formData.ano.trim() !== "";
      default:
        return true;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId: user?.id }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Registro adicionado com sucesso!");
        router.push("/ode/lista");
      } else {
        toast.error(result.message || "Erro ao salvar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || isVerifying) {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

if (!hasPermission) {
  return null; // já redirecionou no useEffect
}

  return (
    <ProtectedRoute>
      <div className="flex bg-white min-h-screen w-full">
        <div style={{ zoom: "80%" }} className="h-screen overflow-auto">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-center">
              Novo Registro de Ação (ODE)
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 🔹 Etapa 1 - Identificação */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Identificação</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.nome}
                      disabled
                      className="w-full border rounded p-3 bg-gray-100 text-gray-700"
                    />
                    <select
                      className="w-full border rounded p-3"
                      value={formData.setor}
                      onChange={(e) => handleChange("setor", e.target.value)}
                    >
                      <option value="">Selecione o Setor</option>
                      {setores.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 🔹 Etapa 2 - Localização */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Localização</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      className="w-full border rounded p-3"
                      value={formData.regiao}
                      onChange={(e) => handleChange("regiao", e.target.value)}
                    >
                      <option value="">Selecione a Região</option>
                      <option value="todas">Todas as Regionais</option> {/* 🔹 nova opção */}
                      {Object.keys(regioes).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <select
                      className="w-full border rounded p-3"
                      value={formData.municipio}
                      onChange={(e) => handleChange("municipio", e.target.value)}
                      disabled={!formData.regiao}
                    >
                      <option value="">Selecione o Município</option>
                      {formData.regiao === "todas" ? (
                        <option value="TODOS">Todos os Municípios</option>
                      ) : (
                        formData.regiao &&
                        regioes[formData.regiao]?.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))
                      )}
                    </select>

                  </div>
                </div>
              )}

              {/* 🔹 Etapa 3 - Detalhes */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Detalhes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      className="w-full border rounded p-3"
                      value={formData.descricao}
                      onChange={(e) => handleChange("descricao", e.target.value)}
                    >
                      <option value="">Selecione a Descrição</option>
                      {descricoes.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {formData.descricao === "Outro" && (
                      <input
                        type="text"
                        placeholder="Especifique aqui"
                        className="w-full border rounded p-3"
                        value={formData.outro}
                        onChange={(e) => handleChange("outro", e.target.value)}
                      />
                    )}
                    <select
                      className="w-full border rounded p-3"
                      value={formData.obra}
                      onChange={(e) => handleChange("obra", e.target.value)}
                    >
                      <option value="">Obra?</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                    <select
                      className="w-full border rounded p-3"
                      value={formData.servico}
                      onChange={(e) => handleChange("servico", e.target.value)}
                    >
                      <option value="">Serviço?</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </div>
              )}

                          {/* 🔹 Etapa 4 - Programa e Ação */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Programa e Ação</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      className="w-full border rounded p-3"
                      value={formData.programa}
                      onChange={(e) => handleChange("programa", e.target.value)}
                    >
                      <option value="">Selecione o Programa</option>
                      {programas.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full border rounded p-3"
                      value={formData.acao}
                      onChange={(e) => handleChange("acao", e.target.value)}
                    >
                      <option value="">Selecione a Ação</option>
                      {acoes.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 🔹 Etapa 5 - Finalização */}
              {step === 5 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Finalização</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Quantidade de Benefícios/Beneficiários"
                      className="w-full border rounded p-3"
                      value={formData.qtdBeneficios}
                      onChange={(e) =>
                        handleChange("qtdBeneficios", e.target.value)
                      }
                    />
                    <select
                      className="w-full border rounded p-3"
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="">Selecione o Status</option>
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Ano"
                      className="w-full border rounded p-3"
                      value={formData.ano}
                      onChange={(e) => handleChange("ano", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Valor"
                      className="w-full border rounded p-3"
                      value={formData.valor}
                      onChange={(e) => handleChange("valor", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Fonte de Recurso"
                      className="w-full border rounded p-3 col-span-2"
                      value={formData.fonte}
                      onChange={(e) => handleChange("fonte", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 🔹 Navegação entre etapas */}
              <div className="flex justify-end pt-4 space-x-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Voltar
                  </Button>
                )}
                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!isStepValid(step)}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading || !isStepValid(5)}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Salvar Registro"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
