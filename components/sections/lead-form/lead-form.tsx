"use client";

import { z } from "zod";
import { LeadFormContent } from "@/domains/marketing/types/lead-form.types";
import { AdvancedForm } from "@/components/ui/advanced-form";
import { SimpleErrorBoundary } from "@/lib/architecture/error-boundary-pattern";
import { withComponentContext } from "@/lib/architecture/logger-pattern";
import { useValidatedProps } from "@/lib/architecture/component-props";

interface LeadFormProps {
  content: LeadFormContent;
  sectionId?: string;
  // For testing: allow injecting delay function
  delayFunction?: (ms: number) => Promise<void>;
}

// Internal lead form component implementation
function LeadFormInternal({
  content,
  sectionId = "lead-form",
  delayFunction,
}: LeadFormProps) {
  const logger = withComponentContext("lead-form", "render");

  // Log component initialization
  logger.debug("Initializing lead form", {
    sectionId,
    fieldCount: content.fields?.length || 0,
    hasDelayFunction: !!delayFunction
  });

  // Create Zod schema from content fields
  const createSchema = () => {
    const schemaFields: Record<string, z.ZodType<unknown>> = {};

    content.fields?.forEach((field) => {
      let fieldSchema: z.ZodType<unknown>;

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
    const submitLogger = withComponentContext("lead-form", "submit");

    try {
      submitLogger.info("Form submission started", {
        sectionId,
        fieldCount: Object.keys(data).length
      });

      // Simulate API call - use injected delay function or default
      const defaultDelay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const delay = delayFunction || defaultDelay;
      // Much faster in test environment to avoid timeouts but still async
      const timeout = process.env.NODE_ENV === "test" ? 10 : 1000;

      await delay(timeout);

      // Here you would typically send the data to your API
      submitLogger.info("Form submitted successfully", {
        sectionId,
        fieldCount: Object.keys(data).length,
        hasDelayFunction: !!delayFunction
      });

      // Log success without sensitive data
      submitLogger.info("Lead form submission completed", {
        sectionId,
        fieldNames: Object.keys(data),
        environment: process.env.NODE_ENV
      });

    } catch (error) {
      submitLogger.error(
        "Form submission failed",
        error instanceof Error ? error : undefined,
        { sectionId, hasDelayFunction: !!delayFunction }
      );
      throw error; // Re-throw to let the form component handle it
    }
  };

  return (
    <AdvancedForm
      title={content.title}
      subtitle={content.subtitle}
      fields={formFields}
      schema={schema}
      submitText={content.submitButton?.text || "Enviar"}
      successMessage={content.successMessage}
      sanitizeInputs={true}
      loadingText="Enviando..."
      privacyText={content.privacyText}
      sectionId={sectionId}
      backendRateLimit={{
        action: "lead_form_submit",
        maxRetries: 3,
        retryDelay: 1000,
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

// Main LeadForm component with error boundary and props validation
export function LeadForm(props: LeadFormProps) {
  // Validate props using our pattern
  const validatedProps = useValidatedProps(props, z.object({
    content: z.any(), // LeadFormContent validation would be complex, using any for now
    sectionId: z.string().optional(),
    delayFunction: z.custom<(ms: number) => Promise<void>>().optional(),
  }), {
    componentName: "LeadForm",
    logErrors: true,
    fallbackValues: {
      sectionId: "lead-form"
    }
  });

  return (
    <SimpleErrorBoundary
      maxRetries={2}
      onError={(error) => {
        withComponentContext("lead-form", "errorBoundary").error(
          "Lead form error boundary triggered",
          error,
          { sectionId: validatedProps.sectionId }
        );
      }}
      fallback={(error, retry) => (
        <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Formulário Indisponível
            </h3>
            <p className="text-red-700 mb-4">
              Houve um problema ao carregar o formulário. Tente novamente.
            </p>
            <div className="space-y-2">
              <button
                onClick={retry}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <LeadFormInternal {...validatedProps} />
    </SimpleErrorBoundary>
  );
}
