import { useEffect } from "react";

const NoScroll = () => {
  useEffect(() => {
    document.documentElement.style.overflow = "hidden"; // Remove a rolagem

    return () => {
      document.documentElement.style.overflow = ""; // Restaura ao sair da página
    };
  }, []);

  return null; // O componente não precisa renderizar nada
};

export default NoScroll;
