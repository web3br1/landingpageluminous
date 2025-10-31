import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { ErrorPattern } from '../entities/ErrorPattern'

export interface ErrorPatternRepository {
  save(pattern: ErrorPattern): Promise<Result<void, AppError>>
  findById(id: string): Promise<Result<ErrorPattern | null, AppError>>
  findByPatternId(patternId: string): Promise<Result<ErrorPattern | null, AppError>>
  findByCategory(category: string): Promise<Result<ErrorPattern[], AppError>>
  findActive(): Promise<Result<ErrorPattern[], AppError>>
  findHighConfidence(threshold: number): Promise<Result<ErrorPattern[], AppError>>
  findByAffectedFile(filePath: string): Promise<Result<ErrorPattern[], AppError>>
  findRecurringPatterns(): Promise<Result<ErrorPattern[], AppError>>
  updateConfidence(id: string, confidence: number): Promise<Result<void, AppError>>
  deactivate(id: string): Promise<Result<void, AppError>>
}
