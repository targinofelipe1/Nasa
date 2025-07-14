'use client'; 

import { useEffect } from 'react';

declare global {
  interface Window {
    CLERK_DEBUG?: boolean;
  }
}

export default function ClerkDebugInitializer() {
  useEffect(() => {
    window.CLERK_DEBUG = true;
  
  }, []);

  return null; 
}