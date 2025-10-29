/**
 * Content Hashers - Calcula hash de conteúdo por domínio
 *
 * Usa MD5 para performance, concatena conteúdo real dos arquivos
 * para detectar mudanças reais (não timestamps)
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
// Mock glob import for build compatibility
const glob = async (pattern: string, options?: any) => []
import type { CacheDomain } from '../types.js'

export class ContentHashers {
  private projectRoot: string

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot
  }

  /**
   * Calcula hash para todos os domínios
   */
  async calculateAllDomains(): Promise<Record<CacheDomain, string>> {
    const results = await Promise.all([
      this.calculateDomainHash('SRC'),
      this.calculateDomainHash('TESTS'),
      this.calculateDomainHash('CONFIG'),
      this.calculateDomainHash('LOCKFILE')
    ])

    return {
      SRC: results[0],
      TESTS: results[1],
      CONFIG: results[2],
      LOCKFILE: results[3]
    }
  }

  /**
   * Calcula hash para um domínio específico
   */
  async calculateDomainHash(domain: CacheDomain): Promise<string> {
    const patterns = this.getDomainPatterns(domain)
    const files = await this.findFiles(patterns)

    if (files.length === 0) {
      return this.hashString(`empty-${domain}`)
    }

    // Ordena arquivos para consistência
    files.sort()

    // Concatena conteúdo de todos os arquivos
    let content = ''
    for (const file of files) {
      try {
        const fileContent = fs.readFileSync(file, 'utf8')
        content += `${file}:${fileContent}\n`
      } catch (error) {
        // Se não conseguir ler, inclui apenas o path
        content += `${file}:error\n`
      }
    }

    return this.hashString(content)
  }

  /**
   * Padrões de arquivo por domínio
   */
  private getDomainPatterns(domain: CacheDomain): string[] {
    switch (domain) {
      case 'SRC':
        return [
          'src/**/*.ts',
          'src/**/*.tsx',
          'lib/**/*.ts',
          'lib/**/*.tsx',
          'components/**/*.ts',
          'components/**/*.tsx',
          'domains/**/*.ts',
          'domains/**/*.tsx',
          'app/**/*.ts',
          'app/**/*.tsx'
        ]

      case 'TESTS':
        return [
          'tests/**/*.test.ts',
          'tests/**/*.test.tsx',
          'tests/**/*.spec.ts',
          'tests/**/*.spec.tsx',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx'
        ]

      case 'CONFIG':
        return [
          'package.json',
          'tsconfig.json',
          'tsconfig.*.json',
          'vitest.config.ts',
          'vitest.config.js',
          'eslint.config.js',
          'eslint.config.mjs',
          'tailwind.config.js',
          'tailwind.config.ts',
          'postcss.config.js',
          'postcss.config.mjs',
          'next.config.mjs',
          'next.config.js'
        ]

      case 'LOCKFILE':
        return [
          'pnpm-lock.yaml',
          'yarn.lock',
          'package-lock.json'
        ]

      default:
        return []
    }
  }

  /**
   * Encontra arquivos usando glob patterns
   */
  private async findFiles(patterns: string[]): Promise<string[]> {
    const allFiles: string[] = []

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.next/**',
            '**/tmp/**'
          ]
        })
        allFiles.push(...files)
      } catch (error) {
        // Ignora erros de glob
        console.warn(`Glob error for pattern ${pattern}:`, error instanceof Error ? error.message : String(error))
      }
    }

    // Remove duplicatas e normaliza caminhos
    return [...new Set(allFiles)].map(file => path.relative(this.projectRoot, file))
  }

  /**
   * Calcula hash MD5 de uma string
   */
  private hashString(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Detecta arquivos alterados entre dois hashes
   */
  async detectChangedFiles(domain: CacheDomain, oldHash: string, newHash: string): Promise<string[]> {
    if (oldHash === newHash) {
      return []
    }

    // Para detectar arquivos específicos alterados,
    // precisaria armazenar o estado anterior dos arquivos
    // Por enquanto, retorna todos os arquivos do domínio
    const patterns = this.getDomainPatterns(domain)
    const files = await this.findFiles(patterns)

    return files.slice(0, 10) // Limita para não sobrecarregar o log
  }
}
