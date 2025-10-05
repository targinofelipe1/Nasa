// src/components/ui/ModalPortal.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: ReactNode;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};

export default ModalPortal;