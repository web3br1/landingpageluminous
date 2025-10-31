import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { QualityEvent } from '../entities/QualityEvent'

export interface QualityEventRepository {
  save(event: QualityEvent): Promise<Result<void, AppError>>
  findById(id: string): Promise<Result<QualityEvent | null, AppError>>
  findByCategory(category: string, limit?: number): Promise<Result<QualityEvent[], AppError>>
  findByOwner(owner: string, limit?: number): Promise<Result<QualityEvent[], AppError>>
  findByFilePath(filePath: string): Promise<Result<QualityEvent[], AppError>>
  findUnresolved(): Promise<Result<QualityEvent[], AppError>>
  findByTimeRange(start: Date, end: Date): Promise<Result<QualityEvent[], AppError>>
  countByCategory(category: string): Promise<Result<number, AppError>>
  getRecentEvents(limit: number): Promise<Result<QualityEvent[], AppError>>
}
