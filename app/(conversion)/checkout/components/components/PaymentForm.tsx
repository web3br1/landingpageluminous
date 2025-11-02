import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CreditCard, Smartphone, FileText, AlertCircle } from "lucide-react";
import type { PaymentData, PaymentErrors } from "../types/checkout.types";

interface PaymentFormProps {
  paymentData: PaymentData;
  errors: PaymentErrors;
  isProcessing: boolean;
  onPaymentChange: (field: keyof PaymentData, value: string | number | boolean) => void;
  onSubmit: () => void;
}

export function PaymentForm({
  paymentData,
  errors,
  isProcessing,
  onPaymentChange,
  onSubmit,
}: PaymentFormProps) {
  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Método de Pagamento</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "card", label: "Cartão", icon: CreditCard },
            { id: "pix", label: "PIX", icon: Smartphone },
            { id: "boleto", label: "Boleto", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onPaymentChange("paymentMethod", id as any)}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentData.paymentMethod === id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Payment Form */}
      {paymentData.paymentMethod === "card" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados do Cartão</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => onPaymentChange("cardNumber", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={paymentData.expiryDate}
                    onChange={(e) => onPaymentChange("expiryDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => onPaymentChange("cvv", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  placeholder="Como está escrito no cartão"
                  value={paymentData.cardName}
                  onChange={(e) => onPaymentChange("cardName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.cardName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Número de Parcelas
                </label>
                <select
                  value={paymentData.installments}
                  onChange={(e) => onPaymentChange("installments", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      {num}x sem juros
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* CPF and Terms */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={paymentData.cpf}
              onChange={(e) => onPaymentChange("cpf", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.cpf && (
              <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={paymentData.acceptTerms}
              onChange={(e) => onPaymentChange("acceptTerms", e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700">
              Aceito os{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
          )}
        </div>
      </Card>

      {/* Help */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">
              Precisa de ajuda?
            </div>
            <div className="text-blue-700">
              Nossa equipe está disponível por chat ou WhatsApp para tirar dúvidas sobre o pagamento.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
