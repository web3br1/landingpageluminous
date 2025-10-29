// Configuration for payment providers with validation
function validateStripeConfig() {
  const required = [
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_STARTER_PRICE_ID",
    "STRIPE_PROFESSIONAL_PRICE_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Stripe configuration incomplete. Missing: ${missing.join(", ")}`,
    );
    console.warn(
      "Stripe webhooks and payment processing will be disabled until configured.",
    );
    return false;
  }

  return true;
}

const isStripeConfigured = validateStripeConfig();

export const paymentConfig = {
  stripe: isStripeConfigured
    ? {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        // Plan IDs no Stripe (crie estes produtos no dashboard)
        plans: {
          starter: process.env.STRIPE_STARTER_PRICE_ID!,
          professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
          enterprise: "price_enterprise_custom", // Custom pricing
        },
      }
    : null,
  pagbank: process.env.PAGBANK_TOKEN
    ? {
        token: process.env.PAGBANK_TOKEN,
        webhookToken: process.env.PAGBANK_WEBHOOK_TOKEN || "",
        // Plan IDs no PagBank (crie estes planos na API)
        plans: {
          starter: process.env.PAGBANK_STARTER_PLAN_ID || "",
          professional: process.env.PAGBANK_PROFESSIONAL_PLAN_ID || "",
          enterprise: "plan_enterprise_custom", // Custom pricing
        },
      }
    : null,
};

export const isStripeEnabled = isStripeConfigured;
export const isPagBankEnabled = !!process.env.PAGBANK_TOKEN;

// Webhook URLs (configure estes endpoints nos dashboards dos providers)
export const webhookUrls = {
  stripe: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`,
  pagbank: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagbank`,
};

// Tax rates by country
export const taxRates = {
  BR: 0.12, // 12% ICMS + PIS/COFINS
  US: 0, // No tax for digital services
  default: 0,
};

// Currency settings
export const currencies = {
  BRL: {
    symbol: "R$",
    locale: "pt-BR",
    provider: "pagbank" as const,
  },
  USD: {
    symbol: "$",
    locale: "en-US",
    provider: "stripe" as const,
  },
};
