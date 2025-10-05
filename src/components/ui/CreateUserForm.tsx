// src/components/CreateUserForm.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";


import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components-antigo/Form";
import { Input } from "./input";
import { Button } from "@/app/components-antigo/Button";

// Esquema de validação atualizado para usar apenas 'fullName'
const formSchema = z.object({
  fullName: z.string().min(10, {
    message: "O nome completo deve ter pelo menos 10 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um e-mail válido.",
  }),
});

interface CreateUserFormProps {
  onUserCreated: () => void;
  onClose: () => void; // Adicione esta nova propriedade
}

export default function CreateUserForm({ onUserCreated, onClose }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const handleCreateUser = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    // Divide o nome completo para preencher os campos firstName e lastName
    const nameParts = values.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, // Envia o primeiro nome
          lastName,  // Envia o restante como sobrenome
          email: values.email
        }),
      });
      if (!response.ok) throw new Error('Erro ao cadastrar o usuário.');

      toast.success("Usuário cadastrado com sucesso!");
      form.reset();
      onUserCreated();
      onClose(); // <--- CHAME A FUNÇÃO onCLose AQUI
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      toast.error("Erro ao cadastrar o usuário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}