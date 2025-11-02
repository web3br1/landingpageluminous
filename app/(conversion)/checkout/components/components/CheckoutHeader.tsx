import React from "react";
import { Zap } from "lucide-react";

export function CheckoutHeader() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Luminaris</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900 text-sm">
            Suporte
          </button>
          <button className="text-gray-600 hover:text-gray-900 text-sm">
            Voltar
          </button>
        </div>
      </div>
    </header>
  );
}
