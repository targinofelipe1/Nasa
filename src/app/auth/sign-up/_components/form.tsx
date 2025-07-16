"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useSignUp, useSession } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/Input-otp";

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

  const [tokenValido, setTokenValido] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");
  const [mostrarToken, setMostrarToken] = useState(false);

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

  useEffect(() => {
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

  const validarToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/validar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenDigitado }),
      });

      const data = await res.json();

      if (data.valido) {
        setTokenValido(true);
        toast.success("Token validado com sucesso!");
      } else {
        toast.error("Token inválido. Verifique e tente novamente.");
      }
    } catch {
      toast.error("Erro ao validar o token.");
    } finally {
      setLoading(false);
    }
  };

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    if (isSignedIn) {
      toast.info("Você já está autenticado.");
      router.push("/");
      return;
    }

    const validation = formSchema.safeParse(values);
    if (!validation.success) {
      toast.error("Digite um e-mail válido.");
      form.setError("email", {
        type: "manual",
        message: "Digite um e-mail válido.",
      });
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

        if (
          message.includes("valid email address") ||
          message.includes("is invalid") ||
          message.includes("email address is not valid") ||
          message.includes("emailaddress")
        ) {
          toast.error("Digite um e-mail válido.");
          return;
        }

        if (
          message.includes("email") &&
          (message.includes("already") || message.includes("taken") || message.includes("exist"))
        ) {
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

        if (
          message.includes("invalid") ||
          message.includes("incorrect") ||
          message.includes("code") ||
          message.includes("verification")
        ) {
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

  if (!tokenValido) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ zoom: "80%" }}>
        <div className="space-y-6 w-full max-w-xs">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Token de Acesso</h1>
            <p className="text-sm text-muted-foreground">
              Informe o token fornecido para continuar o cadastro
            </p>
          </div>
          <div className="relative">
            <Input
              type={mostrarToken ? "text" : "password"}
              placeholder="Digite o token de acesso"
              value={tokenDigitado}
              onChange={(e) => setTokenDigitado(e.target.value)}
              aria-label="Token de acesso"
            />
            <button
              type="button"
              className="absolute right-2 top-2"
              onClick={() => setMostrarToken((prev) => !prev)}
              aria-label="Mostrar ou ocultar token"
            >
              {mostrarToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <Button type="button" onClick={validarToken} className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Validar Token"}
          </Button>
          <div className="text-center text-sm">
            <span className="mr-1">Já possui uma conta?</span>
            <Link href="/auth/sign-in" className="underline font-medium text-primary">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ zoom: "80%" }}>
      <Form {...form}>
        {!pendingEmailCode ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-xs">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Criar conta</h1>
              <p className="text-sm text-muted-foreground">Informe seus dados para se cadastrar</p>
            </div>
            <FormField control={form.control} name="nomeCompleto" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl><Input {...field} aria-label="Nome completo" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} aria-label="E-mail" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={loading}>
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
            <Button variant="link" type="button" className="flex items-center p-1" onClick={() => setPendingEmailCode(false)}>
              <ChevronLeft className="h-5 w-5" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold">Validação da conta</h1>
            <p className="text-sm text-center">Um código foi enviado para <strong>{email}</strong>.</p>

            <div className="flex justify-center">
              <InputOTP value={code} onChange={setCode} maxLength={6}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full" disabled={code.length !== 6 || loading}>
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
                  .padStart(2, '0')}:${(tempoRestante % 60)
                  .toString()
                  .padStart(2, '0')} para solicitar um novo código`
              : "Solicitar novo código"}
          </Button>
          </form>
        )}
      </Form>
    </div>
  );
}
