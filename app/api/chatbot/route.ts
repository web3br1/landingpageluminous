import { NextRequest, NextResponse } from "next/server";
import { chatbotEngine, ChatContext } from "@/lib/chatbot/engine";
import { analytics } from "@/lib/analytics-core";
import { flags } from "@/lib/flags";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context }: { message: string; context: ChatContext } =
      body;

    // Validate input
    if (!message || typeof message !== "string" || message.length > 1000) {
      return NextResponse.json(
        {
          error: "Invalid message",
          details: "Message must be a string with max 1000 characters",
        },
        { status: 400 },
      );
    }

    // Check rate limiting (simple implementation)
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimitKey = `chatbot:${clientIP}`;

    // For production, implement proper rate limiting with Redis/external service
    // This is a simple in-memory rate limiter for demo purposes
    if (typeof global !== "undefined" && !(global as any).rateLimit) {
      (global as any).rateLimit = new Map();
    }

    const rateLimit = (global as any).rateLimit;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 messages per minute

    if (!rateLimit.has(rateLimitKey)) {
      rateLimit.set(rateLimitKey, { count: 0, resetTime: now + windowMs });
    }

    const userLimit = rateLimit.get(rateLimitKey);

    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }

    if (userLimit.count >= maxRequests) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details:
            "Too many messages. Please wait before sending more messages.",
        },
        { status: 429 },
      );
    }

    userLimit.count++;

    // Enhanced context with experiment data
    const enhancedContext: ChatContext = {
      ...context,
      // Add experiment variants for personalization
      experiment_variants: {
        hero_headline: flags.getExperimentVariant("hero_headline"),
        cta_color: flags.getExperimentVariant("cta_color"),
        pricing_layout: flags.getExperimentVariant("pricing_layout"),
      },
    };

    // Process message with AI engine
    const startTime = Date.now();
    const response = await chatbotEngine.processMessage(
      message,
      enhancedContext,
    );
    const processingTime = Date.now() - startTime;

    // Track chatbot analytics
    analytics.track("chatbot_response_generated", {
      intent: response.intent,
      confidence: response.confidence,
      response_type: response.type,
      processing_time: processingTime,
      message_length: message.length,
      segments: context.segments,
      page: context.page,
      has_next_actions: !!response.next_actions?.length,
    });

    // Log conversation quality for ML training
    const conversationAnalysis = chatbotEngine.analyzeConversation(
      context.conversation_history,
    );
    analytics.track("chatbot_conversation_analysis", {
      engagement_score: conversationAnalysis.engagement_score,
      conversion_potential: conversationAnalysis.conversion_potential,
      topics_discussed: conversationAnalysis.topics_discussed,
      total_messages: context.conversation_history.length,
    });

    // Add processing metadata
    const enhancedResponse = {
      ...response,
      metadata: {
        ...response.metadata,
        processing_time: processingTime,
        server_timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error("Chatbot API error:", error);

    analytics.track("chatbot_error", {
      error_type: error instanceof Error ? error.constructor.name : "unknown",
      error_message: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          "Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.",
        fallback: {
          message:
            "Estou com dificuldades técnicas no momento. Que tal conversarmos pelo WhatsApp?",
          type: "text",
          quick_replies: ["WhatsApp", "Tentar novamente"],
        },
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: [
      "intent_detection",
      "context_awareness",
      "experiment_integration",
      "analytics_tracking",
    ],
  });
}
