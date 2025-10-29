// Content Layer - Lead Form Section Content
// Separated content from presentation - Single source of truth for lead form content

import type {
  LeadFormContent,
  LeadFormVariant,
} from "../types/lead-form.types";

export const leadFormContentVariants: Record<string, LeadFormContent> = {
  default: {
    title: "Pronto para começar?",
    subtitle: "Entre em contato e descubra como podemos ajudar seu negócio",
    fields: [
      {
        name: "name",
        label: "Nome completo",
        type: "text",
        required: true,
        placeholder: "Seu nome completo",
      },
      {
        name: "email",
        label: "E-mail profissional",
        type: "email",
        required: true,
        placeholder: "seu@email.com",
      },
      {
        name: "company",
        label: "Empresa",
        type: "text",
        required: true,
        placeholder: "Nome da empresa",
      },
      {
        name: "phone",
        label: "Telefone",
        type: "tel",
        required: false,
        placeholder: "(11) 99999-9999",
      },
      {
        name: "message",
        label: "Mensagem",
        type: "textarea",
        required: false,
        placeholder: "Conte-nos sobre suas necessidades...",
      },
    ],
    submitButton: {
      text: "Enviar mensagem",
      // loadingText: "Enviando..."
    },
    privacyText: "Seus dados estão seguros conosco. Não enviamos spam.",
    successMessage:
      "Mensagem enviada com sucesso! Entraremos em contato em breve.",
  },

  demo: {
    title: "Agende uma demonstração",
    subtitle: "Veja o Luminaris em ação com uma demonstração personalizada",
    fields: [
      {
        name: "name",
        label: "Nome completo",
        type: "text",
        required: true,
        placeholder: "Seu nome completo",
      },
      {
        name: "email",
        label: "E-mail profissional",
        type: "email",
        required: true,
        placeholder: "seu@email.com",
      },
      {
        name: "company",
        label: "Empresa",
        type: "text",
        required: true,
        placeholder: "Nome da empresa",
      },
      {
        name: "companySize",
        label: "Tamanho da empresa",
        type: "select",
        required: true,
        options: [
          { value: "1-10", label: "1-10 funcionários" },
          { value: "11-50", label: "11-50 funcionários" },
          { value: "51-200", label: "51-200 funcionários" },
          { value: "201-1000", label: "201-1000 funcionários" },
          { value: "1000+", label: "Mais de 1000 funcionários" },
        ],
      },
      {
        name: "demoDate",
        label: "Data preferida para demo",
        type: "text",
        required: false,
      },
    ],
    submitButton: {
      text: "Agendar demonstração",
      // loadingText: "Agendando..."
    },
    privacyText:
      "Ao agendar, você concorda em receber comunicações sobre nossa demonstração.",
    successMessage:
      "Demonstração agendada! Verifique seu e-mail para confirmação.",
  },
};

export const leadFormConfiguration = {
  variants: [
    {
      id: "default",
      name: "Default Lead Form",
      description: "Standard contact form for lead generation",
      content: leadFormContentVariants.default,
      weight: 60,
    },
    {
      id: "demo",
      name: "Demo Scheduling Form",
      description: "Specialized form for demo scheduling",
      content: leadFormContentVariants.demo,
      weight: 40,
    },
  ],
  defaultVariant: "default",
} as const;

export const leadFormVariants: LeadFormVariant[] = [
  ...leadFormConfiguration.variants,
];

// Type exports
export type LeadFormContentVariants = typeof leadFormContentVariants;
export type LeadFormContentKey = keyof LeadFormContentVariants;
