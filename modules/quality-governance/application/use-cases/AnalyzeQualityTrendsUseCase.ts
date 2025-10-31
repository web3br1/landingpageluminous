import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { timed } from '@shared/observ'
import { QualityEventRepository } from '../../domain/ports/QualityEventRepository'
import { TemporalAnalyzer, TimeSeriesData, TrendAnalysis } from '../../domain/ports/TemporalAnalyzer'

export interface AnalyzeQualityTrendsInput {
  startDate: Date
  endDate: Date
  categories?: string[]
  owners?: string[]
  windowDays?: number
}

export interface QualityTrendResult {
  overall: TrendAnalysis
  byCategory: Record<string, TrendAnalysis>
  byOwner: Record<string, TrendAnalysis>
  anomalies: TimeSeriesData[]
  predictions: TimeSeriesData[]
}

export class AnalyzeQualityTrendsUseCase {
  constructor(
    private readonly eventRepository: QualityEventRepository,
    private readonly temporalAnalyzer: TemporalAnalyzer
  ) {}

  @timed('analyze_quality_trends')
  async execute(input: AnalyzeQualityTrendsInput): Promise<Result<QualityTrendResult, AppError>> {
    try {
      // Fetch historical data
      const eventsResult = await this.eventRepository.findByTimeRange(input.startDate, input.endDate)
      if (eventsResult.isErr()) {
        return Result.err(eventsResult.error)
      }

      const events = eventsResult.value

      // Filter events if needed
      const filteredEvents = this.filterEvents(events, input)

      // Convert to time series data
      const timeSeriesData = this.eventsToTimeSeries(filteredEvents)

      // Analyze overall trend
      const overallTrend = await this.temporalAnalyzer.analyzeTrend(
        timeSeriesData,
        input.windowDays || 7
      )
      if (overallTrend.isErr()) {
        return Result.err(overallTrend.error)
      }

      // Analyze by category
      const byCategory = await this.analyzeByDimension(
        filteredEvents,
        'category',
        input.categories || []
      )

      // Analyze by owner
      const byOwner = await this.analyzeByDimension(
        filteredEvents,
        'owner',
        input.owners || []
      )

      // Detect anomalies
      const anomalies = await this.temporalAnalyzer.detectAnomalies(timeSeriesData, 2.0)
      if (anomalies.isErr()) {
        return Result.err(anomalies.error)
      }

      // Generate predictions
      const predictions = await this.temporalAnalyzer.forecast(timeSeriesData, 7)
      if (predictions.isErr()) {
        return Result.err(predictions.error)
      }

      const result: QualityTrendResult = {
        overall: overallTrend.value,
        byCategory,
        byOwner,
        anomalies: anomalies.value,
        predictions: predictions.value
      }

      return Result.ok(result)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to analyze quality trends', { error }))
    }
  }

  private filterEvents(events: any[], input: AnalyzeQualityTrendsInput): any[] {
    return events.filter(event => {
      if (input.categories && !input.categories.includes(event.category)) {
        return false
      }
      if (input.owners && !input.owners.includes(event.owner)) {
        return false
      }
      return true
    })
  }

  private eventsToTimeSeries(events: any[]): TimeSeriesData[] {
    // Group events by date and count
    const dailyCounts: Record<string, number> = {}

    events.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0]
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
    })

    return Object.entries(dailyCounts).map(([date, count]) => ({
      timestamp: new Date(date),
      value: count,
      metadata: { totalEvents: count }
    }))
  }

  private async analyzeByDimension(
    events: any[],
    dimension: 'category' | 'owner',
    filter?: string[]
  ): Promise<Record<string, TrendAnalysis>> {
    const results: Record<string, TrendAnalysis> = {}

    // Get unique values for the dimension
    const uniqueValues = [...new Set(events.map(e => e[dimension]))]
    const valuesToAnalyze = filter.length > 0 ? filter : uniqueValues

    for (const value of valuesToAnalyze) {
      const dimensionEvents = events.filter(e => e[dimension] === value)
      const timeSeries = this.eventsToTimeSeries(dimensionEvents)

      if (timeSeries.length >= 3) { // Need minimum data points
        const trend = await this.temporalAnalyzer.analyzeTrend(timeSeries, 7)
        if (trend.isOk()) {
          results[value] = trend.value
        }
      }
    }

    return results
  }
}
