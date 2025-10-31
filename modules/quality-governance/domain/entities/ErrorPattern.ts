import { z } from 'zod'
import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'

export const ErrorPatternSchema = z.object({
  id: z.string().uuid(),
  patternId: z.string(), // Unique identifier for the pattern type
  name: z.string(),
  description: z.string(),
  category: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1), // ML confidence score
  occurrences: z.number().int().min(1),
  firstSeen: z.date(),
  lastSeen: z.date(),
  affectedFiles: z.array(z.string()),
  owners: z.array(z.string()),
  recurrenceProbability: z.number().min(0).max(1),
  averageResolutionTime: z.number(), // in hours
  relatedPatterns: z.array(z.string()), // IDs of related patterns
  predictionModel: z.string().optional(), // ML model used for prediction
  active: z.boolean().default(true)
})

export type ErrorPatternProps = z.infer<typeof ErrorPatternSchema>

export class ErrorPattern {
  private constructor(private readonly props: ErrorPatternProps) {}

  static create(props: Omit<ErrorPatternProps, 'id' | 'occurrences' | 'firstSeen' | 'lastSeen'>): Result<ErrorPattern, AppError> {
    try {
      const now = new Date()
      const patternProps: ErrorPatternProps = {
        ...props,
        id: crypto.randomUUID(),
        occurrences: 1,
        firstSeen: now,
        lastSeen: now
      }

      const validated = ErrorPatternSchema.parse(patternProps)
      return Result.ok(new ErrorPattern(validated))
    } catch (error) {
      return Result.err(AppError.validation('Invalid error pattern data', { error }))
    }
  }

  static fromPersistence(props: ErrorPatternProps): ErrorPattern {
    return new ErrorPattern(props)
  }

  // Getters
  get id(): string { return this.props.id }
  get patternId(): string { return this.props.patternId }
  get name(): string { return this.props.name }
  get category(): string { return this.props.category }
  get confidence(): number { return this.props.confidence }
  get occurrences(): number { return this.props.occurrences }
  get recurrenceProbability(): number { return this.props.recurrenceProbability }

  // Business logic
  recordOccurrence(filePath: string, owner: string): Result<void, AppError> {
    this.props.occurrences += 1
    this.props.lastSeen = new Date()

    if (!this.props.affectedFiles.includes(filePath)) {
      this.props.affectedFiles.push(filePath)
    }

    if (!this.props.owners.includes(owner)) {
      this.props.owners.push(owner)
    }

    return Result.ok(undefined)
  }

  updateConfidence(newConfidence: number): Result<void, AppError> {
    if (newConfidence < 0 || newConfidence > 1) {
      return Result.err(AppError.validation('Confidence must be between 0 and 1'))
    }

    this.props.confidence = newConfidence
    return Result.ok(undefined)
  }

  updateRecurrenceProbability(probability: number): Result<void, AppError> {
    if (probability < 0 || probability > 1) {
      return Result.err(AppError.validation('Probability must be between 0 and 1'))
    }

    this.props.recurrenceProbability = probability
    return Result.ok(undefined)
  }

  deactivate(): void {
    this.props.active = false
  }

  toJSON(): ErrorPatternProps {
    return { ...this.props }
  }
}
