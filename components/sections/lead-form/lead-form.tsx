"use client";

import { z } from "zod";
import { LeadFormContent } from "@/domains/marketing/types/lead-form.types";
import { AdvancedForm } from "@/components/ui/advanced-form";

interface LeadFormProps {
  content: LeadFormContent;
  sectionId?: string;
  // For testing: allow injecting delay function
  delayFunction?: (ms: number) => Promise<void>;
}

export function LeadForm({
  content,
  sectionId = "lead-form",
  delayFunction,
}: LeadFormProps) {
  // Create Zod schema from content fields
  const createSchema = () => {
    const schemaFields: Record<string, z.ZodType<any>> = {};

    content.fields?.forEach((field) => {
      let fieldSchema: z.ZodType<any>;

      switch (field.type) {
        case "email":
          fieldSchema = z.string().email("E-mail inválido");
          break;
        case "tel":
          fieldSchema = z
            .string()
            .min(10, "Telefone deve ter pelo menos 10 dígitos");
          break;
        case "select":
          fieldSchema = z.string().min(1, `${field.label} é obrigatório`);
          break;
        case "textarea":
          fieldSchema = z
            .string()
            .min(10, `${field.label} deve ter pelo menos 10 caracteres`);
          break;
        default:
          fieldSchema = z.string().min(1, `${field.label} é obrigatório`);
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.name] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const schema = createSchema();
  type FormData = z.infer<typeof schema>;

  // Convert content fields to form field config
  const formFields =
    content.fields?.map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type as "text" | "email" | "tel" | "select" | "textarea",
      placeholder: field.placeholder,
      required: field.required,
      options: field.options,
      rows: field.type === "textarea" ? 4 : undefined,
    })) || [];

  const handleSubmit = async (data: FormData) => {
    // Simulate API call - use injected delay function or default
    const defaultDelay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const delay = delayFunction || defaultDelay;
    // Much faster in test environment to avoid timeouts but still async
    const timeout = process.env.NODE_ENV === "test" ? 10 : 1000;
    await delay(timeout);

    // Here you would typically send the data to your API
    console.log("Form submitted:", data);
  };

  return (
    <AdvancedForm
      title={content.title}
      subtitle={content.subtitle}
      fields={formFields}
      schema={schema}
      submitText={content.submitButton?.text || "Enviar"}
      successMessage={content.successMessage}
      privacyText={content.privacyText}
      sectionId={sectionId}
      backendRateLimit={{
        action: "lead_form_submit",
        fallbackToClient: true,
        clientFallbackConfig: {
          maxAttempts: 3,
          windowMs: 60000,
          blockDurationMs: 180000,
        },
      }}
      onSubmit={handleSubmit}
    />
  );
}
