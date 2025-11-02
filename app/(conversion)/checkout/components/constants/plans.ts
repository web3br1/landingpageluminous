import type { Plan } from "../types/checkout.types";

export const availablePlans: Plan[] = [
  {
    id: "starter",
    name: "Iniciante",
    price: 97,
    originalPrice: 127,
    interval: "monthly",
    description: "Perfeito para pequenos negócios começando",
    features: [
      "Até 3 usuários",
      "5 dashboards personalizados",
      "Integração com 2 fontes de dados",
      "Relatórios automáticos semanais",
      "Suporte por email",
      "Backup diário",
    ],
    discount: 24,
  },
  {
    id: "professional",
    name: "Profissional",
    price: 237, // Annual price / 12
    originalPrice: 297,
    interval: "monthly",
    description: "Para empresas em crescimento",
    features: [
      "Até 15 usuários",
      "Dashboards ilimitados",
      "Integração com APIs ilimitadas",
      "Relatórios em tempo real",
      "Alertas inteligentes automáticos",
      "Suporte prioritário",
      "API para integrações customizadas",
      "Backup em tempo real",
    ],
    popular: true,
    discount: 20,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    interval: "monthly",
    description: "Soluções personalizadas para grandes empresas",
    features: [
      "Usuários ilimitados",
      "Soluções customizadas",
      "Integrações enterprise",
      "Suporte dedicado 24/7",
      "SLA garantido",
      "Auditoria e compliance",
      "Treinamento da equipe",
      "Implementação assistida",
    ],
  },
];

export const initialPaymentData = {
  paymentMethod: "card" as const,
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  cardName: "",
  installments: 1,
  cpf: "",
  acceptTerms: false,
};
