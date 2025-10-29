"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Contexto para flags congeladas do server
interface FrozenFlagsContextType {
  flags: Record<string, string>;
  experiments: Record<string, string>;
}

const FrozenFlagsContext = createContext<FrozenFlagsContextType | null>(null);

interface FrozenFlagsProviderProps {
  children: ReactNode;
  serverFlags?: Record<string, string>;
  serverExperiments?: Record<string, string>;
}

export function FrozenFlagsProvider({
  children,
  serverFlags = {},
  serverExperiments = {},
}: FrozenFlagsProviderProps) {
  const value = {
    flags: serverFlags,
    experiments: serverExperiments,
  };

  return (
    <FrozenFlagsContext.Provider value={value}>
      {children}
    </FrozenFlagsContext.Provider>
  );
}

// Hook para acessar flags congeladas (server-safe)
export function useFrozenFlags() {
  const context = useContext(FrozenFlagsContext);
  return context || { flags: {}, experiments: {} };
}

// Hook que prefere flags congeladas, mas fallback para dinâmicas se não houver
export function useExperimentVariant(experimentId: string): string {
  const frozen = useFrozenFlags();

  // Se temos flags congeladas do server, usar elas
  if (frozen.experiments[experimentId]) {
    return frozen.experiments[experimentId];
  }

  // Fallback para sistema dinâmico (apenas se realmente necessário)
  try {
    // Importar dinamicamente para evitar problemas de SSR
    const { flags } = require("../flags");
    return flags.getExperimentVariant(experimentId);
  } catch {
    return "control";
  }
}
