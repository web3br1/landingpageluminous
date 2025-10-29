// Content Layer - Footer Section Content
// Separated content from presentation - Single source of truth for footer content

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  platform:
    | "linkedin"
    | "twitter"
    | "youtube"
    | "github"
    | "facebook"
    | "instagram";
  href: string;
  icon: string; // lucide-react icon name
  label: string;
}

export interface FooterContact {
  email: string;
  phone?: string;
  address?: string;
}

export interface FooterContent {
  logo: {
    src: string;
    alt: string;
    href?: string;,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    };
  tagline?: string;
  linkGroups: FooterLinkGroup[];
  socialLinks: FooterSocialLink[];
  contact: FooterContact;
  newsletter?: {
    title: string;
    placeholder: string;
    buttonText: string;
    privacyText: string;
  };
  legal: {
    copyright: string;
    links: FooterLink[];,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    };
}

export const footerContentVariants: Record<string, FooterContent> = {
  default: {
    logo: {
      src: "/images/brand/logo.svg",
      alt: "Luminaris",
      href: "/",,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    tagline: "Transformando dados em decisões inteligentes",
    linkGroups: [
      {
        title: "Produto",
        links: [
          { label: "Funcionalidades", href: "/features" },
          { label: "Preços", href: "/pricing" },
          { label: "Demonstração", href: "/demo" },
          { label: "Integrações", href: "/integrations" },
        ],
      },
      {
        title: "Empresa",
        links: [
          { label: "Sobre nós", href: "/about" },
          { label: "Carreiras", href: "/careers" },
          { label: "Blog", href: "/blog" },
          { label: "Contato", href: "/contact" },
        ],
      },
      {
        title: "Suporte",
        links: [
          { label: "Central de Ajuda", href: "/help" },
          { label: "Documentação", href: "/docs" },
          { label: "Status", href: "/status" },
          { label: "API", href: "/api" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Termos de Uso", href: "/terms" },
          { label: "Política de Privacidade", href: "/privacy" },
          { label: "LGPD", href: "/lgpd" },
          { label: "Cookies", href: "/cookies" },
        ],
      },
    ],
    socialLinks: [
      {
        platform: "linkedin",
        href: "https://linkedin.com/company/luminaris",
        icon: "Linkedin",
        label: "LinkedIn",
      },
      {
        platform: "twitter",
        href: "https://twitter.com/luminaris",
        icon: "Twitter",
        label: "Twitter",
      },
      {
        platform: "youtube",
        href: "https://youtube.com/@luminaris",
        icon: "Youtube",
        label: "YouTube",
      },
      {
        platform: "github",
        href: "https://github.com/luminaris",
        icon: "Github",
        label: "GitHub",
      },
    ],
    contact: {
      email: "contato@luminaris.com.br",
      phone: "+55 11 9999-9999",,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    newsletter: {
      title: "Fique por dentro das novidades",
      placeholder: "Seu melhor e-mail",
      buttonText: "Inscrever-se",
      privacyText: "Respeitamos sua privacidade. Cancele a qualquer momento.",,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    legal: {
      copyright: "© 2025 Luminaris. Todos os direitos reservados.",
      links: [
        { label: "Termos", href: "/terms",
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
        { label: "Privacidade", href: "/privacy" },
        { label: "Cookies", href: "/cookies" },
      ],
    },
  },

  minimal: {
    logo: {
      src: "/images/brand/logo-icon.svg",
      alt: "Luminaris",
      href: "/",,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    linkGroups: [
      {
        title: "Produto",
        links: [
          { label: "Funcionalidades", href: "/features" },
          { label: "Preços", href: "/pricing" },
          { label: "Contato", href: "/contact" },
        ],
      },
      {
        title: "Empresa",
        links: [
          { label: "Sobre", href: "/about" },
          { label: "Blog", href: "/blog" },
        ],
      },
    ],
    socialLinks: [
      {
        platform: "linkedin",
        href: "https://linkedin.com/company/luminaris",
        icon: "Linkedin",
        label: "LinkedIn",
      },
      {
        platform: "twitter",
        href: "https://twitter.com/luminaris",
        icon: "Twitter",
        label: "Twitter",
      },
    ],
    contact: {
      email: "contato@luminaris.com.br",,
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    legal: {
      copyright: "© 2025 Luminaris.",
      links: [
        { label: "Termos", href: "/terms",
    tracking: {
      section: "footer",
      sectionId: "footer",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
        { label: "Privacidade", href: "/privacy" },
      ],
    },
  },
};

// Default export for easier importing
export const defaultFooterContent = footerContentVariants.default;
export const minimalFooterContent = footerContentVariants.minimal;
