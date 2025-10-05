"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      richColors
      position="top-right"
      closeButton
      expand
      {...props}
    />
  );
};

export { Toaster };
