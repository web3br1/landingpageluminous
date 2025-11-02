import { UserSegment } from "@/lib/personalization/types";
import { analytics } from "@/lib/analytics-core";

export interface ChatContext {
  segments: UserSegment[];
  page: string;
  conversation_history: Array<{
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
  }>;
  user_info?: {
    name?: string;
    email?: string;
    company?: string;
  };
  experiment_variants?: Record<string, string>;
}

export interface ChatResponse {
  message: string;
  type: "text" | "quick_reply" | "product_card" | "contact_form";
  metadata?: unknown;
  confidence: number;
  intent: string;
  next_actions?: string[];
}

export class ChatbotEngine {
  private readonly intents = {
    pricing: [
      "preço",
      "valor",
      "custo",
      "plano",
      "tarifa",
      "cobrança",
      "pagar",
    ],
    demo: ["demo", "demonstração", "teste", "experimentar", "ver", "mostrar"],
    features: [
      "funcionalidade",
      "recurso",
      "o que faz",
      "capacidade",
      "ferramenta",
    ],
    contact: ["contato", "falar", "conversar", "whatsapp", "telefone", "email"],
    support: ["ajuda", "suporte", "problema", "dúvida", "não funciona"],
    comparison: [
      "comparar",
      "diferença",
      "melhor que",
      "versus",
      "concorrente",
    ],
    trial: ["teste grátis", "gratuito", "avaliação", "30 dias", "free"],
    integration: ["integrar", "conectar", "api", "sistema", "plataforma"],
  };

  private readonly responses = {
    greeting: [
      "Olá! 👋 Sou o assistente da Luminaris. Como posso ajudar você hoje?",
      "Oi! Bem-vindo à Luminaris! Em que posso ser útil?",
      "Olá! Obrigado por visitar nosso site. Como posso auxiliar?",
    ],

    pricing: {
      basic:
        "Temos planos a partir de R$ 97/mês com todas as funcionalidades essenciais. Gostaria que eu detalhe os planos para você?",
      enterprise:
        "Para empresas, oferecemos planos personalizados a partir de R$ 497/mês com recursos avançados. Interessado em uma proposta?",
      trial:
        "Oferecemos 14 dias grátis para você testar tudo! Quer que eu ajude a começar?",
    },

    demo: [
      "Posso agendar uma demonstração personalizada para você! Quando seria um bom horário?",
      "Adoraríamos mostrar o sistema funcionando. Temos demos ao vivo ou gravadas disponíveis.",
      "Uma demonstração vale mais que mil palavras! Vamos agendar para hoje mesmo?",
    ],

    features: {
      automation:
        "Automatizamos relatórios complexos, dashboards interativos e alertas inteligentes em tempo real.",
      ai: "Nossa IA analisa padrões, prevê tendências e otimiza processos automaticamente.",
      integration:
        "Integramos com 50+ sistemas: ERP, CRM, bancos de dados e APIs personalizadas.",
    },

    contact: [
      "Prefere falar pelo WhatsApp? É o canal mais rápido para dúvidas técnicas.",
      "Posso conectar você diretamente com nossa equipe comercial pelo WhatsApp.",
      "Para atendimento personalizado, o WhatsApp é nossa opção mais ágil.",
    ],
  };

  private readonly quickReplies = {
    initial: [
      "Quero conhecer o sistema",
      "Tenho dúvidas sobre preços",
      "Preciso de uma demonstração",
      "Outro assunto",
    ],
    pricing: [
      "Ver planos detalhados",
      "Planos para empresa",
      "Teste grátis",
      "Voltar",
    ],
    demo: ["Demo hoje", "Demo gravada", "Agendar horário", "Voltar"],
    contact: ["WhatsApp", "Email", "Telefone", "Voltar"],
  };

  async processMessage(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    const { segments, page, conversation_history } = context;
    const lowerMessage = message.toLowerCase();
    const intent = this.detectIntent(lowerMessage);
    const confidence = this.calculateConfidence(lowerMessage, intent);

    analytics.track("chatbot_message_processed", {
      intent,
      confidence,
      segments,
      page,
      message_length: message.length,
    });

    let response: ChatResponse;

    switch (intent) {
      case "pricing":
        response = await this.handlePricing(message, context);
        break;
      case "demo":
        response = await this.handleDemo(message, context);
        break;
      case "features":
        response = await this.handleFeatures(message, context);
        break;
      case "contact":
        response = await this.handleContact(message, context);
        break;
      case "trial":
        response = await this.handleTrial(message, context);
        break;
      default:
        response = await this.handleGeneral(message, context);
    }

    response.intent = intent;
    response.confidence = confidence;

    return response;
  }

  private detectIntent(message: string): string {
    const words = message.toLowerCase().split(/\s+/);

    for (const [intent, keywords] of Object.entries(this.intents)) {
      const matches = words.filter((word) =>
        keywords.some(
          (keyword) => word.includes(keyword) || keyword.includes(word),
        ),
      );

      if (matches.length > 0) {
        return intent;
      }
    }

    return "general";
  }

  private calculateConfidence(message: string, intent: string): number {
    if (intent === "general") return 0.5;

    const keywords = this.intents[intent as keyof typeof this.intents] || [];
    const words = message.toLowerCase().split(/\s+/);
    const matches = words.filter((word) =>
      keywords.some((keyword) => word.includes(keyword)),
    );

    return Math.min((matches.length / words.length) * 2, 1);
  }

  private async handlePricing(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    const { segments } = context;
    const isEnterprise =
      segments.some((segment) => segment.id === "enterprise") ||
      message.toLowerCase().includes("empresa");

    let message_text: string;
    let quick_replies: string[];

    if (
      message.toLowerCase().includes("teste") ||
      message.toLowerCase().includes("grátis")
    ) {
      message_text = this.responses.pricing.trial;
      quick_replies = this.quickReplies.pricing;
    } else if (isEnterprise) {
      message_text = this.responses.pricing.enterprise;
      quick_replies = this.quickReplies.pricing;
    } else {
      message_text = this.responses.pricing.basic;
      quick_replies = this.quickReplies.pricing;
    }

    return {
      message: message_text,
      type: "quick_reply",
      metadata: { quick_replies },
      confidence: 0.9,
      intent: "pricing",
      next_actions: ["schedule_demo", "show_pricing_page"],
    };
  }

  private async handleDemo(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    const randomResponse =
      this.responses.demo[
        Math.floor(Math.random() * this.responses.demo.length)
      ];

    return {
      message: randomResponse,
      type: "quick_reply",
      metadata: { quick_replies: this.quickReplies.demo },
      confidence: 0.9,
      intent: "demo",
      next_actions: ["schedule_demo", "send_demo_link"],
    };
  }

  private async handleFeatures(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    let feature_type = "automation";

    if (
      message.toLowerCase().includes("ia") ||
      message.toLowerCase().includes("inteligência")
    ) {
      feature_type = "ai";
    } else if (
      message.toLowerCase().includes("integrar") ||
      message.toLowerCase().includes("conectar")
    ) {
      feature_type = "integration";
    }

    const feature_response =
      this.responses.features[
        feature_type as keyof typeof this.responses.features
      ];

    return {
      message: `🚀 ${feature_response}

Quer que eu detalhe mais alguma funcionalidade específica?`,
      type: "quick_reply",
      metadata: {
        quick_replies: [
          "Recursos de IA",
          "Integrações",
          "Relatórios",
          "Suporte",
        ],
      },
      confidence: 0.8,
      intent: "features",
      next_actions: ["show_features_page", "schedule_demo"],
    };
  }

  private async handleContact(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    const randomResponse =
      this.responses.contact[
        Math.floor(Math.random() * this.responses.contact.length)
      ];

    return {
      message: randomResponse,
      type: "quick_reply",
      metadata: { quick_replies: this.quickReplies.contact },
      confidence: 0.9,
      intent: "contact",
      next_actions: ["redirect_whatsapp", "show_contact_form"],
    };
  }

  private async handleTrial(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    return {
      message:
        "🎉 Excelente! Oferecemos 14 dias grátis para você testar tudo sem compromisso. Quer que eu ajude você a criar sua conta agora mesmo?",
      type: "quick_reply",
      metadata: {
        quick_replies: [
          "Sim, criar conta",
          "Ver planos primeiro",
          "Mais informações",
        ],
      },
      confidence: 0.9,
      intent: "trial",
      next_actions: ["start_trial_flow", "show_pricing_page"],
    };
  }

  private async handleGeneral(
    message: string,
    context: ChatContext,
  ): Promise<ChatResponse> {
    const { conversation_history } = context;

    // If this is the first message, give a general greeting
    if (conversation_history.length === 0) {
      const randomGreeting =
        this.responses.greeting[
          Math.floor(Math.random() * this.responses.greeting.length)
        ];

      return {
        message: randomGreeting,
        type: "quick_reply",
        metadata: { quick_replies: this.quickReplies.initial },
        confidence: 0.6,
        intent: "greeting",
        next_actions: ["wait_for_intent"],
      };
    }

    // Try to understand context from conversation
    const lastBotMessage = [...conversation_history]
      .reverse()
      .find((m) => m.sender === "bot");

    if (lastBotMessage?.content.includes("preço")) {
      return this.handlePricing(message, context);
    }

    // Fallback general response
    return {
      message:
        "Entendi! Posso ajudar com informações sobre preços, funcionalidades, demonstrações ou contato com nossa equipe. O que você gostaria de saber?",
      type: "quick_reply",
      metadata: {
        quick_replies: ["Preços", "Funcionalidades", "Demo", "Contato"],
      },
      confidence: 0.5,
      intent: "general",
      next_actions: ["clarify_intent"],
    };
  }

  // Utility method to get personalized greeting based on segments
  getPersonalizedGreeting(segments: UserSegment[]): string {
    if (segments.some((segment) => segment.id === "enterprise")) {
      return "Olá! Vejo que você representa uma empresa. Como podemos ajudar sua organização com automação de processos?";
    }

    if (segments.some((segment) => segment.id === "mobile_user")) {
      return "Oi! Bem-vindo do mobile. Temos uma versão otimizada para dispositivos móveis. Como posso ajudar?";
    }

    if (segments.some((segment) => segment.id === "brazil_user")) {
      return "Olá! 🇧🇷 Que bom ter você aqui! Como posso ajudar com nosso sistema de automação brasileiro?";
    }

    return "Olá! 👋 Bem-vindo à Luminaris. Como posso ajudar você hoje?";
  }

  // Method to analyze conversation quality
  analyzeConversation(conversation: ChatContext["conversation_history"]): {
    engagement_score: number;
    conversion_potential: number;
    topics_discussed: string[];
  } {
    const userMessages = conversation.filter((m) => m.sender === "user");
    const topics = new Set<string>();

    // Analyze topics discussed
    userMessages.forEach((msg) => {
      const lowerMsg = msg.content.toLowerCase();
      Object.entries(this.intents).forEach(([intent, keywords]) => {
        if (keywords.some((k) => lowerMsg.includes(k))) {
          topics.add(intent);
        }
      });
    });

    // Calculate engagement (message length, questions, etc.)
    const avgLength =
      userMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
        userMessages.length || 0;
    const engagement_score = Math.min(avgLength / 100, 1);

    // Conversion potential based on topics
    const conversionTopics = ["pricing", "demo", "trial", "contact"];
    const conversionWords = conversionTopics.filter((t) =>
      topics.has(t),
    ).length;
    const conversion_potential = conversionWords / conversionTopics.length;

    return {
      engagement_score,
      conversion_potential,
      topics_discussed: Array.from(topics),
    };
  }
}

export const chatbotEngine = new ChatbotEngine();
