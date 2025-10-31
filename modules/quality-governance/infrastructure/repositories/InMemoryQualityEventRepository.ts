import { Result } from '@shared/errors'
import { AppError } from '@shared/errors'
import { QualityEvent } from '../../domain/entities/QualityEvent'
import { QualityEventRepository } from '../../domain/ports/QualityEventRepository'

export class InMemoryQualityEventRepository implements QualityEventRepository {
  private events: Map<string, QualityEvent> = new Map()

  async save(event: QualityEvent): Promise<Result<void, AppError>> {
    try {
      this.events.set(event.id, event)
      return Result.ok(undefined)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to save quality event', { error }))
    }
  }

  async findById(id: string): Promise<Result<QualityEvent | null, AppError>> {
    try {
      const event = this.events.get(id) || null
      return Result.ok(event)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find quality event', { error }))
    }
  }

  async findByCategory(category: string, limit?: number): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .filter(event => event.category === category)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      const result = limit ? events.slice(0, limit) : events
      return Result.ok(result)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find events by category', { error }))
    }
  }

  async findByOwner(owner: string, limit?: number): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .filter(event => event.owner === owner)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      const result = limit ? events.slice(0, limit) : events
      return Result.ok(result)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find events by owner', { error }))
    }
  }

  async findByFilePath(filePath: string): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .filter(event => event.filePath === filePath)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      return Result.ok(events)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find events by file path', { error }))
    }
  }

  async findUnresolved(): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .filter(event => !event.resolved)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      return Result.ok(events)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find unresolved events', { error }))
    }
  }

  async findByTimeRange(start: Date, end: Date): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .filter(event => event.timestamp >= start && event.timestamp <= end)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      return Result.ok(events)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to find events by time range', { error }))
    }
  }

  async countByCategory(category: string): Promise<Result<number, AppError>> {
    try {
      const count = Array.from(this.events.values())
        .filter(event => event.category === category)
        .length

      return Result.ok(count)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to count events by category', { error }))
    }
  }

  async getRecentEvents(limit: number): Promise<Result<QualityEvent[], AppError>> {
    try {
      const events = Array.from(this.events.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)

      return Result.ok(events)
    } catch (error) {
      return Result.err(AppError.unexpected('Failed to get recent events', { error }))
    }
  }

  // Utility methods for testing
  clear(): void {
    this.events.clear()
  }

  getAll(): QualityEvent[] {
    return Array.from(this.events.values())
  }
}
