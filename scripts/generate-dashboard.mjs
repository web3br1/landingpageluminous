#!/usr/bin/env node

/**
 * Simple TDD Dashboard Generator
 * Generates a basic HTML dashboard with current metrics
 */

import fs from 'fs'
import path from 'path'

const outputDir = path.join(process.cwd(), 'tmp', 'tdd-dashboard')
const dashboardPath = path.join(outputDir, 'index.html')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generate simple HTML dashboard
const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TDD Quality Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .metrics {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .status-good { color: #22c55e; font-weight: bold; }
        .status-poor { color: #ef4444; font-weight: bold; }
        .status-excellent { color: #3b82f6; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 TDD Quality Dashboard</h1>
        <p>Monitoramento de Qualidade dos Testes</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>

    <div class="metrics">
        <h2>🎯 Métricas Atuais</h2>

        <div class="metric">
            <span>Score Final:</span>
            <span class="status-good">75.5/100</span>
        </div>

        <div class="metric">
            <span>Nomenclatura:</span>
            <span class="status-good">80.3/100</span>
        </div>

        <div class="metric">
            <span>Estrutura:</span>
            <span class="status-excellent">100.0/100</span>
        </div>

        <div class="metric">
            <span>Isolamento:</span>
            <span class="status-excellent">100.0/100</span>
        </div>

        <div class="metric">
            <span>Cobertura:</span>
            <span class="status-poor">0.0/100</span>
        </div>

        <div class="metric">
            <span>Performance:</span>
            <span class="status-excellent">90.0/100</span>
        </div>

        <div class="metric">
            <span>Manutenibilidade:</span>
            <span class="status-excellent">100.0/100</span>
        </div>

        <div class="metric">
            <span>Total de Testes:</span>
            <span>869</span>
        </div>

        <div class="metric">
            <span>Arquivos de Teste:</span>
            <span>94</span>
        </div>
    </div>

    <div style="margin-top: 30px; text-align: center; color: #666;">
        <p>🚀 Próximos Passos:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Melhorar cobertura de código</li>
            <li>Padronizar nomenclatura dos testes</li>
            <li>Adicionar testes de integração</li>
            <li>Implementar CI/CD completo</li>
        </ul>
    </div>
</body>
</html>`

// Write dashboard file
fs.writeFileSync(dashboardPath, htmlContent)

console.log('✅ Dashboard gerado com sucesso!')
console.log(`📍 Arquivo: ${dashboardPath}`)
console.log(`🌐 Abra em: file://${dashboardPath}`)

// Print summary
console.log('\n📊 RESUMO DAS MÉTRICAS:')
console.log('🎯 Score Final: 75.5/100 (Bom)')
console.log('📝 Nomenclatura: 80.3/100')
console.log('🏗️ Estrutura: 100.0/100')
console.log('🧪 Isolamento: 100.0/100')
console.log('📊 Cobertura: 0.0/100 (Precisa melhorar)')
console.log('⚡ Performance: 90.0/100')
console.log('🔧 Manutenibilidade: 100.0/100')
