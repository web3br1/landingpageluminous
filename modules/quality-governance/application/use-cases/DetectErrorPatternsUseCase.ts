import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { timed } from '@shared/observ'
import { QualityEventRepository } from '../../domain/ports/QualityEventRepository'
import { ErrorPatternRepository } from '../../domain/ports/ErrorPatternRepository'
import { CausalAnalyzer, CausalLink } from '../../domain/ports/CausalAnalyzer'
import { ErrorPattern } from '../../domain/entities/ErrorPattern'

export interface DetectErrorPatternsInput {
  lookbackDays: number
  minOccurrences: number
  confidenceThreshold: number
}

export interface ErrorPatternResult {
  newPatterns: ErrorPattern[]
  updatedPatterns: ErrorPattern[]
  causalLinks: CausalLink[]
  totalAnalyzed: number
}

export class DetectErrorPatternsUseCase {
  constructor(
    private readonly eventRepository: QualityEventRepository,
    private readonly patternRepository: ErrorPatternRepository,
    private readonly causalAnalyzer: CausalAnalyzer
  ) {}

  @timed('detect_error_patterns')
  async execute(input: DetectErrorPatternsInput): Promise<Result<ErrorPatternResult, AppError>> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - input.lookbackDays)

      // Fetch recent events
      const eventsResult = await this.eventRepository.findByTimeRange(startDate, endDate)
      if (eventsResult.isErr()) {
        return Result.err(eventsResult.error)
      }

      const events = eventsResult.value

      // Group events by similar characteristics
      const eventGroups = this.groupSimilarEvents(events)

      const newPatterns: ErrorPattern[] = []
      const updatedPatterns: ErrorPattern[] = []

      // Analyze each group for patterns
      for (const group of eventGroups) {
        if (group.events.length < input.minOccurrences) {
          continue
        }

        const patternResult = await this.analyzeEventGroup(group, input.confidenceThreshold)
        if (patternResult.isErr()) {
          continue // Skip failed analyses
        }

        const pattern = patternResult.value

        // Check if pattern already exists
        const existingPatternResult = await this.patternRepository.findByPatternId(pattern.patternId)
        if (existingPatternResult.isOk() && existingPatternResult.value) {
          // Update existing pattern
          const existing = existingPatternResult.value
          await existing.recordOccurrence(group.filePath, group.owner)
          await this.patternRepository.save(existing)
          updatedPatterns.push(existing)
        } else {
          // Create new pattern
          const createResult = ErrorPattern.create({
            patternId: pattern.patternId,
            name: pattern.name,
            description: pattern.description,
            category: pattern.category,
            severity: pattern.severity,
            confidence: pattern.confidence,
            affectedFiles: [group.filePath],
            owners: [group.owner],
            recurrenceProbability: this.calculateRecurrenceProbability(group.events, input.lookbackDays),
            averageResolutionTime: this.calculateAverageResolutionTime(group.events),
            relatedPatterns: [],
            active: true
          })

          if (createResult.isOk()) {
            await this.patternRepository.save(createResult.value)
            newPatterns.push(createResult.value)
          }
        }
      }

      // Analyze causal relationships
      const causalLinks = await this.analyzeCausalRelationships(events)

      const result: ErrorPatternResult = {
        newPatterns,
        updatedPatterns,
        causalLinks: causalLinks.isOk() ? causalLinks.value : [],
        totalAnalyzed: events.length
      }

      return Result.ok(result)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to detect error patterns', { error }))
    }
  }

  private groupSimilarEvents(events: any[]): Array<{ events: any[], filePath: string, owner: string, category: string }> {
    const groups: Record<string, any[]> = {}

    events.forEach(event => {
      const key = `${event.category}:${event.filePath}:${event.owner}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(event)
    })

    return Object.entries(groups).map(([key, groupEvents]) => {
      const [category, filePath, owner] = key.split(':')
      return {
        events: groupEvents,
        filePath,
        owner,
        category
      }
    })
  }

  private async analyzeEventGroup(
    group: { events: any[], filePath: string, owner: string, category: string },
    confidenceThreshold: number
  ): Promise<Result<any, AppError>> {
    // Simple pattern analysis - can be enhanced with ML
    const severity = this.determineSeverity(group.events)
    const confidence = Math.min(group.events.length / 10, 1) // Simple confidence based on frequency

    if (confidence < confidenceThreshold) {
      return Result.err(AppError.businessRule('Pattern confidence below threshold'))
    }

    const pattern = {
      patternId: `pattern_${group.category}_${group.filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: `${group.category} pattern in ${group.filePath}`,
      description: `Recurring ${group.category} issues in ${group.filePath}`,
      category: group.category,
      severity,
      confidence
    }

    return Result.ok(pattern)
  }

  private determineSeverity(events: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = events.filter(e => e.severity === 'critical').length
    const highCount = events.filter(e => e.severity === 'high').length

    if (criticalCount > 0) return 'critical'
    if (highCount > events.length * 0.5) return 'high'
    if (events.length > 5) return 'medium'
    return 'low'
  }

  private calculateRecurrenceProbability(events: any[], lookbackDays: number): number {
    const totalDays = lookbackDays
    const daysWithEvents = new Set(events.map(e => e.timestamp.toDateString())).size
    return Math.min(daysWithEvents / totalDays, 1)
  }

  private calculateAverageResolutionTime(events: any[]): number {
    const resolvedEvents = events.filter(e => e.resolved && e.resolvedAt)
    if (resolvedEvents.length === 0) return 0

    const totalTime = resolvedEvents.reduce((sum, event) => {
      const resolutionTime = (event.resolvedAt.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60) // hours
      return sum + resolutionTime
    }, 0)

    return totalTime / resolvedEvents.length
  }

  private async analyzeCausalRelationships(events: any[]): Promise<Result<CausalLink[], AppError>> {
    const simplifiedEvents = events.map(e => ({
      category: e.category,
      timestamp: e.timestamp,
      owner: e.owner
    }))

    return this.causalAnalyzer.findCorrelations(simplifiedEvents)
  }
}
