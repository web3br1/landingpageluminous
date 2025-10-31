import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { {{COMPONENT_NAME}} } from '@/components/{{COMPONENT_PATH}}'
import type { {{COMPONENT_PROPS_TYPE}} } from '@/domains/{{DOMAIN_PATH}}'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) =>
    React.createElement('img', { src, alt, ...props })
}))

// Mock external dependencies
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(' ')
}))

// Mock analytics if needed
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn()
}))

describe('{{COMPONENT_NAME}} Component', () => {
  // Default props for consistent testing
  const defaultProps: {{COMPONENT_PROPS_TYPE}} = {
    id: '{{component-id}}',
    content: {
      title: 'Título de Teste',
      subtitle: 'Subtítulo de teste',
      // Add other required content properties
    },
    variant: 'default',
    tracking: {
      section: '{{component-section}}',
      experimentId: 'test_experiment'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('deve renderizar componente com conteúdo correto', async () => {
      render(<{{COMPONENT_NAME}} {...defaultProps} />)

      expect(screen.getByText(defaultProps.content.title!)).toBeInTheDocument()
      expect(screen.getByText(defaultProps.content.subtitle!)).toBeInTheDocument()
    })

    it('deve aplicar classes CSS corretas e atributos de dados', () => {
      render(<{{COMPONENT_NAME}} {...defaultProps} />)

      const element = document.querySelector('#{{component-id}}')
      expect(element).toHaveAttribute('id', '{{component-id}}')
      expect(element).toHaveAttribute('data-section', '{{component-section}}')
    })

    it('deve renderizar com variante personalizada', () => {
      render(<{{COMPONENT_NAME}} {...defaultProps} variant="enterprise" />)

      // Add variant-specific assertions
      expect(document.querySelector('[data-variant="enterprise"]')).toBeInTheDocument()
    })
  })

  describe('Interações', () => {
    it('deve chamar handler quando ação primária é executada', async () => {
      const mockHandler = vi.fn()
      const user = userEvent.setup()

      render(<{{COMPONENT_NAME}} {...defaultProps} onPrimaryAction={mockHandler} />)

      const button = screen.getByRole('button', { name: /ação primária/i })
      await user.click(button)

      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it('deve suportar navegação por teclado', async () => {
      const user = userEvent.setup()
      render(<{{COMPONENT_NAME}} {...defaultProps} />)

      const interactiveElement = screen.getByRole('button')
      interactiveElement.focus()

      expect(interactiveElement).toHaveFocus()

      await user.keyboard('{Tab}')
      // Add focus management assertions
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter hierarquia de cabeçalhos correta', () => {
      render(<{{COMPONENT_NAME}} {...defaultProps} />)

      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)

      // Check heading hierarchy
      headings.forEach((heading, index) => {
        if (index === 0) {
          expect(heading.tagName).toMatch(/H[1-6]/)
        }
      })
    })

    it('deve ter botões acessíveis com labels apropriadas', () => {
      render(<{{COMPONENT_NAME}} {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Estados Edge', () => {
    it('deve lidar com conteúdo vazio graciosamente', () => {
      const emptyProps = {
        ...defaultProps,
        content: {}
      }

      expect(() => {
        render(<{{COMPONENT_NAME}} {...emptyProps} />)
      }).not.toThrow()
    })

    it('deve lidar com propriedades undefined', () => {
      const undefinedProps = {
        ...defaultProps,
        optionalProp: undefined
      }

      expect(() => {
        render(<{{COMPONENT_NAME}} {...undefinedProps} />)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('não deve causar re-renders desnecessários', () => {
      const renderSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { rerender } = render(<{{COMPONENT_NAME}} {...defaultProps} />)

      // Re-render with same props
      rerender(<{{COMPONENT_NAME}} {...defaultProps} />)

      // Add performance assertions
      renderSpy.mockRestore()
    })
  })
})
