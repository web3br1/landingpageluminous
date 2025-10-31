import { Metadata } from "next";
import { generateCanonicalUrl } from "./seo/canonical-urls";
import { validateJsonLdSchema } from "./seo/json-ld-schemas";

export const defaultSeo: Metadata = {
  title: {
    default: "DataFlow — Relatórios automáticos em minutos | BI",
    template: "%s | DataFlow",
  },
  description:
    "Pare de perder tempo com planilhas manuais. Automatize seus relatórios de vendas, financeiro e operações. 14 dias grátis. Mais de 2.500 empresas confiam na DataFlow.",
  keywords: [
    "business intelligence",
    "relatórios automáticos",
    "BI Brasil",
    "dashboards",
    "análise de dados",
    "automação PME",
    "relatórios empresariais",
    "business intelligence brasileiro",
    "automação de relatórios",
  ],
  authors: [{ name: "DataFlow Team" }],
  creator: "DataFlow",
  publisher: "DataFlow Brasil",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://dataflow.com.br"),
  alternates: {
    canonical: generateCanonicalUrl("/"),
    languages: {
      "pt-BR": generateCanonicalUrl("/"),
      "en-US": generateCanonicalUrl("/", {
        baseUrl: "https://dataflow.com.br/en",
      }),
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://dataflow.com.br",
    siteName: "DataFlow Brasil",
    title: "DataFlow — Relatórios automáticos em minutos | BI",
    description:
      "Pare de perder tempo com planilhas manuais. Automatize seus relatórios de vendas, financeiro e operações. 14 dias grátis. Mais de 2.500 empresas confiam na DataFlow.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "DataFlow - Plataforma de Business Intelligence para PME brasileiras",
        type: "image/png",
      },
      {
        url: "/og-image-fallback.png",
        width: 1200,
        height: 630,
        alt: "DataFlow BI - Dashboards e Relatórios Automáticos",
        type: "image/png",
      },
    ],
    emails: ["contato@dataflow.com.br"],
    phoneNumbers: ["+55-11-99999-9999"],
    faxNumbers: [],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dataflow_br",
    creator: "@dataflow_br",
    title: "DataFlow — Relatórios automáticos em minutos | BI Brasil",
    description:
      "Pare de perder tempo com planilhas manuais. Automatize seus relatórios e tenha dashboards executivos em tempo real. 14 dias grátis.",
    images: [
      {
        url: "/api/og",
        alt: "DataFlow - Plataforma de Business Intelligence para PME brasileiras",
      },
      {
        url: "/og-image-fallback.png",
        alt: "DataFlow BI - Dashboards e Relatórios Automáticos",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    notranslate: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
  category: "Business Intelligence",
  classification: "Software de Gestão Empresarial",
  // Apple Touch Icon and other mobile meta tags
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "DataFlow BI",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#2563eb",
  },
};

// Schema.org para Software Application
export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://dataflow.com.br/#softwareapplication",
  name: "DataFlow",
  description:
    "Plataforma de business intelligence que automatiza relatórios e dashboards para PME brasileiras. Transforme dados em decisões em minutos.",
  url: "https://dataflow.com.br",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  softwareVersion: "2.1.0",
  fileSize: "N/A",
  offers: [
    {
      "@type": "Offer",
      price: "97",
      priceCurrency: "BRL",
      priceValidUntil: "2025-12-31",
      description: "Plano Iniciante - 3 usuários, 5 dashboards",
    },
    {
      "@type": "Offer",
      price: "297",
      priceCurrency: "BRL",
      priceValidUntil: "2025-12-31",
      description: "Plano Profissional - 15 usuários, dashboards ilimitados",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "2500",
    bestRating: "5",
    worstRating: "1",
  },
  applicationSubCategory: "Business Intelligence",
  author: {
    "@type": "Organization",
    "@id": "https://dataflow.com.br/#organization",
    name: "DataFlow Brasil",
    url: "https://dataflow.com.br",
    logo: "https://dataflow.com.br/images/brand/logo.svg",
    sameAs: [
      "https://www.linkedin.com/company/dataflow-brasil",
      "https://twitter.com/dataflow_br",
    ],
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://dataflow.com.br/#organization",
    name: "DataFlow Brasil",
  },
  featureList: [
    "Dashboards interativos em tempo real",
    "Integração com ERPs brasileiros",
    "Relatórios automáticos por email",
    "Alertas inteligentes",
    "Controle de acesso granular",
    "LGPD compliant",
  ],
};

// Schema.org para Organization
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://dataflow.com.br/#organization",
  name: "DataFlow Brasil",
  alternateName: "DataFlow BI",
  url: "https://dataflow.com.br",
  logo: "https://dataflow.com.br/images/brand/logo.svg",
  description:
    "Especialista em business intelligence para PME brasileiras. Automatizamos relatórios e dashboards para tomada de decisão mais rápida.",
  foundingDate: "2020",
  industry: "Software e Tecnologia",
  numberOfEmployees: "50",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BR",
    addressRegion: "SP",
    addressLocality: "São Paulo",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+55-11-99999-9999",
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
  sameAs: [
    "https://www.linkedin.com/company/dataflow-brasil",
    "https://twitter.com/dataflow_br",
    "https://www.instagram.com/dataflow_br",
  ],
};

// Schema.org para FAQ
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quanto tempo leva para implementar a solução?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A implementação básica leva apenas 2-3 dias. Fazemos a configuração inicial, conectamos seus sistemas principais e treinamos sua equipe. Muitos clientes já têm seus primeiros dashboards funcionando no mesmo dia.",
      },
    },
    {
      "@type": "Question",
      name: "Preciso de alguém técnico para usar a plataforma?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Não! Nossa plataforma foi desenvolvida especificamente para gestores, não para técnicos. A interface drag-and-drop permite criar dashboards sem conhecimento de programação. Oferecemos treinamento completo incluído.",
      },
    },
    {
      "@type": "Question",
      name: "Meus dados ficam seguros? E a LGPD?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sim, 100% LGPD compliant. Utilizamos criptografia de ponta a ponta, servidores na AWS Brasil com certificação ISO 27001. Você controla quem acessa quais dados, e mantemos logs completos de auditoria.",
      },
    },
  ],
};

// Validar schemas em desenvolvimento (não quebra a aplicação)
if (process.env.NODE_ENV === "development") {
  const schemasToValidate = [
    { schema: softwareApplicationSchema, type: "SoftwareApplication" },
    { schema: organizationSchema, type: "Organization" },
    { schema: faqSchema, type: "FAQPage" },
  ];

  for (const { schema, type } of schemasToValidate) {
    const validation = validateJsonLdSchema(schema, type);
    if (!validation.success) {
      console.warn(
        `⚠️  ${type} schema validation failed:`,
        validation.errors.format(),
      );
      console.warn(`Schema data:`, JSON.stringify(schema, null, 2));
    } else {
      console.log(`✅ ${type} schema is valid`);
    }
  }
}

// Combinar todos os schemas
export const jsonLd = [
  softwareApplicationSchema,
  organizationSchema,
  faqSchema,
];

// Safe stringify for embedding JSON into <script type="application/ld+json">
// Escapes characters that can break JS parsing inside a script tag
export function stringifyForScript(value: unknown): string {
  const json = JSON.stringify(value);
  return json
    .replace(/<\//g, "<\\/") // prevent </script> early close
    .replace(/<!--/g, "\\u003C!--") // prevent HTML comment start
    .replace(/\u2028/g, "\\u2028") // line separator
    .replace(/\u2029/g, "\\u2029"); // paragraph separator
}
