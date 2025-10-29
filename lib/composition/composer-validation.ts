// Composer Validation System
// Ensures dynamic composers return consistent data between server and client

import { z } from "zod";

// Base schemas for composer data validation
export const VariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const ComposedEnvelopeSchema = z.object({
  content: z.any(),
  variant: VariantSchema,
  experiment: z
    .object({
      id: z.string(),
      variant: z.string(),
      isActive: z.boolean(),
    })
    .optional(),
  timestamp: z.number().optional(), // For cache validation
  version: z.string().optional(), // For data versioning
});

// Schema for section composition results
export const SectionCompositionSchema = z.object({
  id: z.string(),
  content: ComposedEnvelopeSchema.nullable(),
  enabled: z.boolean().default(true),
  order: z.number(),
  error: z.string().optional(),
});

// Alias kept for backward compatibility if referenced elsewhere
// Prefer ComposedEnvelopeSchema going forward
export const UpdatedComposedDataSchema = ComposedEnvelopeSchema;

// Page composition schema
export const PageCompositionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      content: ComposedEnvelopeSchema.nullable(), // Envelope with required variant; null only if section truly absent
      enabled: z.boolean().default(true),
      order: z.number(),
      error: z.string().optional(),
    }),
  ),
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
    ogImage: z.string().optional(),
  }),
  experiments: z.array(
    z.object({
      id: z.string(),
      variant: z.string(),
      sections: z.array(z.string()),
    }),
  ),
  analytics: z.object({
    pageType: z.string(),
    conversionGoals: z.array(z.string()),
  }),
});

// Validation functions
export function validateComposedData(
  data: any,
  schema = ComposedEnvelopeSchema,
) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : error,
      data: null,
    };
  }
}

// Strict envelope validator for runtime checks (client/server)
export function validateEnvelopeStrict(data: unknown): {
  success: boolean;
  error?: any;
} {
  try {
    ComposedEnvelopeSchema.parse(data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : error,
    };
  }
}

// Schema for just envelope validation (without variant/experiment)
export const EnvelopeOnlySchema = z.object({
  id: z.string(),
  type: z.string(),
  version: z.string(),
  timestamp: z.number(),
});

// Build-time envelope contract validator (throws on failure)
export function validateEnvelopeContract(
  data: unknown,
  sectionId?: string,
): void {
  // Support both direct envelope and envelope inside content
  let envelopeToValidate = data;

  // If data has content property, validate content.envelope instead
  if (
    data &&
    typeof data === "object" &&
    "content" in data &&
    data.content &&
    typeof data.content === "object" &&
    "envelope" in data.content
  ) {
    envelopeToValidate = (data as any).content.envelope;
  }

  // Use EnvelopeOnlySchema for direct envelope validation
  const result = z.safeParse(EnvelopeOnlySchema, envelopeToValidate);
  if (!result.success) {
    const errorMsg = `Envelope contract violation${sectionId ? ` for ${sectionId}` : ""}: ${JSON.stringify(result.error.issues)}`;
    console.error("[ENVELOPE_CONTRACT_VIOLATION]", errorMsg);
    throw new Error(errorMsg);
  }
}

export function validateSectionComposition(section: any): {
  success: boolean;
  error?: any;
} {
  try {
    SectionCompositionSchema.parse(section);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : error,
    };
  }
}

export function validatePageComposition(page: any): {
  success: boolean;
  error?: any;
} {
  try {
    PageCompositionSchema.parse(page);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : error,
    };
  }
}

// Composer guards - runtime validation for dynamic composition
export class ComposerGuard {
  private static validators = new Map<string, z.ZodSchema>();

  static registerValidator(composerId: string, schema: z.ZodSchema) {
    this.validators.set(composerId, schema);
  }

  // Register default validators for known composers
  static initializeValidators() {
    // Hero composer validator
    this.registerValidator(
      "hero-composer",
      z.object({
        content: z.object({
          headline: z.string(),
          subheadline: z.string(),
          primaryCta: z.string(),
          secondaryCta: z.string().optional(),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Benefits composer validator
    this.registerValidator(
      "benefits-composer",
      z.object({
        content: z.object({
          title: z.string(),
          subtitle: z.string(),
          benefits: z.array(
            z.object({
              icon: z.string(),
              title: z.string(),
              description: z.string(),
              metric: z.string(),
            }),
          ),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Features composer validator
    this.registerValidator(
      "features-composer",
      z.object({
        content: z.object({
          title: z.string(),
          subtitle: z.string(),
          features: z.array(z.any()),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Pricing composer validator
    this.registerValidator(
      "pricing-composer",
      z.object({
        content: z.object({
          title: z.string(),
          subtitle: z.string(),
          plans: z.array(z.any()),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Pricing Presale composer validator
    this.registerValidator(
      "pricing-presale",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          plans: z
            .array(
              z.object({
                name: z.string(),
                headline: z.string(),
                price: z.string(),
                period: z.string().optional(),
                originalPrice: z.string().optional(),
                description: z.string(),
                features: z.array(z.string()),
                benefits: z.array(z.string()),
                ctaText: z.string(),
                popular: z.boolean().optional(),
                limitedTime: z.boolean().optional(),
                guarantee: z.string().optional(),
              }),
            )
            .optional(),
          guarantee: z.string().optional(),
          urgencyText: z.string().optional(),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // FAQ composer validator
    this.registerValidator(
      "faq",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          items: z
            .array(
              z.object({
                question: z.string(),
                answer: z.string(),
                category: z.string().optional(),
                order: z.number().optional(),
              }),
            )
            .optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Final CTA composer validator
    this.registerValidator(
      "final-cta",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          primaryCtaText: z.string().optional(),
          primaryCtaLink: z.string().optional(),
          secondaryCtaText: z.string().optional(),
          secondaryCtaLink: z.string().optional(),
          backgroundImage: z.string().optional(),
          urgencyText: z.string().optional(),
          guarantee: z.string().optional(),
        }),
        variant: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
        }),
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Pillars composer validator
    this.registerValidator(
      "pillars",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          pillars: z
            .array(
              z.object({
                icon: z.any(),
                title: z.string(),
                description: z.string(),
                order: z.number().optional(),
              }),
            )
            .optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // How-it-works composer validator
    this.registerValidator(
      "how-it-works",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          steps: z
            .array(
              z.object({
                step: z.number().optional(),
                number: z.number().optional(),
                icon: z.any(),
                title: z.string(),
                description: z.string(),
                details: z.array(z.string()).optional(),
                benefits: z.array(z.string()).optional(),
                order: z.number().optional(),
              }),
            )
            .optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Verticals composer validator
    this.registerValidator(
      "verticals",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          verticals: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                icon: z.any(),
                description: z.string(),
                features: z.array(z.string()).optional(),
                kpis: z.array(z.string()).optional(),
                useCase: z.string().optional(),
                actions: z.array(z.string()).optional(),
                ctaText: z.string().optional(),
                order: z.number().optional(),
              }),
            )
            .optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Proof-traction composer validator
    this.registerValidator(
      "proof-traction",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          testimonials: z
            .array(
              z.object({
                quote: z.string(),
                author: z.string(),
                role: z.string().optional(),
                company: z.string().optional(),
                avatar: z.string().optional(),
                rating: z.number().optional(),
                metric: z.string().optional(),
              }),
            )
            .optional(),
          metrics: z
            .array(
              z.object({
                value: z.string(),
                label: z.string(),
                trend: z.string().optional(),
              }),
            )
            .optional(),
          badges: z.array(z.string()).optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Lead-form composer validator
    this.registerValidator(
      "lead-form",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          successMessage: z.string().optional(),
          errorMessage: z.string().optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Demo composer validator
    this.registerValidator(
      "demo",
      z.object({
        content: z.object({
          title: z.string(),
          subtitle: z.string(),
          description: z.string(),
          demoType: z.enum([
            "video",
            "interactive-tour",
            "screenshots",
            "live-demo",
            "hybrid",
          ]),
          primaryVideo: z
            .object({
              src: z.string(),
              poster: z.string().optional(),
              title: z.string(),
              duration: z.string().optional(),
              format: z.enum(["mp4", "webm", "youtube", "vimeo"]),
              videoId: z.string().optional(),
            })
            .optional(),
          screenshots: z
            .array(
              z.object({
                src: z.string(),
                alt: z.string(),
                title: z.string(),
                description: z.string().optional(),
                hotspot: z
                  .object({
                    x: z.number(),
                    y: z.number(),
                    label: z.string(),
                    description: z.string(),
                  })
                  .optional(),
              }),
            )
            .optional(),
          tourSteps: z
            .array(
              z.object({
                title: z.string(),
                description: z.string(),
                screenshot: z.any().optional(),
                video: z.any().optional(),
                cta: z
                  .object({
                    text: z.string(),
                    link: z.string(),
                  })
                  .optional(),
              }),
            )
            .optional(),
          features: z.object({
            title: z.string(),
            items: z.array(z.string()),
          }),
          stats: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
              }),
            )
            .optional(),
          cta: z.object({
            primary: z.object({
              text: z.string(),
              link: z.string(),
            }),
            secondary: z
              .object({
                text: z.string(),
                link: z.string(),
              })
              .optional(),
          }),
          testimonial: z
            .object({
              quote: z.string(),
              author: z.string(),
              role: z.string(),
              company: z.string(),
            })
            .optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Demo composer validator
    this.registerValidator(
      "demo-composer",
      z.object({
        content: z.object({
          title: z.string(),
          subtitle: z.string(),
          description: z.string(),
          demoType: z.enum([
            "video",
            "interactive-tour",
            "screenshots",
            "live-demo",
            "hybrid",
          ]),
          primaryVideo: z
            .object({
              src: z.string(),
              poster: z.string().optional(),
              title: z.string(),
              duration: z.string().optional(),
              format: z.enum(["mp4", "webm", "youtube", "vimeo"]),
              videoId: z.string().optional(),
            })
            .optional(),
          screenshots: z
            .array(
              z.object({
                src: z.string(),
                alt: z.string(),
                title: z.string(),
                description: z.string().optional(),
                hotspot: z
                  .object({
                    x: z.number(),
                    y: z.number(),
                    label: z.string(),
                    description: z.string(),
                  })
                  .optional(),
              }),
            )
            .optional(),
          tourSteps: z
            .array(
              z.object({
                title: z.string(),
                description: z.string(),
                screenshot: z.any().optional(),
                video: z.any().optional(),
                cta: z
                  .object({
                    text: z.string(),
                    link: z.string(),
                  })
                  .optional(),
              }),
            )
            .optional(),
          features: z.object({
            title: z.string(),
            items: z.array(z.string()),
          }),
          stats: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
              }),
            )
            .optional(),
          cta: z.object({
            primary: z.object({
              text: z.string(),
              link: z.string(),
            }),
            secondary: z
              .object({
                text: z.string(),
                link: z.string(),
              })
              .optional(),
          }),
          testimonial: z
            .object({
              quote: z.string(),
              author: z.string(),
              role: z.string(),
              company: z.string(),
            })
            .optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Footer composer validator
    this.registerValidator(
      "footer-composer",
      z.object({
        content: z.object({
          logo: z.object({
            src: z.string(),
            alt: z.string(),
            href: z.string().optional(),
          }),
          tagline: z.string().optional(),
          linkGroups: z.array(
            z.object({
              title: z.string(),
              links: z.array(
                z.object({
                  label: z.string(),
                  href: z.string(),
                  external: z.boolean().optional(),
                }),
              ),
            }),
          ),
          socialLinks: z.array(
            z.object({
              platform: z.enum([
                "linkedin",
                "twitter",
                "youtube",
                "github",
                "facebook",
                "instagram",
              ]),
              href: z.string(),
              icon: z.string(),
              label: z.string(),
            }),
          ),
          contact: z.object({
            email: z.string(),
            phone: z.string().optional(),
            address: z.string().optional(),
          }),
          newsletter: z
            .object({
              title: z.string(),
              placeholder: z.string(),
              buttonText: z.string(),
              privacyText: z.string(),
            })
            .optional(),
          legal: z.object({
            copyright: z.string(),
            links: z.array(
              z.object({
                label: z.string(),
                href: z.string(),
                external: z.boolean().optional(),
              }),
            ),
          }),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );

    // Social-proof composer validator
    this.registerValidator(
      "social-proof",
      z.object({
        content: z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          logos: z
            .array(
              z.object({
                src: z.string(),
                alt: z.string(),
                href: z.string().optional(),
              }),
            )
            .optional(),
          testimonials: z
            .array(
              z.object({
                quote: z.string(),
                author: z.string(),
                role: z.string().optional(),
                company: z.string().optional(),
                avatar: z.string().optional(),
                rating: z.number().optional(),
              }),
            )
            .optional(),
          metrics: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
                trend: z.string().optional(),
              }),
            )
            .optional(),
        }),
        variant: VariantSchema,
        experiment: z
          .object({
            id: z.string(),
            variant: z.string(),
            isActive: z.boolean(),
          })
          .optional(),
      }),
    );
  }

  static validate(composerId: string, data: any) {
    const validator = this.validators.get(composerId);
    if (!validator) {
      console.warn(`No validator registered for composer: ${composerId}`);
      return { success: true, data }; // Allow if no validator
    }

    try {
      return { success: true, data: validator.parse(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof z.ZodError ? error.issues : error,
        data: null,
      };
    }
  }
}

// Utility for content hashing
function getContentHash(content: any): string {
  if (!content) return "null";
  try {
    // Simple hash based on JSON stringification
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  } catch {
    return "unhashable";
  }
}

// Consistency checkers
export function checkCompositionConsistency(
  serverData: any,
  clientData: any,
  composerId: string,
): { consistent: boolean; differences: string[] } {
  const differences: string[] = [];

  // Check basic structure
  if (typeof serverData !== typeof clientData) {
    differences.push(
      `Type mismatch: server(${typeof serverData}) vs client(${typeof clientData})`,
    );
  }

  // Check variant consistency
  if (serverData?.variant?.id !== clientData?.variant?.id) {
    differences.push(
      `Variant mismatch: server(${serverData?.variant?.id}) vs client(${clientData?.variant?.id})`,
    );
  }

  // Check experiment consistency
  if (serverData?.experiment?.variant !== clientData?.experiment?.variant) {
    differences.push(
      `Experiment variant mismatch: server(${serverData?.experiment?.variant}) vs client(${clientData?.experiment?.variant})`,
    );
  }

  // Check content hash for complex objects
  const serverHash = getContentHash(serverData?.content);
  const clientHash = getContentHash(clientData?.content);
  if (serverHash !== clientHash) {
    differences.push(
      `Content hash mismatch: server(${serverHash}) vs client(${clientHash})`,
    );
  }

  return {
    consistent: differences.length === 0,
    differences,
  };
}

// Server-side composition marker
export function markServerComposed(data: any) {
  return {
    ...data,
    _composedOn: "server",
    _timestamp: Date.now(),
    _version: process.env.COMPOSITION_VERSION || "1.0.0",
  };
}

// Client-side composition validation
export function validateClientComposition(serverData: any, clientData: any) {
  if (!serverData._composedOn) {
    console.warn("Server data not properly marked as server-composed");
    return true; // Allow if not marked
  }

  const consistency = checkCompositionConsistency(
    serverData,
    clientData,
    "unknown",
  );

  if (!consistency.consistent) {
    console.error(
      "Composition inconsistency detected:",
      consistency.differences,
    );

    // In development, throw error to catch issues
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `Composition inconsistency: ${consistency.differences.join(", ")}`,
      );
    }

    return false;
  }

  return true;
}

// Safe composition wrapper
export function withCompositionValidation<T>(
  composerFn: () => T,
  composerId: string,
  options: { enableValidation?: boolean } = {},
): T {
  const { enableValidation = true } = options;

  try {
    console.log(`🔍 withCompositionValidation called for ${composerId}`);
    const result = composerFn();
    console.log(`✅ Composer function executed for ${composerId}`);

    if (enableValidation) {
      console.log(`🔍 Validating result for ${composerId}`);
      const validation = ComposerGuard.validate(composerId, result);
      console.log(
        `🔍 Validation result for ${composerId}:`,
        validation.success ? "SUCCESS" : "FAILED",
      );

      if (!validation.success) {
        console.error(
          `❌ Composer validation failed for ${composerId}:`,
          validation.error,
        );

        // In development, throw error
        if (process.env.NODE_ENV === "development") {
          throw new Error(
            `Composer validation failed: ${JSON.stringify(validation.error)}`,
          );
        }

        // Return fallback on validation failure
        return {
          content: null,
          variant: {
            id: "validation-error",
            name: "Validation Error Fallback",
            description: "Validation failed",
          },
          error: `Validation failed: ${JSON.stringify(validation.error)}`,
        } as T;
      }
    }

    // Mark as server-composed if running on server
    if (typeof window === "undefined") {
      const marked = markServerComposed(result);
      console.log(`✅ Marked as server-composed for ${composerId}`);
      return marked;
    }

    console.log(`✅ Returning result for ${composerId}`);
    return result;
  } catch (error) {
    console.error(`❌ Composition error in ${composerId}:`, error);

    // Return safe fallback
    return {
      content: null,
      variant: {
        id: "error",
        name: "Error Fallback",
        description: "Emergency error fallback",
      },
      error:
        error instanceof Error ? error.message : "Unknown composition error",
    } as T;
  }
}
