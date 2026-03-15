"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSignUp, useSession } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Input } from "@/app/components-antigo/Input";
import { Button } from "@/app/components-antigo/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components-antigo/Form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components-antigo/Input-otp";

const formSchema = z.object({
  nomeCompleto: z.string().min(15, {
    message: "O nome completo deve ter pelo menos 15 caracteres.",
  }),
  email: z.string().email({
    message: "Digite um e-mail válido.",
  }),
});

function getAvatarFromName(nome: string) {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "US"
  );
}

function splitName(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (partes.length === 1) {
    return { firstName: partes[0], lastName: "" };
  }

  return {
    firstName: partes[0],
    lastName: partes.slice(1).join(" "),
  };
}

type SyncPayload = {
  userId: string;
  nome: string;
  email: string;
  cidade: string;
  avatar: string;
};

type SyncResult = {
  ok: boolean;
  route: string;
  message: string;
};

export default function SignUpForm() {
  const { isLoaded, setActive, signUp } = useSignUp();
  const { isSignedIn } = useSession();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [nomeCompleto, setNomeCompleto] = React.useState("");
  const [pendingEmailCode, setPendingEmailCode] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [reenviarDisabled, setReenviarDisabled] = React.useState(false);
  const [tempoRestante, setTempoRestante] = React.useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
    },
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (reenviarDisabled && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            setReenviarDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reenviarDisabled, tempoRestante]);

  const reenviarCodigo = async () => {
    if (!isLoaded || reenviarDisabled) return;

    setCode("");
    setReenviarDisabled(true);
    setTempoRestante(120);
    setLoading(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("Novo código enviado com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao reenviar o código. Tente novamente.");
      setReenviarDisabled(false);
      setTempoRestante(0);
    } finally {
      setLoading(false);
    }
  };

  async function syncUsuarioEmModulo(
    route: string,
    payload: SyncPayload
  ): Promise<SyncResult> {
    try {
      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let json: any = null;

      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        return {
          ok: false,
          route,
          message:
            json?.message ||
            `Falha ao sincronizar usuário em ${route}.`,
        };
      }

      return {
        ok: true,
        route,
        message: json?.message || "Sincronizado com sucesso.",
      };
    } catch (error) {
      console.error(`Erro ao chamar ${route}:`, error);
      return {
        ok: false,
        route,
        message: `Erro de conexão ao sincronizar usuário em ${route}.`,
      };
    }
  }

  async function syncUsuarioNosTresModulos(payload: SyncPayload) {
    const routes = [
      "/api/comunidade/usuarios",
      "/api/contribuicoes/usuarios",
      "/api/recompensas/usuarios",
    ];

    const results = await Promise.all(
      routes.map((route) => syncUsuarioEmModulo(route, payload))
    );

    return results;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    if (isSignedIn) {
      toast.info("Você já está autenticado.");
      router.push("/");
      return;
    }

    setLoading(true);

    try {
      const { firstName, lastName } = splitName(values.nomeCompleto);

      await signUp.create({
        emailAddress: values.email,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingEmailCode(true);
      setEmail(values.email);
      setNomeCompleto(values.nomeCompleto);
      setCode("");
      setReenviarDisabled(true);
      setTempoRestante(120);

      toast.success("Código enviado para o e-mail informado.");
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        const rawMessage =
          `${err.errors?.[0]?.message ?? ""} ${err.errors?.[0]?.longMessage ?? ""}`.toLowerCase();

        if (
          rawMessage.includes("valid email") ||
          rawMessage.includes("invalid") ||
          rawMessage.includes("email")
        ) {
          toast.error("Digite um e-mail válido.");
          return;
        }

        if (
          rawMessage.includes("already") ||
          rawMessage.includes("taken") ||
          rawMessage.includes("exist")
        ) {
          toast.error("Este e-mail já está em uso. Faça login ou use outro.");
          return;
        }

        toast.error("Erro ao criar conta. Verifique os dados.");
      } else {
        console.error(err);
        toast.error("Erro inesperado. Verifique sua conexão ou tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) return;

    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error("Digite os 6 dígitos do código enviado para seu e-mail.");
      return;
    }

    setLoading(true);

    try {
      const complete = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (complete.status !== "complete") {
        toast.error("Não foi possível concluir a verificação da conta.");
        return;
      }

      await setActive({ session: complete.createdSessionId });

      const clerkUserId = signUp.createdUserId || complete.createdUserId;

      if (!clerkUserId) {
        toast.error("Conta criada, mas não foi possível identificar o usuário.");
        return;
      }

      const avatar = getAvatarFromName(nomeCompleto);

      const payload: SyncPayload = {
        userId: clerkUserId,
        nome: nomeCompleto,
        email,
        cidade: "",
        avatar,
      };

      const syncResults = await syncUsuarioNosTresModulos(payload);
      const erros = syncResults.filter((item) => !item.ok);

      if (erros.length > 0) {
        console.error("Falhas ao sincronizar usuário:", erros);

        toast.error(
          erros.map((item) => item.message).join(" | ")
        );
        return;
      }

      toast.success("Conta verificada e sincronizada com sucesso!");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        const rawMessage =
          `${err.errors?.[0]?.message ?? ""} ${err.errors?.[0]?.longMessage ?? ""}`.toLowerCase();

        if (rawMessage.includes("expired")) {
          toast.error("O código expirou. Solicite um novo.");
          return;
        }

        if (
          rawMessage.includes("invalid") ||
          rawMessage.includes("incorrect") ||
          rawMessage.includes("code")
        ) {
          toast.error("Código inválido. Verifique e tente novamente.");
          return;
        }

        if (rawMessage.includes("banned") || rawMessage.includes("blocked")) {
          toast.error("Acesso bloqueado. Entre em contato com o administrador.");
          return;
        }

        toast.error("Erro ao verificar a conta. Tente novamente mais tarde.");
      } else {
        console.error(err);
        toast.error("Erro inesperado. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex justify-center items-center min-h-screen"
      style={{ zoom: "80%" }}
    >
      <Form {...form}>
        {!pendingEmailCode ? (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full max-w-xs"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Criar conta</h1>
              <p className="text-sm text-muted-foreground">
                Informe seus dados para se cadastrar
              </p>
            </div>

            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} aria-label="Nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} aria-label="E-mail" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: "#2E7D32" }}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Cadastrar"}
            </Button>

            <div className="text-center text-sm">
              <span className="mr-1">Já possui uma conta?</span>
              <Link
                href="/auth/sign-in"
                className="underline font-medium text-primary"
              >
                Fazer login
              </Link>
            </div>
          </form>
        ) : (
          <form className="space-y-6 w-full max-w-xs" onSubmit={handleVerify}>
            <Button
              variant="link"
              type="button"
              className="flex items-center p-1"
              onClick={() => {
                setPendingEmailCode(false);
                setCode("");
              }}
            >
              <ChevronLeft className="h-5 w-5" /> Voltar
            </Button>

            <h1 className="text-2xl font-bold">Validação da conta</h1>
            <p className="text-sm text-center">
              Um código foi enviado para <strong>{email}</strong>.
            </p>

            <div className="flex justify-center">
              <InputOTP value={code} onChange={setCode} maxLength={6}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              style={{ backgroundColor: "#2E7D32" }}
              className="w-full"
              disabled={code.length !== 6 || loading}
            >
              {loading ? "Verificando..." : "Verificar Código"}
            </Button>

            <Button
              type="button"
              className="w-full"
              onClick={reenviarCodigo}
              disabled={loading || reenviarDisabled}
              variant="outline"
            >
              {reenviarDisabled
                ? `Aguarde ${Math.floor(tempoRestante / 60)
                    .toString()
                    .padStart(2, "0")}:${(tempoRestante % 60)
                    .toString()
                    .padStart(2, "0")} para solicitar um novo código`
                : "Solicitar novo código"}
            </Button>
          </form>
        )}
      </Form>
    </div>
  );
}