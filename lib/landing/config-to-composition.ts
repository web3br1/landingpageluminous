// Convert PageConfig (landing) to composition accepted by PageRenderer
import type { PageComposition } from "@/lib/composition/ports";
import type { PageConfig as LandingPageConfig } from "./config-schema";

export function toComposition(cfg: LandingPageConfig): PageComposition {
  return {
    sections: cfg.sections
      .filter((s) => s.visible)
      .map((s, index) => ({
        id: s.id as unknown,
        component: s.kind,
        content: s.props as unknown,
        order: index,
        enabled: true,
      })),
    metadata: {
      title: cfg.seo.title,
      description: cfg.seo.description,
      keywords: [],
      ogImage: cfg.seo.ogImage,
    },
    experiments: [],
    analytics: {
      pageType: "landing",
      conversionGoals: [],
    },
    pageType: "landing",
  };
}
