/**
 * Centralized validation schemas and error messages
 * Consolidates common Zod schemas and validation patterns
 */

import { z } from "zod";
import {
  CPF_REGEX,
  CNPJ_REGEX,
  PHONE_BR_REGEX,
  CEP_REGEX,
  STATE_REGEX,
  NAME_REGEX,
  PASSWORD_STRENGTH_REGEX,
  SAFE_FILENAME_REGEX,
  URL_REGEX,
  API_ENDPOINT_REGEX,
  validateCpfChecksum,
  validateCnpjChecksum,
} from "./regex-patterns";

// ===== COMMON VALIDATION SCHEMAS =====

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email("E-mail inválido")
  .max(254, "E-mail muito longo");

/**
 * Brazilian phone validation schema
 */
export const phoneBrSchema = z
  .string()
  .regex(PHONE_BR_REGEX, "Telefone deve estar no formato (XX) XXXXX-XXXX");

/**
 * Brazilian CPF validation schema
 */
export const cpfSchema = z
  .string()
  .regex(CPF_REGEX, "CPF deve estar no formato XXX.XXX.XXX-XX")
  .refine(validateCpfChecksum, "CPF inválido");

/**
 * Brazilian CNPJ validation schema
 */
export const cnpjSchema = z
  .string()
  .regex(CNPJ_REGEX, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX")
  .refine(validateCnpjChecksum, "CNPJ inválido");

/**
 * Brazilian ZIP code (CEP) validation schema
 */
export const cepSchema = z
  .string()
  .regex(CEP_REGEX, "CEP deve estar no formato XXXXX-XXX");

/**
 * Brazilian state code validation schema
 */
export const stateSchema = z
  .string()
  .length(2, "Estado deve ter 2 letras")
  .regex(STATE_REGEX, "Estado inválido");

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(100, "Nome muito longo")
  .regex(NAME_REGEX, "Nome contém caracteres inválidos");

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(PASSWORD_STRENGTH_REGEX, "Senha deve conter letras maiúsculas, minúsculas e números");

/**
 * Safe filename validation schema
 */
export const safeFilenameSchema = z
  .string()
  .min(1, "Nome do arquivo é obrigatório")
  .max(255, "Nome do arquivo muito longo")
  .regex(SAFE_FILENAME_REGEX, "Nome do arquivo contém caracteres inválidos");

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .regex(URL_REGEX, "URL inválida");

/**
 * API endpoint validation schema
 */
export const apiEndpointSchema = z
  .string()
  .regex(API_ENDPOINT_REGEX, "Endpoint inválido");

// ===== COMMON FIELD SCHEMAS =====

/**
 * User registration fields
 */
export const userRegistrationFields = {
  name: nameSchema,
  email: emailSchema,
  phone: phoneBrSchema.optional(),
  cpf: cpfSchema.optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
};

/**
 * Company registration fields
 */
export const companyRegistrationFields = {
  companyName: z
    .string()
    .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
    .max(200, "Nome da empresa muito longo"),

  cnpj: cnpjSchema,
  email: emailSchema,
  phone: phoneBrSchema,

  address: z.object({
    street: z.string().min(1, "Rua é obrigatória").max(200, "Rua muito longa"),
    number: z
      .string()
      .min(1, "Número é obrigatório")
      .max(20, "Número muito longo"),
    complement: z.string().max(100, "Complemento muito longo").optional(),
    neighborhood: z
      .string()
      .min(1, "Bairro é obrigatório")
      .max(100, "Bairro muito longo"),
    city: z
      .string()
      .min(1, "Cidade é obrigatória")
      .max(100, "Cidade muito longa"),
    state: stateSchema,
    zipCode: cepSchema,
  }),

  contactPerson: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneBrSchema,
  }),
};

/**
 * Lead form fields
 */
export const leadFormFields = {
  name: nameSchema,
  email: emailSchema,
  phone: phoneBrSchema,
  company: z.string().max(200, "Nome da empresa muito longo").optional(),
  message: z.string().max(1000, "Mensagem muito longa").optional(),
  consent: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar os termos de privacidade"),
};

/**
 * Newsletter subscription fields
 */
export const newsletterFields = {
  email: emailSchema,
  name: z.string().max(100, "Nome muito longo").optional(),
  interests: z.array(z.string()).max(5, "Máximo 5 interesses").optional(),
  consent: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar receber comunicações"),
};

// ===== UTILITY FUNCTIONS =====

/**
 * Create password confirmation validation
 */
export function createPasswordConfirmationSchema(passwordField: string = "password") {
  return z
    .object({
      [passwordField]: z.string(),
      confirmPassword: z.string(),
    })
    .refine((data) => data[passwordField] === data.confirmPassword, {
      message: "Senhas não coincidem",
      path: ["confirmPassword"],
    });
}

/**
 * Create file upload schema with custom constraints
 */
export function createFileUploadSchema(options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
} = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxFiles = 1,
  } = options;

  const fileSchema = z.object({
    name: safeFilenameSchema,
    size: z.number().max(maxSize, `Arquivo muito grande (máximo ${Math.round(maxSize / (1024 * 1024))}MB)`),
    type: z.string().refine(
      (type) => allowedTypes.includes(type),
      `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`
    ),
    content: z.string(), // Base64 encoded content
  });

  if (maxFiles === 1) {
    return z.object({
      file: fileSchema,
      metadata: z.object({
        description: z.string().max(500, "Descrição muito longa").optional(),
        tags: z.array(z.string()).max(10, "Máximo 10 tags").optional(),
      }).optional(),
    });
  }

  return z.object({
    files: z.array(fileSchema).max(maxFiles, `Máximo ${maxFiles} arquivos`),
    metadata: z.object({
      description: z.string().max(500, "Descrição muito longa").optional(),
      tags: z.array(z.string()).max(10, "Máximo 10 tags").optional(),
    }).optional(),
  });
}

// ===== TYPE EXPORTS =====

export type Email = z.infer<typeof emailSchema>;
export type PhoneBr = z.infer<typeof phoneBrSchema>;
export type Cpf = z.infer<typeof cpfSchema>;
export type Cnpj = z.infer<typeof cnpjSchema>;
export type Cep = z.infer<typeof cepSchema>;
export type State = z.infer<typeof stateSchema>;
export type Name = z.infer<typeof nameSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type SafeFilename = z.infer<typeof safeFilenameSchema>;
export type Url = z.infer<typeof urlSchema>;
export type ApiEndpoint = z.infer<typeof apiEndpointSchema>;
