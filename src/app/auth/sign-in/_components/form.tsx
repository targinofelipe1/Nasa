// `LoginPage.tsx`
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components-antigo/Form";

import { Button } from "@/app/components-antigo/Button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components-antigo/Input-otp";
import { Input } from "@/app/components-antigo/Input";



const formSchema = z.object({
  email: z.string().email({ message: "Digite um e-mail válido." }),
  code: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviarDisabled, setReenviarDisabled] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  // Timer para reenvio de código
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    const validation = formSchema.safeParse(values);
    if (!validation.success) {
      toast.error("Digite um e-mail válido.");
      form.setError("email", {
        type: "manual",
        message: "Digite um e-mail válido.",
      });
      return;
    }

    try {
      setLoading(true);

      if (!pendingVerification) {
        const result = await signIn.create({
          identifier: values.email,
          strategy: "email_code",
        });

        if (result.status === "needs_first_factor") {
          setPendingVerification(true);
          setEmail(values.email);
          setTempoRestante(120);
          setReenviarDisabled(true);
          toast.success("Código enviado para o seu e-mail.");
        }
      } else {
        const code = values.code?.trim() || "";

        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
          toast.error("Digite os 6 dígitos do código enviado para seu e-mail.");
          return;
        }

        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          toast.success("Login realizado com sucesso!");
          router.push("/");
        } else {
          toast.error("Código inválido. Verifique e tente novamente.");
        }
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const rawMessage = err.errors?.[0]?.message ?? "";
        const longMessage = err.errors?.[0]?.longMessage ?? "";
        const message = (rawMessage + " " + longMessage).toLowerCase();

        // LÓGICA REFORÇADA PARA USUÁRIO BANIDO/BLOQUEADO
        if (message.includes("banned") || message.includes("blocked")) {
          toast.error("Acesso bloqueado. Entre em contato com o administrador.");
          setLoading(false);
          return;
        }

        if (!pendingVerification) {
          if (
            message.includes("valid email") ||
            message.includes("emailaddress") ||
            message.includes("identifier") ||
            message.includes("invalid")
          ) {
            toast.error("Digite um e-mail válido.");
            return;
          }

          if (
            message.includes("not found") ||
            message.includes("couldn't find") ||
            message.includes("does not exist")
          ) {
            toast.error("E-mail não cadastrado. Verifique ou registre-se.");
            return;
          }
        }

        if (pendingVerification) {
          if (message.includes("expired")) {
            toast.error("O código expirou. Solicite um novo.");
            return;
          }

          if (
            message.includes("invalid") ||
            message.includes("incorrect") ||
            message.includes("code")
          ) {
            toast.error("Código inválido. Verifique e tente novamente.");
            return;
          }
        }

        toast.error("Erro ao tentar login. Verifique os dados informados.");
      } else {
        toast.error("Erro inesperado. Verifique sua conexão com a internet.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  const reenviarCodigo = async () => {
    if (!isLoaded || !pendingVerification || reenviarDisabled) return;

    setLoading(true);
    setReenviarDisabled(true);
    setTempoRestante(120);

    try {
      // ✅ LIMPA O CAMPO DE CÓDIGO ANTES DE ENVIAR UM NOVO
      form.resetField("code", { defaultValue: "" });

      await signIn.create({ identifier: email, strategy: "email_code" });
      toast.success("Novo código enviado para o e-mail.");
    } catch (error) {
      toast.error("Erro ao reenviar o código. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ zoom: "80%" }}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-xs">
          {!pendingVerification ? (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login</h1>
                <p className="text-sm text-muted-foreground">
                  Insira seu e-mail abaixo para acessar sua conta.
                </p>
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Digite seu e-mail" {...field} />
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
                {loading ? "Verificando..." : "Continuar"}
              </Button>
              <div className="text-center text-sm">
                <span className="mr-1">Ainda não possui uma conta?</span>
                <Link
                  href="/auth/sign-up"
                  className="underline font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="link"
                type="button"
                className="flex items-center p-1"
                onClick={() => {
                  setPendingVerification(false);
                  form.resetField("code"); // ✅ CORREÇÃO: Limpa o campo de código ao voltar
                }}
              >
                <ChevronLeft className="h-5 w-5" /> Voltar
              </Button>
              <h1 className="text-2xl font-bold">Validação da conta</h1>
              <p className="text-sm text-center">
                Um código foi enviado para <strong>{email}</strong>.
              </p>
              <div className="flex justify-center">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <InputOTP value={field.value} onChange={field.onChange} maxLength={6}>
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, index) => (
                              <InputOTPSlot key={index} index={index} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: "#2E7D32" }} 
                disabled={loading || form.watch("code")?.length !== 6}
              >
                {loading ? "Verificando..." : "Verificar Código"}
              </Button>
              <Button
                type="button"
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: "#0277BD" }} // 💙 Azul-urbano (secundário)
                onClick={reenviarCodigo}
                disabled={loading || reenviarDisabled}
              >
                {reenviarDisabled
                  ? `Aguarde ${Math.floor(tempoRestante / 60)
                      .toString()
                      .padStart(2, "0")}:${(tempoRestante % 60)
                      .toString()
                      .padStart(2, "0")} para reenviar`
                  : "Solicitar novo código"}
              </Button>

            </>
          )}
        </form>
      </Form>
    </div>
  );
}