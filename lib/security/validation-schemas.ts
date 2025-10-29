import { z } from "zod";

// ===== BASE SCHEMAS =====

/**
 * Brazilian document validation
 */
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;

/**
 * Custom CPF validation
 */
const cpfValidation = z
  .string()
  .regex(cpfRegex, "CPF deve estar no formato XXX.XXX.XXX-XX")
  .refine((cpf) => {
    const cleaned = cpf.replace(/\D/g, "");

    // Check for repeated digits
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // CPF validation algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;

    return remainder === parseInt(cleaned[10]);
  }, "CPF inválido");

/**
 * Custom CNPJ validation
 */
const cnpjValidation = z
  .string()
  .regex(cnpjRegex, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX")
  .refine((cnpj) => {
    const cleaned = cnpj.replace(/\D/g, "");

    // Check for repeated digits
    if (/^(\d)\1+$/.test(cleaned)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i];
    }

    let remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    if (remainder !== parseInt(cleaned[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i];
    }

    remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    return remainder === parseInt(cleaned[13]);
  }, "CNPJ inválido");

// ===== USER INPUT SCHEMAS =====

export const UserRegistrationSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Nome contém caracteres inválidos"),

    email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

    phone: z
      .string()
      .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX")
      .optional(),

    cpf: cpfValidation.optional(),

    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter letras maiúsculas, minúsculas e números",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export const UserLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),

  password: z.string().min(1, "Senha é obrigatória"),

  rememberMe: z.boolean().optional(),
});

export const PasswordResetSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),

    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .max(128, "Nova senha muito longa")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Nova senha deve conter letras maiúsculas, minúsculas e números",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

// ===== COMPANY INPUT SCHEMAS =====

export const CompanyRegistrationSchema = z.object({
  companyName: z
    .string()
    .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
    .max(200, "Nome da empresa muito longo"),

  cnpj: cnpjValidation,

  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

  phone: z
    .string()
    .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX"),

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
    state: z
      .string()
      .length(2, "Estado deve ter 2 letras")
      .regex(/^[A-Z]{2}$/, "Estado inválido"),
    zipCode: z.string().regex(cepRegex, "CEP deve estar no formato XXXXX-XXX"),
  }),

  contactPerson: z.object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo")
      .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Nome contém caracteres inválidos"),

    email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

    phone: z
      .string()
      .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  }),
});

// ===== LEAD FORM SCHEMAS =====

export const LeadFormSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Nome contém caracteres inválidos"),

  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

  phone: z
    .string()
    .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX"),

  company: z.string().max(200, "Nome da empresa muito longo").optional(),

  message: z.string().max(1000, "Mensagem muito longa").optional(),

  // GDPR consent
  consent: z
    .boolean()
    .refine(
      (val) => val === true,
      "Você deve aceitar os termos de privacidade",
    ),

  // Source tracking
  source: z.string().optional(),
  campaign: z.string().optional(),
  medium: z.string().optional(),
});

// ===== NEWSLETTER SCHEMAS =====

export const NewsletterSubscriptionSchema = z.object({
  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

  name: z.string().max(100, "Nome muito longo").optional(),

  interests: z.array(z.string()).max(5, "Máximo 5 interesses").optional(),

  consent: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar receber comunicações"),
});

// ===== CONTACT FORM SCHEMAS =====

export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Nome contém caracteres inválidos"),

  email: z.string().email("E-mail inválido").max(254, "E-mail muito longo"),

  phone: z
    .string()
    .regex(phoneRegex, "Telefone deve estar no formato (XX) XXXXX-XXXX")
    .optional(),

  subject: z
    .string()
    .min(5, "Assunto deve ter pelo menos 5 caracteres")
    .max(200, "Assunto muito longo"),

  message: z
    .string()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(2000, "Mensagem muito longa"),

  priority: z
    .enum(["low", "normal", "high", "urgent"])
    .optional()
    .default("normal"),

  department: z
    .enum(["sales", "support", "billing", "technical", "general"])
    .optional()
    .default("general"),
});

// ===== SEARCH AND FILTER SCHEMAS =====

export const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, "Termo de busca é obrigatório")
    .max(200, "Termo de busca muito longo")
    .regex(/^[^<>\"'&]*$/, "Termo de busca contém caracteres inválidos"),

  filters: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).max(10, "Máximo 10 tags").optional(),
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
      status: z.enum(["active", "inactive", "draft"]).optional(),
    })
    .optional(),

  pagination: z
    .object({
      page: z.number().int().min(1).max(1000).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
});

// ===== FILE UPLOAD SCHEMAS =====

export const FileUploadSchema = z.object({
  file: z.object({
    name: z
      .string()
      .min(1, "Nome do arquivo é obrigatório")
      .max(255, "Nome do arquivo muito longo")
      .regex(/^[^<>\"'&]*$/, "Nome do arquivo contém caracteres inválidos"),

    size: z
      .number()
      .max(10 * 1024 * 1024, "Arquivo muito grande (máximo 10MB)"), // 10MB

    type: z.string().refine((type) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      return allowedTypes.includes(type);
    }, "Tipo de arquivo não permitido"),

    content: z.string(), // Base64 encoded content
  }),

  metadata: z
    .object({
      description: z.string().max(500, "Descrição muito longa").optional(),
      tags: z.array(z.string()).max(10, "Máximo 10 tags").optional(),
    })
    .optional(),
});

// ===== API REQUEST SCHEMAS =====

export const ApiRequestSchema = z.object({
  endpoint: z.string().regex(/^\/[a-zA-Z0-9\-_\/]*$/, "Endpoint inválido"),

  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),

  headers: z.object({}).catchall(z.string()).optional().default({}),

  body: z.any().optional(),

  queryParams: z.object({}).catchall(z.string()).optional().default({}),

  // Rate limiting
  clientId: z.string().optional(),
  userId: z.string().optional(),
});

// ===== CONFIGURATION SCHEMAS =====

export const AppConfigSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),

  database: z.object({
    host: z.string().min(1, "Host é obrigatório"),
    port: z.number().int().min(1).max(65535),
    database: z.string().min(1, "Nome do banco é obrigatório"),
    username: z.string().min(1, "Usuário é obrigatório"),
    // Password is handled separately for security
    ssl: z.boolean().default(true),
    connectionTimeout: z.number().int().min(1000).max(30000).default(10000),
  }),

  redis: z
    .object({
      host: z.string().min(1, "Redis host é obrigatório"),
      port: z.number().int().min(1).max(65535).default(6379),
      password: z.string().optional(),
      db: z.number().int().min(0).max(15).default(0),
    })
    .optional(),

  email: z.object({
    provider: z.enum(["smtp", "sendgrid", "ses"]),
    from: z.string().email("E-mail de remetente inválido"),
    smtp: z
      .object({
        host: z.string().min(1, "SMTP host é obrigatório"),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean().default(true),
        auth: z.object({
          user: z.string().min(1, "SMTP user é obrigatório"),
          // Password handled separately
        }),
      })
      .optional(),
  }),

  security: z.object({
    jwtSecret: z
      .string()
      .min(32, "JWT secret deve ter pelo menos 32 caracteres"),
    bcryptRounds: z.number().int().min(8).max(16).default(12),
    rateLimit: z.object({
      windowMs: z.number().int().min(1000).max(3600000).default(900000), // 15 minutes
      maxRequests: z.number().int().min(1).max(1000).default(100),
    }),
    corsOrigins: z.array(z.string().url()).default(["http://localhost:3000"]),
  }),
});

// ===== TYPE EXPORTS =====

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type PasswordReset = z.infer<typeof PasswordResetSchema>;
export type PasswordChange = z.infer<typeof PasswordChangeSchema>;

export type CompanyRegistration = z.infer<typeof CompanyRegistrationSchema>;

export type LeadForm = z.infer<typeof LeadFormSchema>;
export type NewsletterSubscription = z.infer<
  typeof NewsletterSubscriptionSchema
>;
export type ContactForm = z.infer<typeof ContactFormSchema>;

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;

export type ApiRequest = z.infer<typeof ApiRequestSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
