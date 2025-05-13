"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { useSignUp, useSession } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/Input-otp";

const formSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres" }),
  matricula: z.string().min(4, { message: "Matrícula deve ter pelo menos 4 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
});

export default function SignUpForm() {
  const { isLoaded, setActive, signUp } = useSignUp();
  const { isSignedIn } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pendingEmailCode, setPendingEmailCode] = useState(false);
  const [code, setCode] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      matricula: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoaded) return;

    if (isSignedIn) {
      toast.info("Você já está autenticado!");
      router.push("/");
      return;
    }

    console.log("Tentando criar usuário com valores:", values);

    try {
      const result = await signUp.create({
        emailAddress: values.email,
        firstName: values.nomeCompleto,
        unsafeMetadata: { matricula: values.matricula },
      });

      console.log("✅ Usuário criado com sucesso:", result);

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      console.log("Código de verificação enviado para:", values.email);

      setPendingEmailCode(true);
      setEmail(values.email);
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      if (typeof err === "object" && err !== null && "errors" in err) {
        toast.error((err as any).errors[0]?.message || "Erro desconhecido");
        console.log("Clerk API Error:", err);
      }
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) return;

    console.log("📌 Tentando verificar código:", code);

    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });

      console.log("✅ Código verificado com sucesso:", complete);

      await setActive({ session: complete.createdSessionId });
      toast.success("Conta verificada com sucesso!");

      router.push("/");
    } catch (err) {
      console.error("Erro ao verificar código:", err);
      if (typeof err === "object" && err !== null && "errors" in err) {
        toast.error((err as any).errors[0]?.message || "Erro desconhecido");
        console.log("Clerk API Error:", err);
      }
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
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
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="matricula" render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full">Cadastrar</Button>

            <div className="text-center text-sm">
              <span className="mr-1">Já possui uma conta?</span>
              <Link href="/auth/sign-in" className="underline underline-offset-4 font-medium text-primary">
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
            <p className="text-sm">
              Um código foi enviado para <strong>{email}</strong>. Insira o código abaixo.
            </p>
            <InputOTP value={code} onChange={setCode} maxLength={6}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full">Verificar Código</Button>
          </form>
        )}
      </Form>
    </div>
  );
}