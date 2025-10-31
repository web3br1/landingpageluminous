import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'

export interface CausalLink {
  cause: string
  effect: string
  strength: number // 0-1
  confidence: number // 0-1
  timeLag?: number // hours
  evidence: string[]
}

export interface CausalChain {
  links: CausalLink[]
  overallStrength: number
  pattern: string
  description: string
}

export interface CausalAnalyzer {
  findCorrelations(events: Array<{ category: string; timestamp: Date; owner: string }>): Result<CausalLink[], AppError>
  buildCausalChains(links: CausalLink[]): Result<CausalChain[], AppError>
  predictEffect(causes: string[]): Result<string[], AppError>
  validateHypothesis(cause: string, effect: string, historicalData: any[]): Result<boolean, AppError>
}
