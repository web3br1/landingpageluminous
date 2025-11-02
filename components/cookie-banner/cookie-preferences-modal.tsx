"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Info,
  BarChart3,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";
import { ConsentState } from "./cookie-banner";
import { ConsentManager } from "@/lib/privacy/consent-manager";

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consent: ConsentState) => void;
  initialConsent?: Partial<ConsentState>;
}

// Icon mapping for categories
const CATEGORY_ICONS = {
  analytics: BarChart3,
  marketing: Target,
  functional: SettingsIcon,
} as const;

export function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialConsent = {},
}: CookiePreferencesModalProps) {
  const [consent, setConsent] = useState<ConsentState>({
    essential: true, // Sempre true, não pode ser desabilitado
    analytics: initialConsent.analytics ?? false,
    marketing: initialConsent.marketing ?? false,
    functional: initialConsent.functional ?? false,
  });

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Get categories from ConsentManager
  const categories = Object.values(ConsentManager.CATEGORIES);

  if (!isOpen) return null;

  const handleToggleCategory = (
    categoryId: keyof Omit<ConsentState, "essential">,
  ) => {
    setConsent((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleAcceptAll = () => {
    const fullConsent: ConsentState = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    onSave(fullConsent);
  };

  const handleSave = () => {
    onSave(consent);
  };

  const toggleCategoryDetails = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="cookie-preferences-title"
      aria-describedby="cookie-preferences-description"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2
              id="cookie-preferences-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              🍪 Preferências de Cookies
            </h2>
            <p
              id="cookie-preferences-description"
              className="text-sm text-gray-600 dark:text-gray-300 mt-1"
            >
              Escolha quais tipos de cookies você permite em nosso site
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar modal de preferências"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Cookies Essenciais (sempre ativados) */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Cookies Essenciais
              </h3>
              <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full font-medium">
                Sempre Ativo
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              Estes cookies são necessários para o funcionamento básico do site
              e não podem ser desabilitados. Eles incluem cookies de segurança,
              sessão e preferências essenciais.
            </p>
          </div>

          {/* Outras categorias */}
          <div className="space-y-4">
            {categories.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.id];
              const isExpanded = expandedCategory === category.id;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCategoryDetails(category.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                          aria-label={`Ver detalhes de ${category.name}`}
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={consent[category.id]}
                            onChange={() => handleToggleCategory(category.id as "analytics" | "marketing" | "functional")}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <ul className="space-y-2">
                          {category.details.map((detail, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                              <span className="text-blue-500 mt-1.5 flex-shrink-0">
                                •
                              </span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Suas preferências serão salvas e podem ser alteradas a qualquer
            momento.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Aceitar Todos
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
