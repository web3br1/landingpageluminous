import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { {{SERVICE_NAME}} } from '@/lib/{{SERVICE_PATH}}'
import { createTestDatabase, closeTestDatabase } from '@/tests/__utils__/test-database'
import { mockExternalService } from '@/tests/__mocks__/external-service'

// Setup test database and external services
describe('{{SERVICE_NAME}} Integration', () => {
  let service: {{SERVICE_NAME}}
  let testDb: ReturnType<typeof createTestDatabase>
  let mockService: ReturnType<typeof mockExternalService>

  beforeAll(async () => {
    // Setup test infrastructure
    testDb = await createTestDatabase()
    mockService = mockExternalService()

    // Initialize service with real dependencies
    service = new {{SERVICE_NAME}}({
      database: testDb.connection,
      externalService: mockService.client,
      logger: testDb.logger,
      cache: testDb.cache
    })
  })

  afterAll(async () => {
    // Cleanup test infrastructure
    await closeTestDatabase(testDb)
    await mockService.cleanup()
  })

  beforeEach(async () => {
    // Reset state between tests
    await testDb.reset()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Additional cleanup if needed
    await testDb.cleanup()
  })

  describe('Fluxos Principais', () => {
    it('deve executar fluxo completo de criação', async () => {
      const input = {
        name: 'Test Item',
        description: 'Test Description',
        metadata: { key: 'value' }
      }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data.name).toBe(input.name)

      // Verify database state
      const savedItem = await testDb.findOne('items', { id: result.data.id })
      expect(savedItem).toBeDefined()
      expect(savedItem.name).toBe(input.name)
    })

    it('deve executar fluxo completo de atualização', async () => {
      // First create an item
      const createInput = { name: 'Original Name', description: 'Original Desc' }
      const createResult = await service.create(createInput)
      expect(createResult.success).toBe(true)

      // Then update it
      const updateInput = {
        id: createResult.data.id,
        name: 'Updated Name',
        description: 'Updated Description'
      }

      const updateResult = await service.update(updateInput)

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.name).toBe('Updated Name')

      // Verify external service was called
      expect(mockService.client.notifyUpdate).toHaveBeenCalledWith(
        createResult.data.id,
        expect.objectContaining({ name: 'Updated Name' })
      )
    })

    it('deve executar fluxo completo de exclusão', async () => {
      // Create item first
      const createResult = await service.create({ name: 'Item to Delete' })
      expect(createResult.success).toBe(true)

      // Delete it
      const deleteResult = await service.delete(createResult.data.id)

      expect(deleteResult.success).toBe(true)

      // Verify it's gone from database
      const deletedItem = await testDb.findOne('items', { id: createResult.data.id })
      expect(deletedItem).toBeNull()

      // Verify external service was notified
      expect(mockService.client.notifyDeletion).toHaveBeenCalledWith(createResult.data.id)
    })
  })

  describe('Integração com Banco de Dados', () => {
    it('deve persistir dados corretamente no banco', async () => {
      const input = {
        name: 'Database Test',
        email: 'test@example.com',
        createdAt: new Date()
      }

      await service.create(input)

      // Query database directly to verify persistence
      const persistedData = await testDb.connection
        .collection('items')
        .findOne({ name: 'Database Test' })

      expect(persistedData).toBeDefined()
      expect(persistedData.email).toBe(input.email)
      expect(persistedData.createdAt).toBeInstanceOf(Date)
    })

    it('deve lidar com transações do banco', async () => {
      const input1 = { name: 'Transaction Test 1' }
      const input2 = { name: 'Transaction Test 2' }

      // Simulate transaction failure scenario
      mockService.client.processTransaction.mockRejectedValueOnce(new Error('Transaction failed'))

      const result = await service.createBulk([input1, input2])

      expect(result.success).toBe(false)
      expect(result.error).toContain('Transaction failed')

      // Verify rollback - no items should be persisted
      const count = await testDb.connection.collection('items').countDocuments({
        name: { $in: ['Transaction Test 1', 'Transaction Test 2'] }
      })
      expect(count).toBe(0)
    })
  })

  describe('Integração com Serviços Externos', () => {
    it('deve sincronizar com serviço externo após criação', async () => {
      const input = { name: 'External Sync Test' }

      await service.create(input)

      // Verify external service was called
      expect(mockService.client.syncData).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'External Sync Test',
          syncedAt: expect.any(Date)
        })
      )
    })

    it('deve lidar com falhas temporárias do serviço externo', async () => {
      mockService.client.syncData.mockRejectedValueOnce(new Error('Temporary failure'))

      const input = { name: 'Retry Test' }
      const result = await service.create(input)

      // Should succeed despite external service failure
      expect(result.success).toBe(true)

      // Should retry external call
      expect(mockService.client.syncData).toHaveBeenCalledTimes(2)
    })

    it('deve funcionar offline quando serviço externo está indisponível', async () => {
      mockService.client.syncData.mockRejectedValue(new Error('Service offline'))

      const input = { name: 'Offline Test' }
      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('offlineMode', true)
    })
  })

  describe('Cache Integration', () => {
    it('deve usar cache para leituras frequentes', async () => {
      const input = { name: 'Cache Test' }
      const createResult = await service.create(input)

      // First read should hit database
      const read1 = await service.getById(createResult.data.id)
      expect(read1.success).toBe(true)

      // Second read should hit cache
      const read2 = await service.getById(createResult.data.id)
      expect(read2.success).toBe(true)

      // Verify same data
      expect(read1.data).toEqual(read2.data)

      // Verify cache metrics
      const cacheStats = testDb.cache.getStats()
      expect(cacheStats.hits).toBeGreaterThan(0)
    })

    it('deve invalidar cache após atualizações', async () => {
      const createResult = await service.create({ name: 'Cache Invalidation Test' })

      // Read to populate cache
      await service.getById(createResult.data.id)

      // Update item
      await service.update({
        id: createResult.data.id,
        name: 'Updated Cache Test'
      })

      // Cache should be invalidated
      const cacheKey = `item:${createResult.data.id}`
      expect(testDb.cache.has(cacheKey)).toBe(false)
    })
  })

  describe('Cenários de Concorrência', () => {
    it('deve lidar com múltiplas operações simultâneas', async () => {
      const operations = Array(10).fill().map((_, i) =>
        service.create({ name: `Concurrent Test ${i}` })
      )

      const results = await Promise.all(operations)

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify all items were created
      const count = await testDb.connection.collection('items').countDocuments({
        name: { $regex: /^Concurrent Test/ }
      })
      expect(count).toBe(10)
    })

    it('deve prevenir condições de corrida em atualizações', async () => {
      const createResult = await service.create({ name: 'Race Condition Test', counter: 0 })

      // Simulate concurrent updates
      const updates = Array(5).fill().map(() =>
        service.incrementCounter(createResult.data.id)
      )

      await Promise.all(updates)

      // Final counter should be 5
      const finalItem = await service.getById(createResult.data.id)
      expect(finalItem.data.counter).toBe(5)
    })
  })

  describe('Monitoramento e Observabilidade', () => {
    it('deve registrar métricas de performance', async () => {
      const startTime = Date.now()

      await service.create({ name: 'Metrics Test' })

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Verify metrics were recorded
      const metrics = testDb.logger.getMetrics()
      expect(metrics).toContainEqual(
        expect.objectContaining({
          operation: 'create',
          duration: expect.any(Number),
          success: true
        })
      )
    })

    it('deve registrar logs estruturados', async () => {
      await service.create({ name: 'Logging Test' })

      const logs = testDb.logger.getLogs()
      expect(logs).toContainEqual(
        expect.objectContaining({
          level: 'info',
          message: expect.stringContaining('Item created'),
          operation: 'create',
          itemId: expect.any(String)
        })
      )
    })

    it('deve rastrear erros adequadamente', async () => {
      mockService.client.syncData.mockRejectedValue(new Error('External error'))

      try {
        await service.create({ name: 'Error Tracking Test' })
      } catch (error) {
        // Error should be logged
        const errorLogs = testDb.logger.getErrorLogs()
        expect(errorLogs).toContainEqual(
          expect.objectContaining({
            level: 'error',
            message: expect.stringContaining('External error'),
            operation: 'create'
          })
        )
      }
    })
  })
})
