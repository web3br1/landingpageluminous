import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan, CheckoutCalculations } from "../types/checkout.types";

interface CheckoutSuccessScreenProps {
  selectedPlan: Plan;
  calculations: CheckoutCalculations;
}

export function CheckoutSuccessScreen({
  selectedPlan,
  calculations,
}: CheckoutSuccessScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="p-12">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-green-900">
                Pagamento Aprovado! 🎉
              </h1>
              <p className="text-xl text-green-700 mb-6">
                Bem-vindo ao Luminaris! Sua conta foi ativada com sucesso.
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Plano:</span>
                <span>{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Valor:</span>
                <span>R$ {calculations.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status:</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700">
                Acessar Minha Conta
              </button>
              <button className="w-full bg-green-100 text-green-800 py-3 px-4 rounded-lg font-semibold hover:bg-green-200">
                Baixar Recibo
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200">
                Explorar Recursos
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
