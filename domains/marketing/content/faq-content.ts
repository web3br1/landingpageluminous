// Content Layer - FAQ Section Content
// Separated content from presentation - Single source of truth for FAQ content

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
}

export interface FaqContent {
  title: string;
  subtitle?: string;
  items: FaqItem[];
  ctaText?: string;
  ctaLink?: string;
}

export const faqContentVariants: Record<string, FaqContent> = {
  default: {
    title: "Perguntas Frequentes",
    subtitle: "Tudo que você precisa saber sobre nossa plataforma",
    items: [
      {
        question: "Como funciona a automação de relatórios?",
        answer:
          "Nossa IA analisa seus dados automaticamente e gera relatórios executivos personalizados. Você conecta suas fontes de dados uma vez, e o sistema cuida do resto - atualização em tempo real, alertas inteligentes e dashboards prontos para apresentação.",
        category: "funcionalidades",
      },
      {
        question: "Quais tipos de dados posso conectar?",
        answer:
          "Suportamos qualquer fonte de dados: bancos SQL/NoSQL, APIs REST, planilhas Excel/Google Sheets, ERPs como SAP e Oracle, CRMs como Salesforce e Pipedrive, além de integrações nativas com Google Analytics, Facebook Ads e plataformas de e-commerce.",
        category: "integrações",
      },
      {
        question: "Preciso de equipe técnica para usar?",
        answer:
          "Não. Nossa interface drag-and-drop permite que usuários de negócio criem dashboards e relatórios sem conhecimento técnico. Para integrações avançadas, oferecemos suporte dedicado e documentação completa.",
        category: "usabilidade",
      },
      {
        question: "Meus dados estão seguros?",
        answer:
          "Sim. Usamos criptografia end-to-end, conformidade com LGPD/GDPR, auditorias regulares e infraestrutura enterprise-grade. Seus dados nunca são compartilhados ou usados para outros fins.",
        category: "segurança",
      },
      {
        question: "Qual o investimento necessário?",
        answer:
          "Oferecemos planos flexíveis a partir de R$ 99/mês para pequenas empresas, com período de teste gratuito. O ROI típico é de 3-5x o investimento em 6 meses através de economia de tempo e aumento de receita.",
        category: "preços",
      },
      {
        question: "Posso testar antes de comprar?",
        answer:
          "Sim! Oferecemos trial gratuito de 14 dias com acesso completo a todas as funcionalidades. Também fazemos demos personalizadas para entender suas necessidades específicas.",
        category: "trial",
      },
      {
        question: "Como funciona o suporte?",
        answer:
          "Suporte 24/7 via chat, email e telefone. Plano Enterprise inclui gerente de conta dedicado. Base de conhecimento completa, tutoriais em vídeo e comunidade ativa de usuários.",
        category: "suporte",
      },
    ],
    ctaText: "Ainda tem dúvidas? Fale conosco",
    ctaLink: "/contato",
  },

  enterprise: {
    title: "FAQ para Empresas",
    subtitle: "Respostas para questões corporativas",
    items: [
      {
        question: "Suportam compliance SOX e auditorias?",
        answer:
          "Sim. Nossa plataforma é certificada SOC 2 Type II, atende requisitos SOX e facilita auditorias com logs completos, versionamento de dados e controles de acesso granulares.",
        category: "compliance",
      },
      {
        question: "Como funciona a integração com sistemas legados?",
        answer:
          "Oferecemos conectores certificados para ERPs legados e middleware corporativo. Nossa equipe de integração especializada garante conectividade segura e confiável.",
        category: "integrações",
      },
      {
        question: "Posso personalizar dashboards por departamento?",
        answer:
          "Sim. Controle de acesso baseado em papéis permite dashboards personalizados por função, departamento ou nível hierárquico, mantendo consistência corporativa.",
        category: "personalização",
      },
      {
        question: "Qual o SLA garantido?",
        answer:
          "99.9% uptime SLA para plano Enterprise, com créditos automáticos em caso de indisponibilidade. Monitoramento 24/7 e equipe de resposta a incidentes dedicada.",
        category: "suporte",
      },
      {
        question: "Como funciona a migração de dados?",
        answer:
          "Processo estruturado com equipe dedicada: assessment inicial, plano de migração detalhado, testes paralelos e go-live assistido. Dados históricos preservados e validados.",
        category: "migração",
      },
      {
        question: "Oferecem treinamento para times grandes?",
        answer:
          "Sim. Treinamentos presenciais e online, certificação de usuários, materiais didáticos personalizados e programa de adoção com acompanhamento por 90 dias.",
        category: "treinamento",
      },
    ],
    ctaText: "Agende uma consultoria gratuita",
    ctaLink: "/enterprise-demo",
  },
};

// Default export for easier importing
export const defaultFaqContent = faqContentVariants.default;
export const enterpriseFaqContent = faqContentVariants.enterprise;
