// Trial Composer
// Composes trial section content with A/B testing support

import type {
  ComposedTrialData,
  TrialConfiguration,
  TrialVariant,
} from "../types/trial.types";
import { flags } from "@/lib/flags";
import { withCompositionValidation } from "@/lib/composition/composer-validation";

const trialConfig: TrialConfiguration = {
  defaultVariant: "standard",
  variants: [
    {
      id: "standard",
      name: "Standard Trial",
      description: "Complete trial signup with detailed form",
      content: {
        title: "Teste Gratuito de 14 Dias",
        subtitle: "Acesse todas as funcionalidades sem compromisso",
        duration: "14 dias",
        features: [
          "IA Conversacional Completa",
          "Dashboards Ilimitados",
          "Todas as Integrações",
          "Suporte por Chat",
        ],
        limitations: [
          "Limite de 100 consultas/dia",
          "Até 5 dashboards",
          "Suporte prioritário não incluído",
        ],
        form: {
          fields: [
            {
              name: "name",
              type: "text",
              label: "Nome completo",
              placeholder: "Seu nome completo",
              required: true,
            },
            {
              name: "email",
              type: "email",
              label: "Email profissional",
              placeholder: "seu@email.com",
              required: true,
            },
            {
              name: "company",
              type: "text",
              label: "Empresa",
              placeholder: "Nome da empresa",
              required: true,
            },
            {
              name: "phone",
              type: "tel",
              label: "Telefone (opcional)",
              placeholder: "(11) 99999-9999",
              required: false,
            },
          ],
          submitText: "Começar Teste Gratuito",
          successMessage: "Bem-vindo! Seu teste gratuito foi ativado.",
        },
        ctaText: "Iniciar Teste Agora",
        termsText: "Ao se cadastrar, você concorda com nossos Termos de Uso.",
      },
    },
  ],
};

export function composeTrialContent(): ComposedTrialData {
  return withCompositionValidation(() => {
    const experimentVariant = flags.getExperimentVariant("trial_variant");
    let activeVariant: TrialVariant;

    if (experimentVariant && experimentVariant !== "control") {
      activeVariant =
        trialConfig.variants.find((v) => v.id === experimentVariant) ||
        trialConfig.variants[0];
    } else {
      activeVariant =
        trialConfig.variants.find((v) => v.id === trialConfig.defaultVariant) ||
        trialConfig.variants[0];
    }

    return {
      content: activeVariant.content,
      variant: activeVariant,
      envelope: {
        id: "trial",
        type: "trial",
        version: "1.0.0",
        timestamp: Date.now(),
      },
      experiment:
        experimentVariant !== "control"
          ? {
              id: "trial_variant",
              variant: experimentVariant,
              isActive: true,
            }
          : undefined,
    };
  }, "trial");
}
