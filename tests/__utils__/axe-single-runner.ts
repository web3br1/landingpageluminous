// Axe Single Runner - Evita concorrência de axe.run()
// Implementa guard de reentrada e fila serializada

import axe from "axe-core";

// Estado global para controlar execução
let axeRunning = false;
let axeQueue: Array<{
  resolve: (result: any) => void;
  reject: (error: any) => void;
  context?: any;
  options?: any;
}> = [];

/**
 * Executa axe.run() de forma serializada, evitando concorrência
 * que causa "Axe is already running" errors
 */
export async function runAxeSerial(context?: any, options?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Adiciona à fila
    axeQueue.push({ resolve, reject, context, options });

    // Se não está rodando, inicia processamento
    if (!axeRunning) {
      processAxeQueue();
    }
  });
}

/**
 * Processa a fila de execuções axe de forma serial
 */
async function processAxeQueue() {
  if (axeRunning || axeQueue.length === 0) {
    return;
  }

  axeRunning = true;

  while (axeQueue.length > 0) {
    const { resolve, reject, context, options } = axeQueue.shift()!;

    try {
      // Pequeno delay para garantir limpeza completa
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await axe.run(context, options);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  axeRunning = false;
}

/**
 * Verifica se axe está em execução (para testes)
 */
export function isAxeRunning(): boolean {
  return axeRunning;
}

/**
 * Limpa a fila (para cleanup em afterEach)
 */
export function clearAxeQueue(): void {
  axeQueue = [];
  axeRunning = false;
}

/**
 * Hook para usar em testes - substitui axe.run diretamente
 */
// ===== CONFIGURAÇÃO PARA TESTES =====
export function setupAxeForTests() {
  // Configuração específica para testes - garante single instance
  if (typeof window !== "undefined") {
    // Override global axe.run se necessário para garantir serialização
    const originalAxe = (window as any).axe;
    if (originalAxe && originalAxe.run) {
      const originalRun = originalAxe.run.bind(originalAxe);
      originalAxe.run = (...args: any[]) => {
        return runAxeSerial(...args);
      };
    }
  }
}

export function createAxeRunner() {
  return {
    run: runAxeSerial,
    isRunning: isAxeRunning,
    clearQueue: clearAxeQueue,
    setupForTests: setupAxeForTests,
  };
}
