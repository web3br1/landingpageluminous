export interface PerformanceBudgets {
  TTFB: number;
  FCP: number;
  TBT: number;
  INP: number;
  CLS: number;
}

export function budgets(project: string): PerformanceBudgets {
  // WebKit mais frouxo inicialmente devido a engine diferente
  return project === "webkit"
    ? { TTFB: 1200, FCP: 1800, TBT: 600, INP: 400, CLS: 0.15 }
    : { TTFB: 800, FCP: 1800, TBT: 250, INP: 250, CLS: 0.1 };
}
