import "server-only";
import { cache } from "react";

async function getKv(): Promise<{
  get: (key: string) => Promise<unknown>;
} | null> {
  try {
    // Dynamic import to avoid hard dependency in environments without @vercel/kv
    // @ts-ignore - types optional at build time
    const mod = await import("@vercel/kv");
    return mod.kv as { get: (key: string) => Promise<unknown> };
  } catch {
    return null;
  }
}

export const getBaseByTenant = cache(async (tenant: string) => {
  const kvClient = await getKv();
  if (kvClient) {
    const kvKey = `tenant:${tenant}:base`;
    const kvValue = await kvClient.get(kvKey);
    if (kvValue) return kvValue as Record<string, unknown>;
  }
  const local = await import(
    `@/domains/marketing/content/tenants/${tenant}.ts`
  ).then((m) => m.default);
  return local as Record<string, unknown>;
});

export const getCampaignConfig = cache(async (campaign: string) => {
  const kvClient = await getKv();
  if (!kvClient) return null;
  const data = await kvClient.get(`campaign:${campaign}`);
  return (data as Record<string, unknown>) ?? null;
});

export async function getOverrides(ctx: {
  country?: string;
  ab: "A" | "B" | "C";
}) {
  const o: Record<string, unknown> = {};
  if (ctx.country === "BR") o.theme = "brand";
  if (ctx.ab === "B")
    o.sections = [{ id: "hero", kind: "Banner", props: { tone: "alt" } }];
  return o;
}
