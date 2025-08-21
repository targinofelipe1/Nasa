"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, SquarePen } from "lucide-react";

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

// Esquema de validação para o formulário de edição
const formSchema = z.object({
  fullName: z.string().min(10, {
    message: "O nome completo deve ter pelo menos 10 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um e-mail válido.",
  }),
});

interface EditUserFormProps {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  onUserUpdated: () => void;
  onClose: () => void;
}

export default function EditUserForm({ user, onUserUpdated, onClose }: EditUserFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
    },
  });

  const handleUpdateUser = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const nameParts = values.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH', // Usamos PATCH para atualizar parcialmente os dados
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: values.email,
        }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar o usuário.');

      toast.success("Usuário atualizado com sucesso!");
      form.reset();
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar o usuário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
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
                Atualizando...
              </>
            ) : (
              <>
                <SquarePen className="mr-2 h-4 w-4" /> Atualizar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}