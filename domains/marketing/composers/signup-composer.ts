// Signup Composer
// Composes signup section content with A/B testing support

import type {
  ComposedSignupData,
  SignupConfiguration,
  SignupVariant,
} from "../types/signup.types";
import { flags } from "@/lib/flags";
import { withCompositionValidation } from "@/lib/composition/composer-validation";

const signupConfig: SignupConfiguration = {
  defaultVariant: "with-plans",
  variants: [
    {
      id: "with-plans",
      name: "Signup with Plan Selection",
      description: "Complete signup flow with plan selection and form",
      content: {
        title: "Escolha seu Plano",
        subtitle: "Complete seu cadastro e tenha acesso imediato à plataforma",
        plans: [
          {
            id: "starter",
            name: "Starter",
            price: "R$ 97",
            period: "/mês",
            features: [
              "Até 100 consultas/mês",
              "3 dashboards",
              "Integrações básicas",
              "Suporte por email",
            ],
            ctaText: "Começar com Starter",
          },
          {
            id: "pro",
            name: "Professional",
            price: "R$ 497",
            period: "/mês",
            popular: true,
            features: [
              "Consultas ilimitadas",
              "Dashboards ilimitados",
              "Todas as integrações",
              "Suporte prioritário",
              "IA avançada",
            ],
            ctaText: "Escolher Professional",
          },
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
              name: "role",
              type: "select",
              label: "Cargo",
              options: [
                "CEO",
                "CTO",
                "Diretor",
                "Gerente",
                "Analista",
                "Outro",
              ],
              required: true,
            },
            {
              name: "phone",
              type: "tel",
              label: "Telefone",
              placeholder: "(11) 99999-9999",
              required: false,
            },
          ],
          submitText: "Criar Conta",
          successMessage: "Conta criada com sucesso! Bem-vindo ao Luminaris.",
        },
        benefits: [
          "Configuração em 5 minutos",
          "Sem cartão de crédito necessário",
          "Cancelamento a qualquer momento",
          "Suporte completo incluído",
        ],
        ctaText: "Criar Conta Gratuita",
        termsText:
          "Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.",
      },
    },
  ],
};

export function composeSignupContent(): ComposedSignupData {
  return withCompositionValidation(() => {
    const experimentVariant = flags.getExperimentVariant("signup_variant");
    let activeVariant: SignupVariant;

    if (experimentVariant && experimentVariant !== "control") {
      activeVariant =
        signupConfig.variants.find((v) => v.id === experimentVariant) ||
        signupConfig.variants[0];
    } else {
      activeVariant =
        signupConfig.variants.find(
          (v) => v.id === signupConfig.defaultVariant,
        ) || signupConfig.variants[0];
    }

    return {
      content: activeVariant.content,
      variant: activeVariant,
      envelope: {
        id: "signup",
        type: "signup",
        version: "1.0.0",
        timestamp: Date.now(),
      },
      experiment:
        experimentVariant !== "control"
          ? {
              id: "signup_variant",
              variant: experimentVariant,
              isActive: true,
            }
          : undefined,
    };
  }, "signup");
}
