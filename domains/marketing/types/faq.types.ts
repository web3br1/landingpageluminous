// Domain Types - FAQ Section Types
// Type-safe definitions for FAQ content and behavior

export interface FaqItem {
  question: string;
  answer: string;
  category?:
    | "funcionalidades"
    | "integrações"
    | "usabilidade"
    | "segurança"
    | "preços"
    | "trial"
    | "suporte"
    | "compliance"
    | "personalização"
    | "migração"
    | "treinamento";
  isOpen?: boolean;
}

export interface FaqContent {
  title: string;
  subtitle?: string;
  items: FaqItem[];
  ctaText?: string;
  ctaLink?: string;
  envelope?: {
    id: string;
    type: string;
    version: string;
    timestamp: number;
  };
}

export interface FaqSectionProps {
  content: FaqContent;
  variant?: "default" | "enterprise";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "faq";
  };
  onQuestionClick?: (questionIndex: number, question: string) => void;
  onCtaClick?: () => void;
  headingId?: string;
}

export interface FaqTracking {
  experimentId?: string;
  variant?: string;
  section: "faq";
  interactions: {
    questionsOpened: number[];
    ctaClicked: boolean;
  };
}
