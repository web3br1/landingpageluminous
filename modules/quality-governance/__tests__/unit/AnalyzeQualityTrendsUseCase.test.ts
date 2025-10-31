import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalyzeQualityTrendsUseCase } from '../../application/use-cases/AnalyzeQualityTrendsUseCase'
import { QualityEventRepository } from '../../domain/ports/QualityEventRepository'
import { TemporalAnalyzer, TimeSeriesData } from '../../domain/ports/TemporalAnalyzer'
import { QualityEvent } from '../../domain/entities/QualityEvent'
import { InMemoryQualityEventRepository } from '../../infrastructure/repositories/InMemoryQualityEventRepository'
import { SimpleTemporalAnalyzer } from '../../infrastructure/services/SimpleTemporalAnalyzer'

describe('AnalyzeQualityTrendsUseCase', () => {
  let useCase: AnalyzeQualityTrendsUseCase
  let eventRepository: QualityEventRepository
  let temporalAnalyzer: TemporalAnalyzer

  beforeEach(() => {
    eventRepository = new InMemoryQualityEventRepository()
    temporalAnalyzer = new SimpleTemporalAnalyzer()
    useCase = new AnalyzeQualityTrendsUseCase(eventRepository, temporalAnalyzer)
  })

  it('should analyze quality trends successfully', async () => {
    // Arrange
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-07')

    // Create some test events
    const events = [
      QualityEvent.create({
        category: 'structural_orphaned',
        severity: 'medium',
        filePath: 'src/components/Button.tsx',
        message: 'Unused import',
        context: {},
        owner: 'developer1',
        resolved: false
      }),
      QualityEvent.create({
        category: 'refactor_incomplete',
        severity: 'low',
        filePath: 'src/utils/helpers.ts',
        message: 'Incomplete refactoring',
        context: {},
        owner: 'developer2',
        resolved: true
      })
    ]

    // Save events
    for (const event of events) {
      if (event.isOk()) {
        await eventRepository.save(event.value)
      }
    }

    // Act
    const result = await useCase.execute({
      startDate,
      endDate,
      windowDays: 7
    })

    // Assert
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const analysis = result.value
      expect(analysis).toHaveProperty('overall')
      expect(analysis).toHaveProperty('byCategory')
      expect(analysis).toHaveProperty('byOwner')
      expect(analysis).toHaveProperty('anomalies')
      expect(analysis).toHaveProperty('predictions')

      expect(analysis.overall).toHaveProperty('direction')
      expect(analysis.overall).toHaveProperty('slope')
      expect(analysis.overall).toHaveProperty('forecast')
      expect(Array.isArray(analysis.overall.forecast)).toBe(true)
    }
  })

  it('should filter events by categories', async () => {
    // Arrange
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-07')

    const events = [
      QualityEvent.create({
        category: 'structural_orphaned',
        severity: 'medium',
        filePath: 'file1.ts',
        message: 'Test',
        context: {},
        owner: 'dev1',
        resolved: false
      }),
      QualityEvent.create({
        category: 'pattern_violation',
        severity: 'high',
        filePath: 'file2.ts',
        message: 'Test',
        context: {},
        owner: 'dev2',
        resolved: false
      })
    ]

    for (const event of events) {
      if (event.isOk()) {
        await eventRepository.save(event.value)
      }
    }

    // Act
    const result = await useCase.execute({
      startDate,
      endDate,
      categories: ['structural_orphaned']
    })

    // Assert
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.byCategory).toHaveProperty('structural_orphaned')
      expect(result.value.byCategory).not.toHaveProperty('pattern_violation')
    }
  })

  it('should handle empty data gracefully', async () => {
    // Arrange
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-07')

    // Act
    const result = await useCase.execute({
      startDate,
      endDate
    })

    // Assert
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.overall.direction).toBe('stable')
      expect(result.value.anomalies).toHaveLength(0)
    }
  })

  it('should detect anomalies in data', async () => {
    // Arrange
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-10')

    // Create events with normal pattern and one anomaly
    const baseDate = new Date('2025-01-01')
    const events = []

    for (let i = 0; i < 7; i++) {
      const eventDate = new Date(baseDate)
      eventDate.setDate(baseDate.getDate() + i)

      const event = QualityEvent.create({
        category: 'structural_orphaned',
        severity: 'medium',
        filePath: `file${i}.ts`,
        message: 'Normal issue',
        context: {},
        owner: 'dev1',
        resolved: false,
        timestamp: eventDate
      })

      if (event.isOk()) {
        // Manually set timestamp for testing
        const eventObj = event.value as any
        eventObj.props.timestamp = eventDate
        events.push(event.value)
      }
    }

    // Add anomaly (many events on one day)
    for (let i = 0; i < 10; i++) {
      const event = QualityEvent.create({
        category: 'structural_orphaned',
        severity: 'medium',
        filePath: `anomaly${i}.ts`,
        message: 'Anomaly issue',
        context: {},
        owner: 'dev1',
        resolved: false,
        timestamp: new Date('2025-01-08')
      })

      if (event.isOk()) {
        const eventObj = event.value as any
        eventObj.props.timestamp = new Date('2025-01-08')
        events.push(event.value)
      }
    }

    for (const event of events) {
      await eventRepository.save(event)
    }

    // Act
    const result = await useCase.execute({
      startDate,
      endDate
    })

    // Assert
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.anomalies.length).toBeGreaterThan(0)
    }
  })
})
