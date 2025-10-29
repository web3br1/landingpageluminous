import { toComposition } from "../../landing/config-to-composition";

describe("toComposition contract", () => {
  it("maps PageConfig to PageRenderer composition shape", () => {
    const cfg: any = {
      tenant: "acme",
      locale: "en-US",
      abVariant: "A",
      theme: "brand",
      seo: { title: "T", description: "D" },
      sections: [
        { id: "hero", kind: "Hero", visible: true, props: { title: "Hello" } },
        { id: "pricing", kind: "Pricing", visible: false, props: {} },
      ],
    };
    const comp = toComposition(cfg);
    expect(comp.metadata.title).toBe("T");
    expect(Array.isArray(comp.sections)).toBe(true);
    expect(comp.sections.find((s: any) => s.id === "hero")?.component).toBe(
      "Hero",
    );
    expect(comp.sections.find((s: any) => s.id === "pricing")).toBeUndefined();
  });
});
