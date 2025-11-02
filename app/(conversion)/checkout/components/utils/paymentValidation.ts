import type { PaymentData, PaymentErrors } from "../types/checkout.types";

// Função extraída para validação de pagamento
export function validatePayment(
  paymentData: PaymentData,
  setErrors: (errors: PaymentErrors) => void
): boolean {
  const newErrors: PaymentErrors = {};

  if (paymentData.paymentMethod === "card") {
    if (!paymentData.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
      newErrors.cardNumber = "Número do cartão inválido";
    }
    if (!paymentData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiryDate = "Data inválida (MM/AA)";
    }
    if (!paymentData.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = "CVV inválido";
    }
    if (!paymentData.cardName.trim()) {
      newErrors.cardName = "Nome obrigatório";
    }
  }

  if (!paymentData.cpf.match(/^\d{11}$/)) {
    newErrors.cpf = "CPF inválido";
  }

  if (!paymentData.acceptTerms) {
    newErrors.acceptTerms = "Você deve aceitar os termos";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}
