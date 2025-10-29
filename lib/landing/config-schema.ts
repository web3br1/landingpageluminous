import { z } from "zod";

export const SectionBase = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  visible: z.boolean().default(true),
  props: z.object({}).catchall(z.unknown()).default({}),
});

export const PageConfig = z.object({
  tenant: z.string(),
  locale: z.string().default("en-US"),
  abVariant: z.enum(["A", "B", "C"]).default("A"),
  theme: z.enum(["light", "dark", "brand"]).default("brand"),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().url().optional(),
  }),
  sections: z.array(SectionBase).min(1),
});

export type PageConfig = z.infer<typeof PageConfig>;
