// Mock do hook useIntersectionObserver usando mocks da plataforma
// Redireciona para o sistema padronizado de mocks

import { MockIntersectionObserver } from "../../platform-mocks";

// Hook mockado que usa IntersectionObserver padronizado
export function useIntersectionObserver(options?: any) {
  // Simula comportamento básico do hook
  const ref = { current: null };
  const isIntersecting = false;
  const observer = null;

  // O mock da plataforma já está configurado globalmente
  // Este hook mockado apenas retorna valores padrão

  return [ref, isIntersecting, observer];
}

// Exporta o construtor para testes que precisam dele diretamente
export { MockIntersectionObserver as IntersectionObserver };
