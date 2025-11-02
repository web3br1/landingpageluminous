// Checkout Composer
// Composes checkout section content with A/B testing support

import type {
  ComposedCheckoutData,
  CheckoutConfiguration,
  CheckoutVariant,
} from "../types/checkout.types";
import { flags } from "@/lib/flags";
import { withCompositionValidation } from "@/lib/composition/composer-validation";

const checkoutConfig: CheckoutConfiguration = {
  defaultVariant: "standard",
  variants: [
    {
      id: "standard",
      name: "Standard Checkout",
      description: "Complete checkout form with all security features",
      content: {
        title: "Finalizar Compra",
        subtitle: "Complete suas informações para ativar seu plano",
        plan: {
          name: "Plano Pro",
          price: "R$ 497",
          period: "/mês",
          features: [
            "IA Conversacional Avançada",
            "Dashboards Ilimitados",
            "Integrações Completas",
            "Suporte Prioritário",
          ],
        },
        paymentMethods: [
          {
            id: "credit_card",
            name: "Cartão de Crédito",
            icon: "CreditCard",
            description: "Visa, Mastercard, American Express",
          },
          {
            id: "pix",
            name: "PIX",
            icon: "Zap",
            description: "Pagamento instantâneo",
          },
          {
            id: "boleto",
            name: "Boleto Bancário",
            icon: "FileText",
            description: "Pagamento em até 3 dias úteis",
          },
        ],
        billing: {
          showAddress: true,
          showCompanyInfo: true,
          requiredFields: ["name", "email", "document", "address"],
        },
        security: {
          ssl: true,
          pciCompliant: true,
          guarantees: [
            "Pagamento 100% seguro",
            "Dados criptografados",
            "Conformidade PCI DSS",
            "Cancelamento a qualquer momento",
          ],
        },
        ctaText: "Finalizar Compra",
        termsText:
          "Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade.",
      },
    },
  ],
};

export async function composeCheckoutContent(): Promise<ComposedCheckoutData> {
  return await withCompositionValidation(async () => {
    const experimentVariant = flags.getExperimentVariant("checkout_variant");
    let activeVariant: CheckoutVariant;

    if (experimentVariant && experimentVariant !== "control") {
      activeVariant =
        checkoutConfig.variants.find((v) => v.id === experimentVariant) ||
        checkoutConfig.variants[0];
    } else {
      activeVariant =
        checkoutConfig.variants.find(
          (v) => v.id === checkoutConfig.defaultVariant,
        ) || checkoutConfig.variants[0];
    }

    return {
      content: activeVariant.content,
      variant: activeVariant,
      envelope: {
        id: "checkout",
        type: "checkout",
        version: "1.0.0",
        timestamp: Date.now(),
      },
      experiment:
        experimentVariant !== "control"
          ? {
              id: "checkout_variant",
              variant: experimentVariant,
              isActive: true,
            }
          : undefined,
    };
  }, "checkout");
}
