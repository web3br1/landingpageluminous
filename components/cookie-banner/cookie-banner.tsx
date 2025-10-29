"use client";

import React, { useState, useEffect } from "react";
import { Cookie, Settings, X, Check } from "lucide-react";

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface CookieBannerProps {
  onAccept: (consent: ConsentState) => void;
  onReject: () => void;
  onCustomize: () => void;
  isVisible: boolean;
}

export function CookieBanner({
  onAccept,
  onReject,
  onCustomize,
  isVisible,
}: CookieBannerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Pequeno delay para animação de entrada
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    onAccept({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectAll = () => {
    onReject();
  };

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transform transition-transform duration-300 ease-out
        ${isAnimating ? "translate-y-0" : "translate-y-full"}
        bg-white border-t border-gray-200 shadow-lg
        dark:bg-gray-900 dark:border-gray-700 dark:shadow-gray-900/20
      `}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      data-testid="cookie-banner"
    >
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Ícone e conteúdo principal */}
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h2
                id="cookie-banner-title"
                className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                🍪 Suas Preferências de Cookies
              </h2>

              <p
                id="cookie-banner-description"
                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                Utilizamos cookies para melhorar sua experiência, personalizar
                conteúdo e analisar nosso tráfego. Você pode escolher quais
                categorias de cookies aceitar. Saiba mais em nossa{" "}
                <a
                  href="/politica-privacidade"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidade
                </a>
                .
              </p>

              {/* Categorias de cookies (preview) */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                  <Check className="w-3 h-3" />
                  Essenciais
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                  <Settings className="w-3 h-3" />
                  Analytics
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">
                  <Settings className="w-3 h-3" />
                  Marketing
                </span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Botão Personalizar */}
            <button
              onClick={onCustomize}
              className="
                inline-flex items-center justify-center gap-2 px-4 py-2.5
                text-sm font-medium text-gray-700 dark:text-gray-300
                bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors duration-200
                min-w-[120px]
              "
              aria-label="Personalizar preferências de cookies"
            >
              <Settings className="w-4 h-4" />
              Personalizar
            </button>

            {/* Botão Rejeitar */}
            <button
              onClick={handleRejectAll}
              className="
                inline-flex items-center justify-center gap-2 px-4 py-2.5
                text-sm font-medium text-gray-700 dark:text-gray-300
                bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                transition-colors duration-200
                min-w-[120px]
              "
              aria-label="Rejeitar todos os cookies não essenciais"
            >
              <X className="w-4 h-4" />
              Rejeitar
            </button>

            {/* Botão Aceitar */}
            <button
              onClick={handleAcceptAll}
              className="
                inline-flex items-center justify-center gap-2 px-6 py-2.5
                text-sm font-semibold text-white
                bg-blue-600 hover:bg-blue-700
                rounded-lg shadow-sm hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-all duration-200
                min-w-[140px]
              "
              aria-label="Aceitar todos os cookies"
            >
              <Check className="w-4 h-4" />
              Aceitar Todos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
