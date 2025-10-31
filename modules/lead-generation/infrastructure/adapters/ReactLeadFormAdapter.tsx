// Adapter - Conecta o mundo React com o domínio DDD
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  SubmitLeadUseCase,
  SubmitLeadInput,
} from "../../application/use-cases/SubmitLeadUseCase";
import { LocalStorageLeadRepository } from "../repositories/LocalStorageLeadRepository";
import { Result, isOk, isErr } from "../../../../shared/core/Result";

// DTO para comunicação com React Hook Form
const leadFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  segment: z.enum(["salao", "ecommerce", "contabil", "industria", "outros"]),
  revenue: z.enum(["ate-100k", "100k-500k", "500k-1m", "1m-5m", "mais-5m"]),
  painPoint: z
    .string()
    .min(10, "Descreva sua dor com pelo menos 10 caracteres"),
  consent: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar os termos"),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface ReactLeadFormAdapterProps {
  onSuccess: (result: {
    requiresImmediateFollowUp: boolean;
    isHighValue: boolean;
  }) => void;
  onError: (error: string) => void;
}

export function ReactLeadFormAdapter({
  onSuccess,
  onError,
}: ReactLeadFormAdapterProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instancia a arquitetura DDD
  const leadRepository = new LocalStorageLeadRepository();
  const submitLeadUseCase = new SubmitLeadUseCase(leadRepository);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      // Converte DTO do form para Input do Use Case
      const input: SubmitLeadInput = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        segment: data.segment,
        revenue: data.revenue,
        painPoint: data.painPoint,
        consent: data.consent,
      };

      // Executa o use case (lógica de negócio pura)
      const result = await submitLeadUseCase.execute(input);

      if (isOk(result)) {
        // Sucesso - lógica de apresentação
        reset();
        const data = result.value as {
          lead: unknown;
          requiresImmediateFollowUp: boolean;
          isHighValue: boolean;
        };
        onSuccess({
          requiresImmediateFollowUp: data.requiresImmediateFollowUp,
          isHighValue: data.isHighValue,
        });

        // Aqui você poderia disparar analytics, notificações, etc.
        console.log("Lead criado:", data.lead.id || "ID não disponível");
      } else {
        // Erro - tratamento baseado no tipo de erro
        const error = result.error;

        switch (error.type) {
          case "VALIDATION_ERROR":
            onError("Dados inválidos: " + error.message);
            break;
          case "DUPLICATE_ERROR":
            onError(
              "Este e-mail já foi cadastrado. Quer atualizar seus dados?",
            );
            break;
          case "PERSISTENCE_ERROR":
            onError("Erro ao salvar dados. Tente novamente.");
            break;
          default:
            onError("Erro inesperado. Entre em contato conosco.");
        }
      }
    } catch (unexpectedError) {
      // Fallback para erros não tratados
      onError("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields aqui */}
      <input {...register("name")} placeholder="Nome" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} placeholder="E-mail" type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register("phone")} placeholder="Telefone" />
      {errors.phone && <span>{errors.phone.message}</span>}

      <select {...register("segment")}>
        <option value="salao">Salão de Beleza</option>
        <option value="ecommerce">E-commerce</option>
        <option value="contabil">Contabilidade</option>
        <option value="industria">Indústria</option>
        <option value="outros">Outros</option>
      </select>
      {errors.segment && <span>{errors.segment.message}</span>}

      <select {...register("revenue")}>
        <option value="ate-100k">Até R$ 100.000</option>
        <option value="100k-500k">R$ 100k - R$ 500k</option>
        <option value="500k-1m">R$ 500k - R$ 1M</option>
        <option value="1m-5m">R$ 1M - R$ 5M</option>
        <option value="mais-5m">Mais de R$ 5M</option>
      </select>
      {errors.revenue && <span>{errors.revenue.message}</span>}

      <textarea
        {...register("painPoint")}
        placeholder="Qual sua principal dor?"
      />
      {errors.painPoint && <span>{errors.painPoint.message}</span>}

      <label>
        <input {...register("consent")} type="checkbox" />
        Aceito os termos de privacidade
      </label>
      {errors.consent && <span>{errors.consent.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Entrar na pré-venda"}
      </button>
    </form>
  );
}
