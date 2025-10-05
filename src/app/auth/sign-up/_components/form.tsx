"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { useSignUp, useSession } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/app/components-antigo/Input";
import { Button } from "@/app/components-antigo/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components-antigo/Form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components-antigo/Input-otp";
import React from "react";

const formSchema = z.object({
  nomeCompleto: z.string().min(15, {
    message: "O nome completo deve ter pelo menos 15 caracteres.",
  }),
  email: z.string().email({
    message: "Digite um e-mail válido.",
  }),
});

export default function SignUpForm() {
  const { isLoaded, setActive, signUp } = useSignUp();
  const { isSignedIn } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pendingEmailCode, setPendingEmailCode] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviarDisabled, setReenviarDisabled] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      email: "",
    },
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (reenviarDisabled && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setReenviarDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [reenviarDisabled, tempoRestante]);

  // Envia novo código
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
      toast.error("Erro ao reenviar o código. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Primeiro passo: criar conta e enviar código
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    if (isSignedIn) {
      toast.info("Você já está autenticado.");
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: values.email,
        firstName: values.nomeCompleto,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingEmailCode(true);
      setEmail(values.email);
      setReenviarDisabled(true);
      setTempoRestante(120);
      toast.success("Código enviado para o e-mail informado.");
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        const rawMessage = err.errors?.[0]?.message ?? "Erro inesperado.";
        const message = rawMessage.toLowerCase();

        if (message.includes("valid email") || message.includes("invalid")) {
          toast.error("Digite um e-mail válido.");
          return;
        }

        if (message.includes("already") || message.includes("taken") || message.includes("exist")) {
          toast.error("Este e-mail já está em uso. Faça login ou use outro.");
          return;
        }

        toast.error("Erro ao criar conta. Verifique os dados.");
      } else {
        toast.error("Erro inesperado. Verifique sua conexão ou tente novamente.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  // Segundo passo: verificar código
  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) return;

    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error("Digite os 6 dígitos do código enviado para seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });
      await setActive({ session: complete.createdSessionId });
      toast.success("Conta verificada com sucesso!");
      router.push("/");
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        const rawMessage = err.errors?.[0]?.message ?? "Erro inesperado.";
        const message = rawMessage.toLowerCase();

        if (message.includes("expired")) {
          toast.error("O código expirou. Solicite um novo.");
          return;
        }

        if (message.includes("invalid") || message.includes("incorrect")) {
          toast.error("Código inválido. Verifique e tente novamente.");
          return;
        }

        toast.error("Erro ao verificar a conta. Tente novamente mais tarde.");
      } else {
        toast.error("Erro inesperado. Verifique sua conexão.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // Renderização
  // =========================
  return (
    <div className="flex justify-center items-center min-h-screen" style={{ zoom: "80%" }}>
      <Form {...form}>
        {!pendingEmailCode ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-xs">
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
                disabled={loading}>
              {loading ? "Verificando..." : "Cadastrar"}
            </Button>

            <div className="text-center text-sm">
              <span className="mr-1">Já possui uma conta?</span>
              <Link href="/auth/sign-in" className="underline font-medium text-primary">
                Fazer login
              </Link>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerify}>
            <Button
              variant="link"
              type="button"
              className="flex items-center p-1"
              onClick={() => setPendingEmailCode(false)}
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

            <Button type="submit" style={{ backgroundColor: "#2E7D32" }} className="w-full" disabled={code.length !== 6 || loading}>
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
