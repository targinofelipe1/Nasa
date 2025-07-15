"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
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

if (typeof window !== "undefined") {
  window.CLERK_DEBUG = true;
}

const formSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  code: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [email, setEmail] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    try {
      if (!pendingVerification) {
        const result = await signIn.create({
          identifier: values.email,
          strategy: "email_code",
        });

        if (result.status === "needs_first_factor") {
          setPendingVerification(true);
          setEmail(values.email);
          toast.success("Código enviado para o seu e-mail!");
        }
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: values.code!,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          toast.success("Login bem-sucedido!");
          router.push("/");
        } else {
          toast.error("Código inválido. Tente novamente.");
          return;
        }
      }
    } catch (err) {

      if (isClerkAPIResponseError(err)) {
        const message = err.errors?.[0]?.message?.toLowerCase() ?? "";

        if (!pendingVerification) {
          if (message.includes("identifier must be a valid email")) {
            toast.error("Digite um e-mail válido.");
            return;
          }
          if (message.includes("couldn't find") || message.includes("not found")) {
            toast.error("E-mail não cadastrado. Verifique ou registre-se.");
            return;
          }
        }

        if (pendingVerification) {
          if (message.includes("invalid") || message.includes("code")) {
            toast.error("Código inválido. Verifique e tente novamente.");
            return;
          }
        }

        toast.error("Erro: " + err.errors[0]?.message);
        return;
      }

      toast.error("Erro inesperado ao tentar login. Tente novamente.");
      return;
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ zoom: "80%" }}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-xs"
        >
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
                      <Input type="email" placeholder="Digite seu email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Continuar
              </Button>

              <div className="text-center text-sm">
                <span className="mr-1">Ainda não possui uma conta?</span>
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4 font-medium text-primary"
                >
                  Cadastrar-se
                </Link>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="link"
                type="button"
                className="flex items-center p-1"
                onClick={() => setPendingVerification(false)}
              >
                <ChevronLeft className="h-5 w-5" /> Voltar
              </Button>
              <h1 className="text-2xl font-bold">Validação da conta</h1>
              <p className="text-sm">
                Um código foi enviado para <strong>{email}</strong>. Verifique sua
                caixa de entrada e insira o código abaixo.
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
              <Button className="w-full" type="submit">
                Verificar Código
              </Button>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
