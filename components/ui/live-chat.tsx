"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Minimize2,
  Maximize2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { analytics } from "@/lib/analytics-core";
import { usePersonalization } from "@/lib/personalization/personalization-context";
import { whatsappIntegration } from "@/lib/whatsapp/integration";
import { useResilientMutation } from "@/lib/network/use-resilient-fetch";
import { useUnifiedEvents } from "@/lib/hooks/use-unified-events";
import { useComponentCircuitBreaker } from "@/lib/hooks/use-component-circuit-breaker";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "quick_reply" | "product_card";
  metadata?: any;
}

interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  isTyping: boolean;
  unreadCount: number;
}

export function LiveChat() {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
    isTyping: false,
    unreadCount: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeSegments } = usePersonalization();
  const { addUnifiedListener } = useUnifiedEvents();

  // Component-specific circuit breaker to prevent memory leaks
  const {
    safeSetTimeout,
    safeAddEventListener,
    canPerformOperation,
    isTripped,
  } = useComponentCircuitBreaker("live-chat", {
    maxTimers: 3,
    maxEventListeners: 5,
    maxMemoryUsage: 30, // 30MB
    performanceThreshold: 0.7,
    cooldownPeriod: 15000, // 15 seconds
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages.length]);

  // Auto-open based on user behavior (circuit breaker protected)
  useEffect(() => {
    if (typeof window === "undefined" || isTripped) return;

    let scrollTimeoutId: NodeJS.Timeout | null = null;
    let timeTimeoutId: NodeJS.Timeout | null = null;
    let hasTriggered = false;

    const handleScroll = () => {
      if (hasTriggered || chatState.isOpen || !canPerformOperation()) return;

      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;

      // Auto-open after 50% scroll
      if (scrollPercent > 50) {
        hasTriggered = true;
        scrollTimeoutId = safeSetTimeout(() => {
          if (!chatState.isOpen && canPerformOperation()) {
            setChatState((prev) => ({ ...prev, isOpen: true }));
            analytics.track("chat_auto_open", {
              trigger: "scroll_50",
              segments: activeSegments,
            });
          }
        }, 2000);
      }
    };

    // Auto-open after 30 seconds (only once)
    timeTimeoutId = safeSetTimeout(() => {
      if (!hasTriggered && !chatState.isOpen && canPerformOperation()) {
        hasTriggered = true;
        setChatState((prev) => ({ ...prev, isOpen: true }));
        analytics.track("chat_auto_open", {
          trigger: "time_30s",
          segments: activeSegments,
        });
      }
    }, 30000);

    // Use unified events for scroll tracking (circuit breaker protected)
    const cleanup = addUnifiedListener(
      window as any,
      (event) => {
        if (
          event.type === "press" &&
          event.inputMethod === "mouse" &&
          canPerformOperation()
        ) {
          handleScroll();
        }
      },
      { trackAnalytics: false },
    );

    return () => {
      cleanup();
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      if (timeTimeoutId) clearTimeout(timeTimeoutId);
    };
  }, [
    chatState.isOpen,
    activeSegments,
    addUnifiedListener,
    safeSetTimeout,
    canPerformOperation,
    isTripped,
  ]);

  const { mutate: sendChatMessage, loading: sendingMessage } =
    useResilientMutation("POST", "/api/chatbot", {
      onSuccess: (botResponse: any) => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: botResponse.message,
          sender: "bot",
          timestamp: new Date(),
          type: botResponse.type || "text",
          metadata: botResponse.metadata,
        };

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
          isTyping: false,
        }));
      },
      onError: (error) => {
        console.error("Chatbot error:", error);
        const errorMessage: Message = {
          id: `bot-error-${Date.now()}`,
          content:
            "Desculpe, estou com dificuldades técnicas. Tente novamente ou entre em contato conosco pelo WhatsApp.",
          sender: "bot",
          timestamp: new Date(),
        };

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isTyping: false,
        }));
      },
    });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: content.trim(),
        sender: "user",
        timestamp: new Date(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      if (typeof window !== "undefined") {
        analytics.track("chat_message_sent", {
          message_length: content.length,
          segments: activeSegments,
          page_path: window.location.pathname,
        });
      }

      // Simulate bot typing
      setChatState((prev) => ({ ...prev, isTyping: true }));

      try {
        await sendChatMessage({
          message: content,
          context: {
            segments: activeSegments,
            page: window.location.pathname,
            conversation_history: chatState.messages.slice(-5),
          },
        });
      } catch (error) {
        // Error already handled by onError callback
      }
    },
    [activeSegments, chatState.messages, sendChatMessage],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (input?.value) {
      sendMessage(input.value);
      input.value = "";
    }
  };

  const toggleChat = () => {
    setChatState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false,
      unreadCount: 0,
    }));

    analytics.track(chatState.isOpen ? "chat_closed" : "chat_opened", {
      segments: activeSegments,
      message_count: chatState.messages.length,
    });
  };

  const toggleMinimize = () => {
    setChatState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const startWhatsApp = () => {
    if (typeof window === "undefined") return;

    const context = {
      segments: activeSegments.map((segment) => segment.id),
      intent: "contact",
      page: window.location.pathname,
      conversation_id: `chat_${Date.now()}`,
    };

    const urls = whatsappIntegration.generateContactUrls(context);
    window.open(urls.whatsapp, "_blank");

    analytics.track("chat_whatsapp_redirect", {
      segments: activeSegments,
      message_count: chatState.messages.length,
      context,
    });
  };

  // Initial greeting message
  useEffect(() => {
    if (chatState.isOpen && chatState.messages.length === 0) {
      const greetingMessage: Message = {
        id: "greeting",
        content: `Olá! 👋 Sou o assistente inteligente da Luminaris. Posso ajudar você com informações sobre nosso sistema de automação empresarial?

Como você chegou até aqui?`,
        sender: "bot",
        timestamp: new Date(),
        type: "quick_reply",
        metadata: {
          quick_replies: [
            "Quero conhecer o sistema",
            "Tenho dúvidas sobre preços",
            "Preciso de uma demonstração",
            "Outro assunto",
          ],
        },
      };

      setChatState((prev) => ({
        ...prev,
        messages: [greetingMessage],
      }));
    }
  }, [chatState.isOpen, chatState.messages.length]);

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-colors"
        aria-label="Abrir chat"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          {chatState.unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {chatState.unreadCount}
            </span>
          )}
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {chatState.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: chatState.isMinimized ? "60px" : "500px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold">Luminaris AI</h3>
                  <p className="text-xs opacity-90">Online agora</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startWhatsApp}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label={chatState.isMinimized ? "Maximizar" : "Minimizar"}
                >
                  {chatState.isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Fechar chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!chatState.isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
                  {chatState.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === "user"
                            ? "bg-primary text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>

                        {/* Quick Replies */}
                        {message.type === "quick_reply" &&
                          message.metadata?.quick_replies && (
                            <div className="mt-3 space-y-2">
                              {message.metadata.quick_replies.map(
                                (reply: string, index: number) => (
                                  <button
                                    key={index}
                                    onClick={() => sendMessage(reply)}
                                    className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
                                  >
                                    {reply}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {chatState.isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSubmit}
                  className="p-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                      disabled={chatState.isTyping}
                    />
                    <button
                      type="submit"
                      disabled={chatState.isTyping || sendingMessage}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Enviar mensagem"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
