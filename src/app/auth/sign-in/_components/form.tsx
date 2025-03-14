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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/Input-otp";

// Habilitar logs no navegador
if (typeof window !== "undefined") {
  window.CLERK_DEBUG = true;
}

// Esquema de validação
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
      console.log("📨 Tentando login com:", values.email);

      if (!pendingVerification) {
        const result = await signIn.create({
          identifier: values.email,
          strategy: "email_code",
        });

        console.log("✅ Código enviado:", result);

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

        console.log("📩 Tentando validar código:", values.code, result);

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          console.log("🎉 Login bem-sucedido! Redirecionando...");
          router.push("/");
        } else {
          toast.error("Código inválido. Tente novamente.");
        }
      }
    } catch (err) {
      console.error("❌ Erro no login:", err);
      if (isClerkAPIResponseError(err)) {
        return toast.error(err.errors[0]?.message);
      }
      toast.error("Erro ao tentar login. Tente novamente.");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
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
                      <Input type="email" placeholder="Digite seu email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Continuar
              </Button>

              {/* 🔥 Adicionado de volta: Link para criar conta 🔥 */}
              <div className="text-center text-sm">
                <span className="mr-1">Ainda não possui uma conta?</span>
                <Link href="/auth/sign-up" className="underline underline-offset-4 font-medium text-primary">
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
                Um código foi enviado para <strong>{email}</strong>. Verifique sua caixa de entrada e insira o código abaixo.
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
