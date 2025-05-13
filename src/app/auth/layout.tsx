import { BarChart2, LayoutDashboard, PanelLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Coluna Esquerda - Formulário */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Logo e Nome */}
        <div className="flex justify-center items-center gap-2 text-center">
          <a href="/auth/sign-in" className="flex items-center gap-2 font-medium">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-primary-foreground">
              <BarChart2 className="size-6" />
            </div>
            Secretaria de Estado do Desenvolvimento Humano
          </a>
        </div>



        {/* Conteúdo Dinâmico (Login ou Cadastro) */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>

      {/* Coluna Direita - Imagem de Fundo */}
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/img/img.png"
          alt="Imagem de fundo"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
