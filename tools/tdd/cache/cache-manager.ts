/**
 * Cache Manager - LRU + TTL para TDD Analysis
 *
 * Estratégia:
 * - LRU: 10 entradas por domínio
 * - TTL: 60min local, 24h CI
 * - Content hash por domínio
 * - Invalidação seletiva e auditável
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type {
  CacheKey,
  CacheEntry,
  CacheDomain,
  CacheDecision,
  CachePerformance,
  TDDResults
} from '../types.js'

export class CacheManager {
  private cacheDir: string
  private maxEntriesPerDomain = 10
  private ttlLocal = 60 * 60 * 1000 // 60min
  private ttlCI = 24 * 60 * 60 * 1000 // 24h

  constructor(cacheDir = path.join(process.cwd(), 'tmp', 'tdd-cache')) {
    this.cacheDir = cacheDir
    this.ensureCacheDir()
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /**
   * Gera chave de cache baseada nos domínios
   */
  generateKey(branch: string, maturityTarget: string, domains: Record<CacheDomain, string>): CacheKey {
    const environment = this.detectEnvironment()
    const timestamp = Math.floor(Date.now() / (10 * 60 * 1000)) * (10 * 60 * 1000) // Arredonda para 10min

    return {
      branch,
      maturityTarget: maturityTarget as any,
      domains,
      environment,
      timestamp
    }
  }

  /**
   * Detecta se está rodando em CI ou local
   */
  private detectEnvironment(): 'local' | 'ci' {
    return process.env.CI === 'true' ||
           process.env.GITHUB_ACTIONS === 'true' ||
           process.env.GITLAB_CI === 'true' ? 'ci' : 'local'
  }

  /**
   * Serializa chave para string
   */
  keyToString(key: CacheKey): string {
    return `TDD::${key.branch}::${key.maturityTarget}::${Object.values(key.domains).join('::')}::${key.environment}`
  }

  /**
   * Converte string para chave
   */
  stringToKey(keyStr: string): CacheKey | null {
    const parts = keyStr.split('::')
    if (parts.length < 6) return null

    const [prefix, branch, maturityTarget, ...domainHashes] = parts
    const environment = parts[parts.length - 1] as 'local' | 'ci'

    if (prefix !== 'TDD' || !['M0', 'M1', 'M2', 'M3'].includes(maturityTarget)) {
      return null
    }

    const domains: Record<CacheDomain, string> = {
      SRC: domainHashes[0] || '',
      TESTS: domainHashes[1] || '',
      CONFIG: domainHashes[2] || '',
      LOCKFILE: domainHashes[3] || ''
    }

    return {
      branch,
      maturityTarget: maturityTarget as any,
      domains,
      environment,
      timestamp: Date.now() // Placeholder
    }
  }

  /**
   * Busca resultado em cache
   */
  get(key: CacheKey): { entry: CacheEntry | null; decisions: CacheDecision[] } {
    const keyStr = this.keyToString(key)
    const cachePath = path.join(this.cacheDir, `${crypto.createHash('md5').update(keyStr).digest('hex')}.json`)

    const decisions: CacheDecision[] = []

    // Verifica cada domínio
    Object.entries(key.domains).forEach(([domain, hash]) => {
      const domainCachePath = path.join(this.cacheDir, `domain-${domain.toLowerCase()}.json`)

      let hit = false
      let reason: string | undefined

      try {
        if (fs.existsSync(domainCachePath)) {
          const domainCache = JSON.parse(fs.readFileSync(domainCachePath, 'utf8'))
          if (domainCache.hash === hash) {
            hit = true
          } else {
            reason = `Hash changed: ${domainCache.hash.substring(0, 8)} → ${hash.substring(0, 8)}`
          }
        } else {
          reason = 'No cache entry'
        }
      } catch (error) {
        reason = `Cache error: ${error instanceof Error ? error.message : String(error)}`
      }

      decisions.push({
        domain: domain as CacheDomain,
        hit,
        hash,
        reason
      })
    })

    // Se todos os domínios deram hit, tenta carregar resultado completo
    if (decisions.every(d => d.hit)) {
      try {
        if (fs.existsSync(cachePath)) {
          const entry: CacheEntry = JSON.parse(fs.readFileSync(cachePath, 'utf8'))

          // Verifica TTL
          const ttl = key.environment === 'ci' ? this.ttlCI : this.ttlLocal
          const age = Date.now() - new Date(entry.metadata.createdAt).getTime()

          if (age < ttl) {
            return { entry, decisions }
          } else {
            decisions.forEach(d => d.reason = `TTL expired (${Math.round(age / 60000)}min > ${Math.round(ttl / 60000)}min)`)
          }
        }
      } catch (error) {
        decisions.forEach(d => d.reason = `Load error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return { entry: null, decisions }
  }

  /**
   * Salva resultado no cache
   */
  set(key: CacheKey, results: TDDResults, decisions: CacheDecision[]): CachePerformance {
    const startTime = Date.now()
    const keyStr = this.keyToString(key)
    const cachePath = path.join(this.cacheDir, `${crypto.createHash('md5').update(keyStr).digest('hex')}.json`)

    const ttl = key.environment === 'ci' ? this.ttlCI : this.ttlLocal
    const expiresAt = new Date(Date.now() + ttl).toISOString()

    const entry: CacheEntry = {
      key,
      results,
      metadata: {
        createdAt: new Date().toISOString(),
        expiresAt,
        size: JSON.stringify(results).length,
        domainsUsed: Object.keys(key.domains) as CacheDomain[]
      }
    }

    try {
      // Salva resultado completo
      fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2))

      // Salva cache por domínio (para invalidação seletiva)
      Object.entries(key.domains).forEach(([domain, hash]) => {
        const domainCachePath = path.join(this.cacheDir, `domain-${domain.toLowerCase()}.json`)
        fs.writeFileSync(domainCachePath, JSON.stringify({
          hash,
          updatedAt: new Date().toISOString(),
          key: keyStr
        }))
      })

      // Limpa cache antigo (LRU)
      this.cleanupLRU()
    } catch (error) {
      console.warn('Cache write error:', error instanceof Error ? error.message : String(error))
    }

    const domainsHit = decisions.filter(d => d.hit).length
    const domainsTotal = decisions.length

    return {
      totalTime: Date.now() - startTime,
      domainsHit,
      domainsTotal,
      hitRate: domainsTotal > 0 ? domainsHit / domainsTotal : 0
    }
  }

  /**
   * Limpa entradas antigas usando LRU
   */
  private cleanupLRU() {
    try {
      const files = fs.readdirSync(this.cacheDir)
        .filter(f => f.endsWith('.json') && !f.startsWith('domain-'))
        .map(f => ({
          name: f,
          path: path.join(this.cacheDir, f),
          stat: fs.statSync(path.join(this.cacheDir, f))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())

      // Mantém apenas as 10 mais recentes
      if (files.length > this.maxEntriesPerDomain) {
        files.slice(this.maxEntriesPerDomain).forEach(file => {
          try {
            fs.unlinkSync(file.path)
          } catch (error) {
            // Ignora erros de limpeza
          }
        })
      }
    } catch (error) {
      // Ignora erros de limpeza
    }
  }

  /**
   * Invalida cache por domínio
   */
  invalidateDomain(domain: CacheDomain) {
    try {
      const domainCachePath = path.join(this.cacheDir, `domain-${domain.toLowerCase()}.json`)
      if (fs.existsSync(domainCachePath)) {
        fs.unlinkSync(domainCachePath)
      }
    } catch (error) {
      console.warn(`Cache invalidation error for ${domain}:`, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    try {
      const files = fs.readdirSync(this.cacheDir)
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(this.cacheDir, file))
        } catch (error) {
          // Ignora erros individuais
        }
      })
    } catch (error) {
      console.warn('Cache clear error:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Estatísticas do cache
   */
  stats() {
    try {
      const files = fs.readdirSync(this.cacheDir)
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        domains: {} as Record<string, number>
      }

      files.forEach(file => {
        try {
          const filePath = path.join(this.cacheDir, file)
          const fileStat = fs.statSync(filePath)
          stats.totalSize += fileStat.size

          if (file.startsWith('domain-')) {
            const domain = file.replace('domain-', '').replace('.json', '').toUpperCase()
            stats.domains[domain] = (stats.domains[domain] || 0) + 1
          }
        } catch (error) {
          // Ignora erros de estatísticas
        }
      })

      return stats
    } catch (error) {
      return { totalFiles: 0, totalSize: 0, domains: {} }
    }
  }
}
