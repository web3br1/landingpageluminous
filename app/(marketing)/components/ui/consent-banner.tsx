"use client";

import { useState, useEffect } from "react";
import { CtaButton } from "./cta-button";
import { consent, type ConsentState } from "../../../../lib/analytics";
import { notify } from "../../../../lib/notifications";

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verifica se já deu consentimento
    const currentConsent = consent.get();
    const hasAnyConsent =
      currentConsent.analytics ||
      currentConsent.marketing ||
      currentConsent.functional;

    if (!hasAnyConsent) {
      // Pequeno delay para não aparecer imediatamente
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    consent.set({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
    setIsVisible(false);

    // Only show notification in browser, not during SSR
    if (typeof window !== "undefined") {
      notify.success(
        "Preferências salvas!",
        "Todas as funcionalidades estão habilitadas para melhorar sua experiência.",
      );
    }

    // Pequeno delay antes de recarregar
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
    }, 1500);
  };

  const handleAcceptEssential = () => {
    consent.set({
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    });
    setIsVisible(false);

    // Only show notification in browser, not during SSR
    if (typeof window !== "undefined") {
      notify.info(
        "Preferências atualizadas",
        "Apenas cookies essenciais foram aceitos.",
      );
    }
  };

  const handleCustomSettings = (customConsent: ConsentState) => {
    consent.set(customConsent);
    setIsVisible(false);

    // Only show notification in browser, not during SSR
    if (typeof window !== "undefined") {
      notify.success(
        "Configurações aplicadas!",
        "Suas preferências de privacidade foram salvas.",
      );
    }

    // Pequeno delay antes de recarregar
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
    }, 1500);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-neutral-200/20 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Conteúdo principal */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              🍪 Privacidade e Cookies
            </h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Utilizamos cookies para melhorar sua experiência, analisar o
              tráfego e personalizar conteúdo. Você pode escolher quais tipos de
              cookies aceitar ou rejeitar todos exceto os essenciais.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <CtaButton
              onClick={handleAcceptAll}
              className="bg-primary hover:bg-primary-600 text-white px-6 py-2 text-sm"
            >
              Aceitar Todos
            </CtaButton>
            <CtaButton
              onClick={handleAcceptEssential}
              className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-6 py-2 text-sm"
            >
              Apenas Essenciais
            </CtaButton>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-primary hover:text-primary-600 text-sm underline px-6 py-2"
            >
              {showDetails ? "Ocultar Opções" : "Configurar"}
            </button>
          </div>
        </div>

        {/* Configurações detalhadas */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <h4 className="text-md font-semibold text-neutral-900 mb-4">
              Preferências de Cookies
            </h4>

            <div className="space-y-4">
              {/* Cookies Essenciais */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="essential"
                  checked={true}
                  disabled={true}
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="essential"
                    className="font-medium text-neutral-900"
                  >
                    Essenciais
                  </label>
                  <p className="text-sm text-neutral-600">
                    Necessários para o funcionamento básico do site. Não podem
                    ser desativados.
                  </p>
                </div>
              </div>

              {/* Cookies Analíticos */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="analytics"
                  defaultChecked={false}
                  className="mt-1"
                  onChange={(e) => {
                    const current = consent.get();
                    handleCustomSettings({
                      ...current,
                      analytics: e.target.checked,
                    });
                  }}
                />
                <div>
                  <label
                    htmlFor="analytics"
                    className="font-medium text-neutral-900"
                  >
                    Analíticos
                  </label>
                  <p className="text-sm text-neutral-600">
                    Nos ajudam a entender como você usa o site para melhorar a
                    experiência. Dados anonimizados e respeitam a LGPD.
                  </p>
                </div>
              </div>

              {/* Cookies de Marketing */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  defaultChecked={false}
                  className="mt-1"
                  onChange={(e) => {
                    const current = consent.get();
                    handleCustomSettings({
                      ...current,
                      marketing: e.target.checked,
                    });
                  }}
                />
                <div>
                  <label
                    htmlFor="marketing"
                    className="font-medium text-neutral-900"
                  >
                    Marketing
                  </label>
                  <p className="text-sm text-neutral-600">
                    Usados para personalizar anúncios e conteúdo baseado nos
                    seus interesses.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <CtaButton
                onClick={() => handleCustomSettings(consent.get())}
                className="bg-primary hover:bg-primary-600 text-white px-6 py-2 text-sm"
              >
                Salvar Preferências
              </CtaButton>
              <button
                onClick={() => setShowDetails(false)}
                className="text-neutral-600 hover:text-neutral-800 text-sm underline px-6 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
