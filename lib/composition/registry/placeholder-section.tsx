"use client";

import React from "react";

interface PlaceholderSectionProps {
  id?: string;
  [key: string]: unknown;
}

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({
  id,
  ...props
}) => (
  <section className="section-wrapper py-20 md:py-28">
    <div className="container mx-auto max-w-6xl px-4 md:px-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Seção em Desenvolvimento
        </h3>
        <p className="text-gray-600 text-sm">
          A seção "{id || "desconhecida"}" ainda não foi implementada.
        </p>
      </div>
    </div>
  </section>
);
