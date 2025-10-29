"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import { AccessibleSpinner } from "./accessibility-manager";
import { useAccessibleLoading } from "./use-accessible-loading";

interface AccessibleSectionProps {
  id: string;
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  className?: string;
  ariaLabel?: string;
  role?: string;
}

/**
 * Componente de seção acessível com heading apropriado e estados de loading/error
 */
export function AccessibleSection({
  id,
  heading,
  headingLevel = 2,
  children,
  loading = false,
  error = null,
  className = "",
  ariaLabel,
  role,
}: AccessibleSectionProps) {
  const { isLoading, error: loadingError } = useAccessibleLoading({
    loadingText: `Carregando seção ${heading}`,
    errorText: `Erro ao carregar seção ${heading}`,
  });

  // Use provided error or loading state
  const showLoading = loading || isLoading;
  const showError = error || loadingError;

  const HeadingTag = `h${headingLevel}` as keyof React.JSX.IntrinsicElements;

  return (
    <section
      id={id}
      className={`accessible-section ${className}`}
      aria-label={ariaLabel}
      role={role}
      aria-labelledby={`${id}-heading`}
      aria-busy={showLoading}
      aria-live={showError ? "assertive" : "off"}
    >
      <header className="section-header">
        <HeadingTag id={`${id}-heading`} className="section-heading">
          {heading}
        </HeadingTag>
      </header>

      <div className="section-content">
        {showError ? (
          <div className="section-error" role="alert" aria-live="assertive">
            <p>{showError}</p>
            <button
              onClick={() => {
                // SSR safety: only run on client-side
                if (typeof window !== "undefined" && window.location) {
                  window.location.reload();
                }
              }}
              className="error-retry-button"
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : showLoading ? (
          <div className="section-loading" aria-live="polite">
            <AccessibleSpinner
              size="medium"
              label={`Carregando seção ${heading}`}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

// ===== COMPONENTES DE CONTEÚDO ACESSÍVEL =====

interface AccessibleHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  ctaText?: string;
  onCtaClick?: () => void;
  backgroundImage?: string;
}

export function AccessibleHero({
  title,
  subtitle,
  children,
  ctaText = "Saiba mais",
  onCtaClick,
  backgroundImage,
}: AccessibleHeroProps) {
  const { stopLoading } = useAccessibleLoading({
    successText: "Hero carregado com sucesso",
  });

  React.useEffect(() => {
    // Announce success when component mounts
    setTimeout(() => {
      stopLoading("Hero carregado com sucesso");
    }, 100);
  }, [stopLoading]);

  return (
    <AccessibleSection
      id="hero"
      heading={title}
      headingLevel={1}
      className="hero-section"
      role="banner"
      ariaLabel="Seção principal do site"
    >
      <div
        className="hero-content"
        style={
          backgroundImage
            ? { backgroundImage: `url(${backgroundImage})` }
            : undefined
        }
      >
        <div className="hero-text">
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        </div>

        {children}

        {onCtaClick && (
          <div className="hero-cta">
            <button
              onClick={onCtaClick}
              className="hero-cta-button"
              type="button"
              aria-describedby="hero-cta-description"
            >
              {ctaText}
            </button>
            <div id="hero-cta-description" className="sr-only">
              Botão principal de chamada para ação
            </div>
          </div>
        )}
      </div>
    </AccessibleSection>
  );
}

interface AccessibleFeaturesProps {
  title: string;
  features: Array<{
    id: string;
    title: string;
    description: string;
    icon?: ReactNode;
  }>;
}

export function AccessibleFeatures({
  title,
  features,
}: AccessibleFeaturesProps) {
  return (
    <AccessibleSection
      id="features"
      heading={title}
      className="features-section"
      ariaLabel="Recursos e funcionalidades"
    >
      <div className="features-grid" role="list">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="feature-item"
            role="listitem"
            aria-labelledby={`feature-${feature.id}-title`}
            aria-describedby={`feature-${feature.id}-description`}
          >
            {feature.icon && (
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
            )}

            <h3 id={`feature-${feature.id}-title`} className="feature-title">
              {feature.title}
            </h3>

            <p
              id={`feature-${feature.id}-description`}
              className="feature-description"
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </AccessibleSection>
  );
}

interface AccessibleTestimonialsProps {
  title: string;
  testimonials: Array<{
    id: string;
    quote: string;
    author: string;
    role: string;
    avatar?: string;
  }>;
}

export function AccessibleTestimonials({
  title,
  testimonials,
}: AccessibleTestimonialsProps) {
  return (
    <AccessibleSection
      id="testimonials"
      heading={title}
      className="testimonials-section"
      ariaLabel="Depoimentos de clientes"
    >
      <div
        className="testimonials-container"
        role="region"
        aria-label="Lista de depoimentos"
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-item">
            <p className="testimonial-quote">
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            <footer className="testimonial-author">
              <div className="author-info">
                {testimonial.avatar && (
                  <div className="relative">
                    <Image
                      src={testimonial.avatar}
                      alt={`Foto de ${testimonial.author}`}
                      className="author-avatar"
                      loading="lazy"
                      fill
                    />
                  </div>
                )}
                <div className="author-details">
                  <cite
                    id={`testimonial-${testimonial.id}-source`}
                    className="author-name"
                  >
                    {testimonial.author}
                  </cite>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
            </footer>
          </div>
        ))}
      </div>
    </AccessibleSection>
  );
}

interface AccessiblePricingProps {
  title: string;
  plans: Array<{
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
    ctaText?: string;
    onSelect?: () => void;
  }>;
}

export function AccessiblePricing({ title, plans }: AccessiblePricingProps) {
  return (
    <AccessibleSection
      id="pricing"
      heading={title}
      className="pricing-section"
      ariaLabel="Planos e preços"
    >
      <div className="pricing-grid" role="list" aria-label="Planos disponíveis">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-plan ${plan.popular ? "pricing-plan--popular" : ""}`}
            role="listitem"
            aria-labelledby={`plan-${plan.id}-name`}
            aria-describedby={`plan-${plan.id}-description`}
          >
            {plan.popular && (
              <div className="popular-badge" aria-label="Plano mais popular">
                Mais Popular
              </div>
            )}

            <header className="plan-header">
              <h3 id={`plan-${plan.id}-name`} className="plan-name">
                {plan.name}
              </h3>
              <div className="plan-price" aria-label={`Preço: ${plan.price}`}>
                {plan.price}
              </div>
            </header>

            <p id={`plan-${plan.id}-description`} className="plan-description">
              {plan.description}
            </p>

            <ul
              className="plan-features"
              aria-label={`Recursos do plano ${plan.name}`}
              role="list"
            >
              {plan.features.map((feature, index) => (
                <li key={index} role="listitem">
                  {feature}
                </li>
              ))}
            </ul>

            {plan.onSelect && (
              <button
                onClick={plan.onSelect}
                className="plan-cta-button"
                type="button"
                aria-describedby={`plan-${plan.id}-cta-description`}
              >
                {plan.ctaText || "Selecionar plano"}
              </button>
            )}

            <div id={`plan-${plan.id}-cta-description`} className="sr-only">
              Botão para selecionar o plano {plan.name}
            </div>
          </div>
        ))}
      </div>
    </AccessibleSection>
  );
}

interface AccessibleFAQProps {
  title: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export function AccessibleFAQ({ title, questions }: AccessibleFAQProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(),
  );

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <AccessibleSection
      id="faq"
      heading={title}
      className="faq-section"
      ariaLabel="Perguntas frequentes"
    >
      <div
        className="faq-list"
        role="region"
        aria-label="Lista de perguntas frequentes"
      >
        {questions.map((item) => {
          const isExpanded = expandedItems.has(item.id);

          return (
            <div
              key={item.id}
              className="faq-item"
              aria-labelledby={`faq-${item.id}-question`}
            >
              <button
                id={`faq-${item.id}-question`}
                className="faq-question"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isExpanded}
                aria-controls={`faq-${item.id}-answer`}
                type="button"
              >
                <span>{item.question}</span>
                <span
                  className={`faq-toggle-icon ${isExpanded ? "expanded" : ""}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              <div
                id={`faq-${item.id}-answer`}
                className={`faq-answer ${isExpanded ? "expanded" : ""}`}
                role="region"
                aria-labelledby={`faq-${item.id}-question`}
                hidden={!isExpanded}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AccessibleSection>
  );
}
