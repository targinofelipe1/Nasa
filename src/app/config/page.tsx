"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CircleUserRound, Loader2, ImageIcon } from "lucide-react";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import Sidebar from "../components-antigo/Sidebar";
import { Input } from "../components-antigo/Input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components-antigo/Form";
import { Button } from "../components-antigo/Button";



const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
});

export default function UserSettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageToUpload, setImageToUpload] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      form.setValue("firstName", user.firstName || "");
    } else if (isLoaded && !isSignedIn) {
      router.push("/auth/sign-in");
    }
  }, [isLoaded, isSignedIn, user, form, router]);

  const handleUpdateProfile = async (values: z.infer<typeof formSchema>) => {
    if (!user || !isLoaded) return;
    setLoading(true);

    try {
      // Atualiza o nome
      await user.update({
        firstName: values.firstName,
      });

      // Se houver uma nova imagem para carregar, a envia
      if (imageToUpload) {
        setImageLoading(true);
        await user.setProfileImage({ file: imageToUpload });
        setImageLoading(false);
        setImageToUpload(null); // Limpa o estado após o upload
        setPreviewImageUrl(null); // Limpa a URL de pré-visualização
      }

      // Exibe a mensagem de sucesso unificada
      toast.success("Perfil atualizado com sucesso!");

    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      toast.error("Erro ao atualizar o perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageToUpload(file); // Salva o arquivo para upload futuro
      const url = URL.createObjectURL(file);
      setPreviewImageUrl(url); // Cria e salva a URL para a pré-visualização imediata
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Define a URL da imagem a ser exibida: a de pré-visualização ou a do usuário
  const displayImageUrl = previewImageUrl || user.imageUrl;

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen w-full" style={{ zoom: "80%" }}>
        <Sidebar />
        <main className="flex-1 flex justify-center items-center p-8">
          <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-2xl font-bold">Configurações do Perfil</h1>
              <p className="text-sm text-muted-foreground">
                Altere seu nome e foto de perfil.
              </p>
              
              {/* Contêiner clicável para upload da foto */}
              <label
                htmlFor="file-upload"
                className="relative w-24 h-24 mb-4 cursor-pointer"
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                  {imageLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/70">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : (
                    <>
                      {displayImageUrl ? (
                        <Image src={displayImageUrl} alt="Foto de Perfil" fill className="rounded-full" style={{ objectFit: 'cover' }} />
                      ) : (
                        <CircleUserRound className="w-full h-full text-gray-400 rounded-full" />
                      )}
                    </>
                  )}
                </div>
                {/* Ícone de imagem em um círculo no canto */}
                <div className="absolute bottom-0 right-0 p-1 bg-gray-800 text-white rounded-full transition-colors transform translate-x-1/4 -translate-y-1/2">
                  <ImageIcon size={16} />
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading || imageLoading}
                />
              </label>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4 mt-6">
                <FormField
                  control={form.control}
                  name="firstName"
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
                <Button type="submit" className="w-full" disabled={loading || imageLoading}>
                  {loading || imageLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : "Salvar Alterações"}
                </Button>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}