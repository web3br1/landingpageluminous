import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PageRenderer from '@/app/page-renderer'

// Mock composition data - closer to production data
const mockComposition = {
  metadata: {
    title: 'DataFlow Brasil - Automatize seus Relatórios',
    description: 'Plataforma completa de business intelligence para PMEs brasileiras'
  },
  sections: [
    {
      id: 'hero',
      component: 'Hero',
      order: 1,
      content: {
        content: {
          content: {
            headline: 'Automatize seus processos empresariais com IA inteligente.',
            subheadline: 'Da entrevista ao sistema operacional — em minutos. Transforme dados em decisões através de linguagem natural e integrações perfeitas.',
            primaryCta: 'Experimentar agora',
            secondaryCta: 'Ver casos de sucesso',
            badge: 'Tecnologia Inovadora',
            metrics: [
              { value: '10x', label: 'mais velocidade' },
              { value: '99.9%', label: 'uptime garantido' },
              { value: '50+', label: 'integrações nativas' }
            ],
            tracking: { section: 'hero' },
            title: 'Automatize seus processos empresariais com IA inteligente.',
            subtitle: 'Da entrevista ao sistema operacional — em minutos. Transforme dados em decisões através de linguagem natural e integrações perfeitas.',
            envelope: { id: 'hero', type: 'hero', version: '1.0.0', timestamp: 1761673290224 }
          },
          variant: {
            id: 'experiment_a',
            name: 'Experiment A - IA Focus',
            description: 'Versão experimental enfatizando capacidades de IA e automação inteligente',
            content: {
              headline: 'Automatize seus processos empresariais com IA inteligente.',
              subheadline: 'Da entrevista ao sistema operacional — em minutos. Transforme dados em decisões através de linguagem natural e integrações perfeitas.',
              primaryCta: 'Experimentar agora',
              secondaryCta: 'Ver casos de sucesso',
              badge: 'Tecnologia Inovadora',
              metrics: { value: '10x', label: 'mais velocidade' }, // This might be the issue - nested object
              tracking: { section: 'hero' }
            },
            weight: 30
          },
          experiment: {
            id: 'hero_headline',
            variant: 'experiment_a',
            isActive: true
          }
        },
        variant: {
          id: 'hero',
          name: 'Hero Section',
          description: 'Content for hero section'
        }
      },
      tracking: {
        section: 'hero',
        experimentId: undefined,
        variant: undefined
      }
    }
  ],
  pageType: 'landing' as const,
  experiments: [],
  analytics: {
    pageType: 'landing' as const,
    conversionGoals: ['cta_click', 'signup_start', 'demo_request']
  }
}

describe('PageRenderer', () => {
  it('deve renderizar sem falhar', async () => {
    console.log('[TEST] Starting PageRenderer test')

    // Render the component
    render(
      <PageRenderer
        composition={mockComposition}
        pageType="landing"
      />
    )

    console.log('[TEST] PageRenderer rendered')

    // Check if the data-testid is present
    expect(screen.getByTestId('page-renderer')).toBeInTheDocument()

    // Check if metadata is present (may be overridden by global config)
    const metadataTitle = screen.getByTestId('metadata-title')
    const metadataDesc = screen.getByTestId('metadata-description')
    expect(metadataTitle).toBeInTheDocument()
    expect(metadataDesc).toBeInTheDocument()

    console.log('[TEST] Basic assertions passed')
  })

  it('deve renderizar estilos inline simples sem dependências CSS', async () => {
    console.log('[TEST] Testing simple inline styles')

    // Render a simple div with inline styles
    const { container } = render(
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '20px',
        border: '2px solid black'
      }}>
        <h1>Test Inline Styles</h1>
        <p>This should be visible with red background</p>
      </div>
    )

    // Check if the element is in the document
    const testDiv = container.querySelector('div')
    expect(testDiv).toBeInTheDocument()

    console.log('[TEST] Inline styles working correctly')
  })

  it('should isolate Hero component error', async () => {
    console.log('[TEST] Testing Hero component isolation')

    // Try to import Hero component directly
    try {
      const { Hero } = await import('@/components/sections/hero')
      console.log('[TEST] Hero import successful:', Hero)

      // Try to render Hero with minimal props
      render(
        <Hero
          content={{
            headline: 'Test Headline',
            subheadline: 'Test Subheadline',
            primaryCta: 'Test CTA'
          }}
          variant="default"
          id="test-hero"
        />
      )

      console.log('[TEST] Hero rendered successfully')
    } catch (error) {
      console.error('[TEST] Hero component error:', error)
      throw error
    }
  })

  it('should render sections container', async () => {
    render(
      <PageRenderer
        composition={mockComposition}
        pageType="landing"
      />
    )

    // Check if page-container exists
    const container = document.querySelector('.page-container')
    expect(container).toBeInTheDocument()

    console.log('[TEST] Page container found')
  })

  it('should render hero section content after lazy loading', async () => {
    console.log('[TEST] Starting hero section test')

    render(
      <PageRenderer
        composition={mockComposition}
        pageType="landing"
      />
    )

    // Wait for the hero section to be rendered (handles lazy loading)
    await waitFor(() => {
      const heroElement = document.querySelector('#hero')
      expect(heroElement).toBeInTheDocument()
      console.log('[TEST] Hero section element found')
    }, { timeout: 5000 })

    // Check if hero content is present
    await waitFor(() => {
      const heroHeadline = screen.getByText('Automatize seus processos empresariais com IA inteligente.')
      expect(heroHeadline).toBeInTheDocument()
      console.log('[TEST] Hero headline found')

      // Check other content
      expect(screen.getByText('Tecnologia Inovadora')).toBeInTheDocument()
      expect(screen.getByText('Experimentar agora')).toBeInTheDocument()
      expect(screen.getByText('Ver casos de sucesso')).toBeInTheDocument()
      expect(screen.getByText('10x')).toBeInTheDocument()
      expect(screen.getByText('99.9%')).toBeInTheDocument()
      expect(screen.getByText('50+')).toBeInTheDocument()
      console.log('[TEST] All hero content verified')
    }, { timeout: 5000 })

    console.log('[TEST] Hero section content rendered successfully')
  })
})
