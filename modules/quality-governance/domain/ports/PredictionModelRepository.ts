import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { PredictionModel } from '../entities/PredictionModel'

export interface PredictionModelRepository {
  save(model: PredictionModel): Promise<Result<void, AppError>>
  findById(id: string): Promise<Result<PredictionModel | null, AppError>>
  findActive(): Promise<Result<PredictionModel[], AppError>>
  findByType(type: string): Promise<Result<PredictionModel[], AppError>>
  findBestPerforming(type?: string): Promise<Result<PredictionModel | null, AppError>>
  updateMetrics(id: string, accuracy: number, precision: number, recall: number, f1Score: number): Promise<Result<void, AppError>>
  recordPrediction(id: string, success: boolean): Promise<Result<void, AppError>>
  deactivate(id: string): Promise<Result<void, AppError>>
}
