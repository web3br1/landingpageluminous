import { resolvePageConfig } from "../../landing/config-resolver";
import * as sources from "../../landing/config-sources";

describe("resolvePageConfig", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("prioritizes campaign over base and overrides over campaign", async () => {
    jest.spyOn(sources, "getBaseByTenant").mockResolvedValue({
      seo: { title: "Base", description: "B" },
      sections: [{ id: "hero", kind: "Hero", props: { title: "Base" } }],
    } as any);

    jest.spyOn(sources, "getCampaignConfig").mockResolvedValue({
      seo: { title: "Campaign" },
      sections: [{ id: "hero", kind: "Hero", props: { title: "Campaign" } }],
    } as any);

    jest.spyOn(sources, "getOverrides").mockResolvedValue({
      sections: [{ id: "hero", kind: "Hero", props: { title: "Override" } }],
    } as any);

    const cfg = await resolvePageConfig({
      tenant: "acme",
      campaign: "bf-25",
      ab: "A",
      locale: "en-US",
    });
    expect(cfg.tenant).toBe("acme");
    expect(cfg.locale).toBe("en-US");
    expect(cfg.seo.title).toBe("Campaign");
    const hero = cfg.sections.find((s: any) => s.id === "hero");
    expect((hero as any)?.props?.title).toBe("Override");
  });
});
