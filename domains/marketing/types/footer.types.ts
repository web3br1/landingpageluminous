// Domain Types - Footer Section Types
// Type-safe definitions for footer content and behavior

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

export interface FooterNewsletter {
  title: string;
  placeholder: string;
  buttonText: string;
  privacyText: string;
}

export interface FooterLegal {
  copyright: string;
  links: FooterLink[];
}

export interface FooterContent {
  logo: {
    src: string;
    alt: string;
    href?: string;
  };
  tagline?: string;
  linkGroups: FooterLinkGroup[];
  socialLinks: FooterSocialLink[];
  contact: FooterContact;
  newsletter?: FooterNewsletter;
  legal: FooterLegal;
}

export interface FooterSectionProps {
  content: FooterContent;
  variant?: "default" | "minimal";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "footer";
  };
  onNewsletterSubmit?: (email: string) => void;
  onSocialClick?: (platform: string) => void;
  onLinkClick?: (href: string, label: string) => void;
  headingId?: string;
}

export interface FooterTracking {
  experimentId?: string;
  variant?: string;
  section: "footer";
  interactions: {
    newsletterSignups: number;
    socialClicks: Record<string, number>;
    linkClicks: Record<string, number>;
  };
}
