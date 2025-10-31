import { z } from 'zod'
import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'

export const PredictionModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['temporal', 'correlation', 'classification', 'clustering']),
  version: z.string(),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  trainedAt: z.date(),
  trainingDataSize: z.number().int().positive(),
  features: z.array(z.string()),
  targetVariable: z.string(),
  algorithm: z.string(),
  hyperparameters: z.record(z.unknown()),
  active: z.boolean().default(true),
  lastPredictionAt: z.date().optional(),
  totalPredictions: z.number().int().default(0),
  successfulPredictions: z.number().int().default(0)
})

export type PredictionModelProps = z.infer<typeof PredictionModelSchema>

export class PredictionModel {
  private constructor(private readonly props: PredictionModelProps) {}

  static create(props: Omit<PredictionModelProps, 'id' | 'trainedAt'>): Result<PredictionModel, AppError> {
    try {
      const modelProps: PredictionModelProps = {
        ...props,
        id: crypto.randomUUID(),
        trainedAt: new Date()
      }

      const validated = PredictionModelSchema.parse(modelProps)
      return Result.ok(new PredictionModel(validated))
    } catch (error) {
      return Result.err(AppError.validation('Invalid prediction model data', { error }))
    }
  }

  static fromPersistence(props: PredictionModelProps): PredictionModel {
    return new PredictionModel(props)
  }

  // Getters
  get id(): string { return this.props.id }
  get name(): string { return this.props.name }
  get type(): string { return this.props.type }
  get accuracy(): number { return this.props.accuracy }
  get active(): boolean { return this.props.active }

  // Business logic
  recordPrediction(success: boolean): void {
    this.props.totalPredictions += 1
    this.props.lastPredictionAt = new Date()

    if (success) {
      this.props.successfulPredictions += 1
    }
  }

  updateMetrics(accuracy: number, precision: number, recall: number, f1Score: number): Result<void, AppError> {
    const metrics = [accuracy, precision, recall, f1Score]
    if (metrics.some(m => m < 0 || m > 1)) {
      return Result.err(AppError.validation('All metrics must be between 0 and 1'))
    }

    this.props.accuracy = accuracy
    this.props.precision = precision
    this.props.recall = recall
    this.props.f1Score = f1Score

    return Result.ok(undefined)
  }

  deactivate(): void {
    this.props.active = false
  }

  get successRate(): number {
    return this.props.totalPredictions > 0
      ? this.props.successfulPredictions / this.props.totalPredictions
      : 0
  }

  toJSON(): PredictionModelProps {
    return { ...this.props }
  }
}
