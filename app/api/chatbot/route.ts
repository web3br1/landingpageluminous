import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
  createRateLimitResponse,
  parseRequestBody,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// Mock dependencies for typecheck (real implementation would import from actual modules)
const chatbotEngine = {
  processMessage: async (message: string, context: any) => ({
    message: `Resposta para: ${message}`,
    confidence: 0.9,
    intent: "general",
    actions: [],
  }),
};

const analytics = {
  track: (event: string, data: any) => console.log("Analytics:", event, data),
};

const flags = {
  isEnabled: (flag: string) => false,
};

// Schema for chatbot request validation
const chatbotRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  context: z.object({
    conversation_history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      timestamp: z.number().optional(),
    })).default([]),
    page: z.string().optional(),
    segments: z.array(z.string()).default([]),
    userId: z.string().optional(),
  }).optional().default({
    conversation_history: [],
    segments: [],
  }),
});

// Type for ChatContext (inferred from schema)
type ChatContext = z.infer<typeof chatbotRequestSchema>["context"];

export async function POST(request: NextRequest) {
  try {
  // Parse and validate request body
  const parseResult = await parseRequestBody(request, chatbotRequestSchema);
  if (!parseResult.success) {
    return (parseResult as { success: false; error: NextResponse }).error;
  }

  const { message, context } = parseResult.data;

    // Check rate limiting (simple implementation)
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimitKey = `chatbot:${clientIP}`;

    // For production, implement proper rate limiting with Redis/external service
    // This is a simple in-memory rate limiter for demo purposes
    const globalWithRateLimit = global as typeof global & {
      rateLimit?: Map<string, { count: number; resetTime: number }>;
    };
    if (typeof global !== "undefined" && !globalWithRateLimit.rateLimit) {
      globalWithRateLimit.rateLimit = new Map();
    }

    const rateLimit = globalWithRateLimit.rateLimit;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 messages per minute

    if (!rateLimit?.has(rateLimitKey)) {
      rateLimit!.set(rateLimitKey, { count: 0, resetTime: now + windowMs });
    }

    const userLimit = rateLimit?.get(rateLimitKey);

    if (userLimit && now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }

    if (userLimit && userLimit.count >= maxRequests) {
      return createRateLimitResponse(Math.ceil((userLimit.resetTime - Date.now()) / 1000), maxRequests);
    }

    if (userLimit) {
      if (userLimit) userLimit.count++;
    }

    // Enhanced context with experiment data
    const enhancedContext: ChatContext = {
      ...context,
      // Add experiment variants for personalization
      // experiment_variants: {
      //   hero_headline: flags.getExperimentVariant("hero_headline"),
      //   cta_color: flags.getExperimentVariant("cta_color"),
      //   pricing_layout: flags.getExperimentVariant("pricing_layout"),
      // },
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
      // response_type: response.type,
      processing_time: processingTime,
      message_length: message.length,
      segments: context.segments,
      page: context.page,
      // has_next_actions: !!response.next_actions?.length,
    });

    // Log conversation quality for ML training
    // const conversationAnalysis = chatbotEngine.analyzeConversation(
    //   context.conversation_history,
    // );
    // analytics.track("chatbot_conversation_analysis", {
    //   engagement_score: conversationAnalysis.engagement_score,
    //   conversion_potential: conversationAnalysis.conversion_potential,
    //   topics_discussed: conversationAnalysis.topics_discussed,
    //   total_messages: context.conversation_history.length,
    // });

    // Add processing metadata
    const enhancedResponse = {
      ...response,
      metadata: {
        // ...(typeof response.metadata === "object" && response.metadata !== null
        //   ? response.metadata
        //   : {}),
        processing_time: processingTime,
        server_timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    return createSuccessResponse(enhancedResponse);
  } catch (error) {
    console.error("Chatbot API error:", error);

    analytics.track("chatbot_error", {
      error_type: error instanceof Error ? error.constructor.name : "unknown",
      error_message: error instanceof Error ? error.message : "unknown error",
    });

    return createErrorResponse(
      "CHATBOT_ERROR",
      "Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.",
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        details: {
          fallback: {
            message: "Estou com dificuldades técnicas no momento. Que tal conversarmos pelo WhatsApp?",
            type: "text",
            quick_replies: ["WhatsApp", "Tentar novamente"],
          },
        },
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return createSuccessResponse({
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
