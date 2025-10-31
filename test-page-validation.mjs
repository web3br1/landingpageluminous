#!/usr/bin/env node

/**
 * Test Page Composition Validation
 * Tests the final page composition validation that's failing
 */

import fs from 'fs';
import path from 'path';

// Mock a simple page composition to test validation
const mockComposition = {
  sections: [
    {
      id: "hero",
      content: {
        content: {
          headline: "Test Headline",
          subheadline: "Test Subheadline",
          primaryCta: "Test CTA"
        },
        variant: {
          id: "default",
          name: "Default",
          description: "Default variant"
        }
      },
      enabled: true,
      order: 0
    },
    {
      id: "benefits",
      content: {
        content: {
          title: "Test Benefits",
          subtitle: "Test Subtitle",
          benefits: [
            {
              icon: "Zap",
              title: "Test Benefit",
              description: "Test description",
              metric: "Test metric"
            }
          ]
        },
        variant: {
          id: "default",
          name: "Default",
          description: "Default variant"
        }
      },
      enabled: true,
      order: 1
    }
  ],
  metadata: {
    title: "Test Page",
    description: "Test description",
    keywords: ["test"],
    ogImage: "test.jpg"
  },
  experiments: []
};

console.log('🔍 Testing page composition validation...\n');

// Check if composition matches expected schema
console.log('📋 Checking composition structure:');
console.log(`   ✓ Has sections array: ${Array.isArray(mockComposition.sections)}`);
console.log(`   ✓ Has metadata: ${!!mockComposition.metadata}`);
console.log(`   ✓ Has experiments: ${Array.isArray(mockComposition.experiments)}`);

console.log(`\n📊 Sections count: ${mockComposition.sections.length}`);
mockComposition.sections.forEach((section, index) => {
  console.log(`   ${index + 1}. ${section.id}: enabled=${section.enabled}, order=${section.order}, hasContent=${!!section.content}`);
});

console.log('\n🔍 Metadata check:');
console.log(`   ✓ Title: ${!!mockComposition.metadata.title}`);
console.log(`   ✓ Description: ${!!mockComposition.metadata.description}`);
console.log(`   ✓ Keywords: ${Array.isArray(mockComposition.metadata.keywords)}`);
console.log(`   ✓ OG Image: ${!!mockComposition.metadata.ogImage}`);

console.log('\n💡 The validation might be failing because:');
console.log('   1. Missing required fields in sections');
console.log('   2. Content structure doesn\'t match ComposedEnvelopeSchema');
console.log('   3. Metadata missing required fields');
console.log('   4. Schema validation issues');

// Test with the actual schema structure from logs
const realComposition = {
  sections: [
    {
      id: "hero",
      content: {
        content: {
          headline: "Sistema Temporariamente Indisponível",
          subheadline: "Estamos trabalhando para restaurar o serviço. Tente novamente em alguns minutos.",
          primaryCta: "Tentar Novamente"
        },
        variant: {
          id: "default",
          name: "Default",
          description: "Default variant"
        }
      },
      enabled: true,
      order: 0
    },
    {
      id: "benefits",
      content: {
        content: {
          title: "Resultados que você pode medir",
          subtitle: "Veja como nossa plataforma transforma dados em vantagem competitiva",
          benefits: [
            {
              icon: "Zap",
              title: "75% menos tempo em relatórios",
              description: "De dias para minutos: automatize a geração de relatórios...",
              metric: "De 2 dias para 30 min"
            }
          ]
        },
        variant: {
          id: "default",
          name: "Default",
          description: "Default variant"
        }
      },
      enabled: true,
      order: 1
    }
  ],
  metadata: {
    title: "Landing Page",
    description: "Description",
    keywords: ["keyword"],
    ogImage: "image.jpg"
  },
  experiments: [],
  analytics: {
    pageType: "landing",
    conversionGoals: ["cta_click", "form_submit"]
  }
};

console.log('\n🔍 Testing with real-like composition from logs:');

// Check for common issues
const issues = [];

// Check if composition has extra fields
const expectedFields = ['sections', 'metadata', 'experiments', 'analytics'];
const actualFields = Object.keys(realComposition);
const extraFields = actualFields.filter(f => !expectedFields.includes(f));

if (extraFields.length > 0) {
  issues.push(`Extra fields found: ${extraFields.join(', ')}`);
}

// Check sections structure
if (!realComposition.sections.every(s => s.id)) {
  issues.push('Some sections missing id');
}

if (!realComposition.sections.every(s => s.content)) {
  issues.push('Some sections missing content');
}

if (!realComposition.sections.every(s => typeof s.enabled === 'boolean')) {
  issues.push('Some sections missing enabled field');
}

if (!realComposition.sections.every(s => typeof s.order === 'number')) {
  issues.push('Some sections missing order field');
}

// Check metadata
if (!realComposition.metadata.title) {
  issues.push('Missing metadata.title');
}

if (!realComposition.metadata.description) {
  issues.push('Missing metadata.description');
}

if (!Array.isArray(realComposition.metadata.keywords)) {
  issues.push('Missing or invalid metadata.keywords');
}

// Check analytics
if (!realComposition.analytics.pageType) {
  issues.push('Missing analytics.pageType');
}

if (!Array.isArray(realComposition.analytics.conversionGoals)) {
  issues.push('Missing or invalid analytics.conversionGoals');
}

if (issues.length > 0) {
  console.log('\n❌ ISSUES FOUND:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('\n✅ Basic structure looks correct');
}

console.log('\n📝 Mock composition JSON:');
console.log(JSON.stringify(mockComposition, null, 2));
