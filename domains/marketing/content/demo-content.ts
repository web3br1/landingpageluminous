// Content Layer - Demo Section Content
// Separated content from presentation - Single source of truth for demo content

export interface DemoVideo {
  src: string;
  poster?: string;
  title: string;
  duration?: string;
  format: "mp4" | "webm" | "youtube" | "vimeo";
  videoId?: string; // for YouTube/Vimeo
}

export interface DemoScreenshot {
  src: string;
  alt: string;
  title: string;
  description?: string;
  hotspot?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    label: string;
    description: string;
  };
}

export interface DemoTourStep {
  title: string;
  description: string;
  screenshot?: DemoScreenshot;
  video?: DemoVideo;
  cta?: {
    text: string;
    link: string;
  };
}

export interface DemoContent {
  title: string;
  subtitle: string;
  description: string;
  demoType:
    | "video"
    | "interactive-tour"
    | "screenshots"
    | "live-demo"
    | "hybrid";
  primaryVideo?: DemoVideo;
  screenshots?: DemoScreenshot[];
  tourSteps?: DemoTourStep[];
  features: {
    title: string;
    items: string[];
  };
  stats?: {
    label: string;
    value: string;
  }[];
  cta: {
    primary: {
      text: string;
      link: string;
    };
    secondary?: {
      text: string;
      link: string;
    };
  };
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    company: string;
  };
}

export const demoContentVariants: Record<string, DemoContent> = {
  default: {
    title: "Veja a Luminaris em Ação",
    subtitle:
      "Descubra como nossa plataforma transforma dados complexos em insights acionáveis",
    description:
      "Assista a uma demonstração completa de 3 minutos mostrando como importar dados, criar dashboards personalizados e gerar relatórios automáticos que impressionam stakeholders.",
    demoType: "hybrid",
    primaryVideo: {
      src: "/videos/demo.mp4",
      poster: "/images/demo-poster.jpg",
      title: "Demonstração Completa da Luminaris",
      duration: "3:24",
      format: "mp4",
    },
    screenshots: [
      {
        src: "/images/screenshots/screenshot-dashboard.jpg",
        alt: "Dashboard principal com KPIs em tempo real",
        title: "Dashboard Executivo",
        description:
          "Visão consolidada de todos os indicadores importantes do negócio",
        hotspot: {
          x: 75,
          y: 30,
          label: "Filtros Avançados",
          description:
            "Personalize visualizações por período, segmento ou métrica",
        },
      },
      {
        src: "/images/screenshots/screenshot-reports.svg",
        alt: "Relatórios automáticos sendo gerados",
        title: "Relatórios Automáticos",
        description: "Gere relatórios complexos em segundos, não horas",
      },
      {
        src: "/images/screenshots/screenshot-chat.svg",
        alt: "Integração com múltiplas fontes de dados",
        title: "Integração Universal",
        description: "Conecte qualquer fonte de dados em minutos",
      },
    ],
    features: {
      title: "O que você verá na demo:",
      items: [
        "Importação de dados de 15+ fontes diferentes",
        "Criação de dashboards drag-and-drop",
        "Relatórios automáticos com IA",
        "Alertas inteligentes por email/SMS",
        "Compartilhamento seguro com stakeholders",
        "Análises preditivas avançadas",
      ],
    },
    stats: [
      { label: "Tempo médio de implementação", value: "2 dias" },
      { label: "Redução em custos de relatório", value: "75%" },
      { label: "Aumento em tomada de decisão", value: "3x mais rápida" },
    ],
    cta: {
      primary: {
        text: "Assistir Demo Completa",
        link: "/demo",
      },
      secondary: {
        text: "Agendar Consultoria Gratuita",
        link: "/consultoria",
      },
    },
    testimonial: {
      quote:
        "A demo nos convenceu completamente. Implementamos em uma semana e já recuperamos o investimento.",
      author: "Roberto Fernandes",
      role: "CTO",
      company: "TechStart Brasil",
    },
  },

  videoOnly: {
    title: "Demonstração em Vídeo",
    subtitle: "Assista como funciona na prática",
    description:
      "Veja todos os recursos em ação em uma demonstração completa guiada por nossos especialistas.",
    demoType: "video",
    primaryVideo: {
      src: "https://youtube.com/watch?v=demo-video-id",
      title: "Tour Completo da Plataforma",
      duration: "5:47",
      format: "youtube",
      videoId: "demo-video-id",
    },
    features: {
      title: "Recursos demonstrados:",
      items: [
        "Interface intuitiva e moderna",
        "Integrações plug-and-play",
        "Dashboards responsivos",
        "Relatórios exportáveis",
        "Suporte multilíngue",
      ],
    },
    cta: {
      primary: {
        text: "Assistir no YouTube",
        link: "https://youtube.com/watch?v=demo-video-id",
      },
    },
  },

  interactiveTour: {
    title: "Tour Interativo da Plataforma",
    subtitle: "Explore cada funcionalidade passo a passo",
    description:
      "Descubra todas as possibilidades da Luminaris através de um tour guiado interativo.",
    demoType: "interactive-tour",
    tourSteps: [
      {
        title: "1. Conecte suas fontes de dados",
        description:
          "Importe dados de planilhas, bancos de dados, APIs e sistemas ERP em poucos cliques.",
        screenshot: {
          src: "/images/screenshots/screenshot-chat.svg",
          alt: "Tela de conexão de fontes de dados",
          title: "Conectores Universais",
        },
        cta: {
          text: "Ver conectores disponíveis",
          link: "/integrations",
        },
      },
      {
        title: "2. Crie dashboards personalizados",
        description:
          "Arraste e solte componentes para criar visualizações que fazem sentido para seu negócio.",
        screenshot: {
          src: "/images/screenshots/screenshot-dashboard.svg",
          alt: "Interface de construção de dashboards",
          title: "Builder Visual",
        },
      },
      {
        title: "3. Configure alertas inteligentes",
        description:
          "Receba notificações automáticas quando métricas importantes atingem thresholds críticos.",
        screenshot: {
          src: "/images/screenshots/screenshot-reports.svg",
          alt: "Configuração de alertas e notificações",
          title: "Alertas Inteligentes",
        },
      },
      {
        title: "4. Compartilhe insights",
        description:
          "Publique dashboards e relatórios com controle granular de permissões e acesso.",
        screenshot: {
          src: "/images/screenshots/screenshot-chat.svg",
          alt: "Opções de compartilhamento e permissões",
          title: "Compartilhamento Seguro",
        },
      },
    ],
    features: {
      title: "Funcionalidades incluídas:",
      items: [
        "Mais de 50 tipos de gráficos",
        "Filtros dinâmicos",
        "Drill-down interativo",
        "Export para PDF/PNG",
        "Integração com Power BI/Tableau",
      ],
    },
    cta: {
      primary: {
        text: "Iniciar Tour Interativo",
        link: "/tour",
      },
      secondary: {
        text: "Agendar Demo Personalizada",
        link: "/demo-personalizada",
      },
    },
  },
};

// Default export for easier importing
export const defaultDemoContent = demoContentVariants.default;
export const videoOnlyDemoContent = demoContentVariants.videoOnly;
export const interactiveTourDemoContent = demoContentVariants.interactiveTour;
