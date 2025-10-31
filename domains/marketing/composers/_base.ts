// Base utilities for marketing composers to reduce duplication
import { withCompositionValidation } from "@/lib/composition/composer-validation";
import { flags } from "@/lib/flags";

export type VariantWithContent<TContent> = {
  id: string;
  name: string;
  description: string;
  content: TContent;
};

export type ComposerResult<TContent> = {
  content: TContent;
  variant: VariantWithContent<TContent>;
  envelope: {
    id: string;
    type: string;
    version: string;
    timestamp: number;
  };
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
};

export function createVariantComposer<TContent>(
  composerId: string,
  config: {
    defaultVariant: string;
    variants: Array<VariantWithContent<TContent>>;
    experimentId?: string;
  },
) {
  return async () =>
    await withCompositionValidation(async () => {
      const experimentId = config.experimentId ?? `${composerId}_variant`;
      const selected = flags.getExperimentVariant(experimentId);
      const effectiveVariantId =
        selected === "control" ? config.defaultVariant : selected;
      const variant =
        config.variants.find((v) => v.id === effectiveVariantId) ||
        config.variants[0];

      // Extract section name from composerId (e.g., 'benefits-composer' -> 'benefits')
      const sectionName = composerId.replace("-composer", "");

      // Add envelope inside content as expected by tests
      const contentWithEnvelope = {
        ...variant.content,
        envelope: {
          id: sectionName,
          type: sectionName,
          version: "1.0.0",
          timestamp: Date.now(),
        },
      };

      const result: ComposerResult<TContent> = {
        content: contentWithEnvelope,
        variant: {
          id: variant.id,
          name: variant.name,
          description: variant.description,
          content: contentWithEnvelope,
        },
        envelope: {
          id: sectionName,
          type: sectionName,
          version: "1.0.0",
          timestamp: Date.now(),
        },
      };

      if (selected && selected !== "control") {
        result.experiment = {
          id: experimentId,
          variant: selected,
          isActive: true,
        };
      }

      return result;
    }, composerId);
}
