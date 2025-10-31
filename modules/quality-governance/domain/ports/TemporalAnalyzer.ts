import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'

export interface TimeSeriesData {
  timestamp: Date
  value: number
  category?: string
  metadata?: Record<string, unknown>
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  slope: number
  confidence: number
  seasonality: boolean
  period?: number
  nextValue?: number
  forecast: TimeSeriesData[]
}

export interface TemporalAnalyzer {
  analyzeTrend(data: TimeSeriesData[], windowDays?: number): Result<TrendAnalysis, AppError>
  detectAnomalies(data: TimeSeriesData[], threshold?: number): Result<TimeSeriesData[], AppError>
  forecast(data: TimeSeriesData[], periods: number): Result<TimeSeriesData[], AppError>
  correlateSeries(series1: TimeSeriesData[], series2: TimeSeriesData[]): Result<number, AppError>
}
