import { z } from 'zod'
import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'

// Domain schemas
export const QualityEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  category: z.enum([
    'structural_orphaned',
    'refactor_incomplete',
    'feature_abandoned',
    'pattern_violation',
    'configuration_drift',
    'security_gap',
    'performance_degradation',
    'test_coverage_gap'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  filePath: z.string(),
  lineNumber: z.number().optional(),
  message: z.string(),
  context: z.record(z.unknown()),
  owner: z.string(),
  traceId: z.string(),
  resolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolution: z.string().optional()
})

export type QualityEventProps = z.infer<typeof QualityEventSchema>

export class QualityEvent {
  private constructor(private readonly props: QualityEventProps) {}

  static create(props: Omit<QualityEventProps, 'id' | 'timestamp' | 'traceId'>): Result<QualityEvent, AppError> {
    try {
      const eventProps: QualityEventProps = {
        ...props,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        traceId: crypto.randomUUID()
      }

      const validated = QualityEventSchema.parse(eventProps)
      return Result.ok(new QualityEvent(validated))
    } catch (error) {
      return Result.err(AppError.validation('Invalid quality event data', { error }))
    }
  }

  static fromPersistence(props: QualityEventProps): QualityEvent {
    return new QualityEvent(props)
  }

  // Getters
  get id(): string { return this.props.id }
  get timestamp(): Date { return this.props.timestamp }
  get category(): string { return this.props.category }
  get severity(): string { return this.props.severity }
  get filePath(): string { return this.props.filePath }
  get owner(): string { return this.props.owner }
  get traceId(): string { return this.props.traceId }
  get resolved(): boolean { return this.props.resolved }

  // Business logic
  resolve(resolution: string): Result<void, AppError> {
    if (this.props.resolved) {
      return Result.err(AppError.businessRule('Event already resolved'))
    }

    this.props.resolved = true
    this.props.resolvedAt = new Date()
    this.props.resolution = resolution

    return Result.ok(undefined)
  }

  toJSON(): QualityEventProps {
    return { ...this.props }
  }
}
