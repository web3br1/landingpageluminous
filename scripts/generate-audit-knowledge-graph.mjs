#!/usr/bin/env node

/**
 * GERADOR DE GRAFO DE CONHECIMENTO DE AUDITORIA
 * Transforma achados isolados em rede de relacionamentos
 */

import fs from 'fs';
import path from 'path';

const REPORT_PATH = path.join(process.cwd(), 'quality-history', '2025-10-31-integrations-audit.json');

if (!fs.existsSync(REPORT_PATH)) {
  console.error('❌ Relatório de auditoria não encontrado');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

console.log('🕸️  GERANDO GRAFO DE CONHECIMENTO DE AUDITORIA');
console.log('='.repeat(60));

// 1. Coletar todos os nós (achados)
const nodes = [];
const edges = [];

// Processar rotas inativas
if (report.findings.routes?.inactiveEndpoints) {
  report.findings.routes.inactiveEndpoints.forEach((route, index) => {
    const nodeId = `route_${index}`;
    nodes.push({
      id: nodeId,
      type: 'route',
      label: route.route,
      intent: route.intent,
      family: route.categories?.family || 'unknown',
      severity: route.severity,
      owner: route.owner
    });

    // Criar relacionamentos baseados em sinais
    if (route.signals?.hasRealLogic) {
      // Rota depende de lógica real
      const logicNodeId = `logic_${index}`;
      nodes.push({
        id: logicNodeId,
        type: 'logic',
        label: 'Lógica Real',
        intent: 'EM_ANDAMENTO'
      });

      edges.push({
        source: nodeId,
        target: logicNodeId,
        type: 'depends_on',
        strength: 0.8,
        description: 'Rota implementa lógica de negócio'
      });
    }

    if (route.signals?.hasSecurityCheck) {
      // Rota tem verificação de segurança
      const securityNodeId = `security_${index}`;
      nodes.push({
        id: securityNodeId,
        type: 'security',
        label: 'Verificação de Segurança',
        intent: 'EM_ANDAMENTO'
      });

      edges.push({
        source: nodeId,
        target: securityNodeId,
        type: 'depends_on',
        strength: 0.9,
        description: 'Rota inclui controles de segurança'
      });
    }

    // Relacionamentos entre rotas do mesmo owner
    report.findings.routes.inactiveEndpoints.forEach((otherRoute, otherIndex) => {
      if (index !== otherIndex && route.owner === otherRoute.owner) {
        edges.push({
          source: nodeId,
          target: `route_${otherIndex}`,
          type: 'relates_to',
          strength: 0.3,
          description: `Mesmo owner: ${route.owner}`
        });
      }
    });
  });
}

// Processar exports não utilizados
if (report.findings.code?.unusedExports) {
  report.findings.code.unusedExports.forEach((exportItem, index) => {
    const nodeId = `export_${index}`;
    nodes.push({
      id: nodeId,
      type: 'export',
      label: exportItem.symbol,
      intent: 'OBSOLETO',
      family: 'structural_orphaned',
      severity: exportItem.severity,
      file: exportItem.files?.[0]
    });

    // Exports podem estar relacionados a rotas ou outros componentes
    if (exportItem.files?.[0]?.includes('page.tsx')) {
      // É uma página não utilizada
      const pageNodeId = `page_${index}`;
      nodes.push({
        id: pageNodeId,
        type: 'page',
        label: 'Página Next.js',
        intent: 'OBSOLETO'
      });

      edges.push({
        source: nodeId,
        target: pageNodeId,
        type: 'belongs_to',
        strength: 0.7,
        description: 'Export pertence a página não utilizada'
      });
    }
  });
}

// 2. Análise de padrões
console.log('\n📊 ANÁLISE DE PADRÕES IDENTIFICADOS:');
console.log('-'.repeat(40));

// Padrão 1: Agrupamento por owner
const ownerGroups = {};
nodes.forEach(node => {
  if (node.owner) {
    if (!ownerGroups[node.owner]) {
      ownerGroups[node.owner] = [];
    }
    ownerGroups[node.owner].push(node);
  }
});

console.log('👥 AGRUPAMENTO POR OWNER:');
Object.entries(ownerGroups).forEach(([owner, items]) => {
  console.log(`  ${owner}: ${items.length} itens`);
  const intents = {};
  items.forEach(item => {
    intents[item.intent] = (intents[item.intent] || 0) + 1;
  });
  console.log(`    Intents: ${Object.entries(intents).map(([intent, count]) => `${intent}(${count})`).join(', ')}`);
});

// Padrão 2: Agrupamento por família
const familyGroups = {};
nodes.forEach(node => {
  const family = node.family || 'unknown';
  if (!familyGroups[family]) {
    familyGroups[family] = [];
  }
  familyGroups[family].push(node);
});

console.log('\n🏗️ AGRUPAMENTO POR FAMÍLIA:');
Object.entries(familyGroups).forEach(([family, items]) => {
  console.log(`  ${family}: ${items.length} itens`);
  const types = {};
  items.forEach(item => {
    types[item.type] = (types[item.type] || 0) + 1;
  });
  console.log(`    Tipos: ${Object.entries(types).map(([type, count]) => `${type}(${count})`).join(', ')}`);
});

// Padrão 3: Cadeias de dependência
console.log('\n🔗 CADEIAS DE DEPENDÊNCIA:');
const dependencyChains = edges.filter(edge => edge.type === 'depends_on');
console.log(`  Total de dependências identificadas: ${dependencyChains.length}`);

dependencyChains.forEach((edge, index) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (sourceNode && targetNode) {
    console.log(`  ${index + 1}. ${sourceNode.label} → ${targetNode.label}`);
    console.log(`     Força: ${(edge.strength * 100).toFixed(0)}%, Tipo: ${edge.type}`);
  }
});

// 3. Insights de governança
console.log('\n🎯 INSIGHTS DE GOVERNANÇA:');
console.log('-'.repeat(30));

const totalNodes = nodes.length;
const totalEdges = edges.length;
const density = totalEdges / (totalNodes * (totalNodes - 1) / 2);

console.log(`📈 Densidade da rede: ${(density * 100).toFixed(2)}%`);
console.log(`🕸️ Nós identificados: ${totalNodes}`);
console.log(`🔗 Relacionamentos: ${totalEdges}`);

// Insight sobre concentração
const intentDistribution = {};
nodes.forEach(node => {
  const intent = node.intent || 'UNKNOWN';
  intentDistribution[intent] = (intentDistribution[intent] || 0) + 1;
});

console.log('\n📊 DISTRIBUIÇÃO POR INTENÇÃO:');
Object.entries(intentDistribution).forEach(([intent, count]) => {
  const percentage = ((count / totalNodes) * 100).toFixed(1);
  console.log(`  ${intent}: ${count} (${percentage}%)`);
});

// 4. Salvar grafo como JSON
const graphData = {
  metadata: {
    generated_at: new Date().toISOString(),
    total_nodes: totalNodes,
    total_edges: totalEdges,
    network_density: density,
    patterns_identified: [
      'owner_grouping',
      'family_clustering',
      'dependency_chains',
      'intent_distribution'
    ]
  },
  nodes: nodes,
  edges: edges,
  insights: {
    owner_concentration: Object.keys(ownerGroups).length,
    family_diversity: Object.keys(familyGroups).length,
    dependency_complexity: dependencyChains.length,
    intent_balance: intentDistribution
  }
};

const graphPath = path.join(path.dirname(REPORT_PATH), '2025-10-31-knowledge-graph.json');
fs.writeFileSync(graphPath, JSON.stringify(graphData, null, 2));

console.log(`\n💾 Grafo salvo em: ${graphPath}`);

// 5. Relatório de governança
const governanceReport = `# 🕸️ RELATÓRIO DE GRAFO DE CONHECIMENTO
**Data:** ${new Date().toLocaleDateString('pt-BR')}

## 📊 MÉTRICAS DA REDE
- **Nós:** ${totalNodes}
- **Relacionamentos:** ${totalEdges}
- **Densidade:** ${(density * 100).toFixed(2)}%

## 🎯 PADRÕES IDENTIFICADOS

### Agrupamento por Owner
${Object.entries(ownerGroups).map(([owner, items]) => `- **${owner}**: ${items.length} itens`).join('\n')}

### Agrupamento por Família
${Object.entries(familyGroups).map(([family, items]) => `- **${family}**: ${items.length} itens`).join('\n')}

### Cadeias de Dependência
${dependencyChains.slice(0, 5).map((edge, i) => {
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);
  return `${i+1}. ${source?.label || 'Unknown'} → ${target?.label || 'Unknown'}`;
}).join('\n')}

## 💡 INSIGHTS PRINCIPAIS

1. **Concentração de Ownership:** ${Object.keys(ownerGroups).length} owners gerenciando ${totalNodes} itens
2. **Interconexão:** ${(density * 100).toFixed(1)}% da rede tem relacionamentos
3. **Distribuição de Intenção:** ${Object.entries(intentDistribution).map(([intent, count]) => `${intent}: ${count}`).join(', ')}

## 🎯 RECOMENDAÇÕES

- **Foco em owners:** ${Object.keys(ownerGroups).sort((a,b) => ownerGroups[b].length - ownerGroups[a].length)[0] || 'Desconhecido'} tem mais itens para gerenciar
- **Quebrar cadeias:** ${dependencyChains.length} dependências identificadas podem ser otimizadas
- **Balanceamento:** ${Object.entries(intentDistribution).filter(([intent, count]) => count > totalNodes * 0.3).map(([intent]) => intent).join(', ')} dominam a distribuição

---
*Grafo gerado automaticamente - Use ferramentas como Cytoscape ou D3.js para visualização*
`;

const governancePath = path.join(path.dirname(REPORT_PATH), '2025-10-31-governance-graph-report.md');
fs.writeFileSync(governancePath, governanceReport);

console.log(`📋 Relatório de governança salvo em: ${governancePath}`);
console.log('\n✅ GRAFO DE CONHECIMENTO GERADO COM SUCESSO!');
