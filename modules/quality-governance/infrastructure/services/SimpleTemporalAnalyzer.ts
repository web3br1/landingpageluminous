import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { TemporalAnalyzer, TimeSeriesData, TrendAnalysis } from '../../domain/ports/TemporalAnalyzer'

export class SimpleTemporalAnalyzer implements TemporalAnalyzer {
  async analyzeTrend(data: TimeSeriesData[], windowDays: number = 7): Result<TrendAnalysis, AppError> {
    try {
      if (data.length < 2) {
        return Result.err(AppError.validation('Need at least 2 data points for trend analysis'))
      }

      // Sort data by timestamp
      const sortedData = data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      // Calculate linear regression for trend
      const n = sortedData.length
      const sumX = sortedData.reduce((sum, _, i) => sum + i, 0)
      const sumY = sortedData.reduce((sum, d) => sum + d.value, 0)
      const sumXY = sortedData.reduce((sum, d, i) => sum + i * d.value, 0)
      const sumXX = sortedData.reduce((sum, _, i) => sum + i * i, 0)

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n

      // Determine direction
      let direction: 'increasing' | 'decreasing' | 'stable'
      if (Math.abs(slope) < 0.1) {
        direction = 'stable'
      } else {
        direction = slope > 0 ? 'increasing' : 'decreasing'
      }

      // Simple seasonality detection (very basic)
      const seasonality = this.detectSeasonality(sortedData)

      // Forecast next value
      const nextValue = intercept + slope * n

      // Generate forecast for next periods
      const forecast: TimeSeriesData[] = []
      const lastTimestamp = sortedData[sortedData.length - 1].timestamp

      for (let i = 1; i <= windowDays; i++) {
        const forecastDate = new Date(lastTimestamp)
        forecastDate.setDate(forecastDate.getDate() + i)

        forecast.push({
          timestamp: forecastDate,
          value: Math.max(0, intercept + slope * (n + i)),
          metadata: { forecast: true, confidence: 0.7 }
        })
      }

      const analysis: TrendAnalysis = {
        direction,
        slope,
        confidence: 0.8, // Simplified confidence
        seasonality,
        nextValue,
        forecast
      }

      return Result.ok(analysis)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to analyze trend', { error }))
    }
  }

  async detectAnomalies(data: TimeSeriesData[], threshold: number = 2.0): Result<TimeSeriesData[], AppError> {
    try {
      if (data.length < 3) {
        return Result.ok([])
      }

      // Calculate mean and standard deviation
      const values = data.map(d => d.value)
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      // Find anomalies (values beyond threshold standard deviations)
      const anomalies = data.filter(d => Math.abs(d.value - mean) > threshold * stdDev)

      return Result.ok(anomalies)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to detect anomalies', { error }))
    }
  }

  async forecast(data: TimeSeriesData[], periods: number): Result<TimeSeriesData[], AppError> {
    try {
      // Use the same linear regression approach as trend analysis
      const trendResult = await this.analyzeTrend(data, periods)
      if (trendResult.isErr()) {
        return Result.err(trendResult.error)
      }

      return Result.ok(trendResult.value.forecast)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to forecast', { error }))
    }
  }

  async correlateSeries(series1: TimeSeriesData[], series2: TimeSeriesData[]): Result<number, AppError> {
    try {
      if (series1.length !== series2.length || series1.length < 2) {
        return Result.err(AppError.validation('Series must have same length and at least 2 points'))
      }

      // Calculate Pearson correlation coefficient
      const n = series1.length
      const sum1 = series1.reduce((sum, d) => sum + d.value, 0)
      const sum2 = series2.reduce((sum, d) => sum + d.value, 0)
      const sum1Sq = series1.reduce((sum, d) => sum + d.value * d.value, 0)
      const sum2Sq = series2.reduce((sum, d) => sum + d.value * d.value, 0)
      const sum12 = series1.reduce((sum, d, i) => sum + d.value * series2[i].value, 0)

      const numerator = n * sum12 - sum1 * sum2
      const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2))

      const correlation = denominator === 0 ? 0 : numerator / denominator

      return Result.ok(correlation)

    } catch (error) {
      return Result.err(AppError.unexpected('Failed to correlate series', { error }))
    }
  }

  private detectSeasonality(data: TimeSeriesData[]): boolean {
    // Very basic seasonality detection - look for repeating patterns
    if (data.length < 14) return false // Need at least 2 weeks

    // Check if values repeat every 7 days (weekly pattern)
    const weeklyPattern = this.checkPeriodicity(data, 7)
    return weeklyPattern
  }

  private checkPeriodicity(data: TimeSeriesData[], period: number): boolean {
    if (data.length < period * 2) return false

    let matches = 0
    const totalComparisons = data.length - period

    for (let i = 0; i < totalComparisons; i++) {
      const current = data[i].value
      const next = data[i + period]?.value

      if (next !== undefined) {
        // Consider similar if within 20% of each other
        const similarity = 1 - Math.abs(current - next) / Math.max(current, next)
        if (similarity > 0.8) {
          matches++
        }
      }
    }

    return matches / totalComparisons > 0.6 // 60% similarity threshold
  }
}
