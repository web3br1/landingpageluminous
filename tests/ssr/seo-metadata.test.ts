import { describe, it, expect } from "vitest";
import { generateMetadata } from "@/app/page";

describe("SEO Metadata SSR", () => {
  it("generateMetadata retorna metadados básicos corretos", async () => {
    const metadata = await generateMetadata();

    expect(metadata).toBeDefined();
    expect(metadata.title).toContain("Seu Copiloto de Automação Empresarial");
    expect(metadata.description).toMatch(/IA/);
    expect(metadata.description).toMatch(/fluxos/);
  });

  it("openGraph metadata está completo", async () => {
    const metadata = await generateMetadata();

    expect(metadata.openGraph?.title).toContain(
      "Seu Copiloto de Automação Empresarial",
    );
    expect(metadata.openGraph?.description).toMatch(/IA/);
    expect(metadata.openGraph?.type).toBe("website");
  });

  it("twitter metadata está completo", async () => {
    const metadata = await generateMetadata();

    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.twitter?.title).toContain(
      "Seu Copiloto de Automação Empresarial",
    );
    expect(metadata.twitter?.description).toMatch(/IA/);
  });

  it("keywords incluem termos de SEO relevantes", async () => {
    const metadata = await generateMetadata();

    const keywords = metadata.keywords as string[];
    expect(keywords).toContain("automação empresarial");
    expect(keywords).toContain("IA");
    expect(keywords).toContain("inteligência artificial");
    expect(keywords).toContain("processos empresariais");
    expect(keywords).toContain("automação de workflows");
  });
});
