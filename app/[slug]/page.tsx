import { headers } from "next/headers";
import { composePageFull } from "@/lib/composition/page-composer";
import { getServerFlags } from "@/lib/flags/server-flags";
import { FrozenFlagsProvider } from "@/lib/flags/context";
import { PageRenderer } from "@/lib/composition/page-renderer";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Handle special tenant routing
  if (slug === "admin") {
    redirect("/admin/experiments");
  }

  // For now, redirect tenant pages to main landing
  // Future: Implement tenant-specific composition
  redirect("/");

  // Legacy tenant-aware composition (disabled)
  /*
  const h = await headers()
  const tenantContext = {
    tenant: slug,
    campaign: h.get("x-campaign") ?? undefined,
    ab: (h.get("x-ab-variant") ?? "A") as "A" | "B" | "C",
    locale: (h.get("accept-language") ?? "en-US").split(",")[0] ?? "en-US",
    country: h.get("x-vercel-ip-country") ?? undefined
  }

  try {
    // Get server flags for consistent composition
    const serverFlags = await getServerFlags()

    // Compose page with tenant context
    const composition = await composePageFull('landing', {
      context: tenantContext // Future: tenant-aware composition
    }, {
      flags: serverFlags.flags
    })

    return (
      <FrozenFlagsProvider
        serverFlags={serverFlags.flags}
        serverExperiments={serverFlags.experiments}
      >
        <PageRenderer composition={composition} pageType="landing" />
      </FrozenFlagsProvider>
    )
  } catch {
    return notFound()
  }
  */
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Handle special tenant routing
  if (slug === "admin") {
    return {
      title: "Admin Dashboard - Luminaris",
      description: "Admin dashboard and management tools",
      robots: "noindex,nofollow",
    };
  }

  // For tenant pages, redirect to canonical landing
  // Future: tenant-specific metadata
  return {
    title: "DataFlow - Automação Empresarial com IA",
    description:
      "Transforme seus dados em insights acionáveis com IA inteligente.",
    alternates: {
      canonical: "/",
    },
  };

  // Legacy tenant-aware metadata (disabled)
  /*
  const h = await headers()
  const ctx = {
    tenant: slug,
    campaign: h.get("x-campaign") ?? undefined,
    ab: (h.get("x-ab-variant") ?? "A") as "A" | "B" | "C",
    locale: (h.get("accept-language") ?? "en-US").split(",")[0] ?? "en-US",
    country: h.get("x-vercel-ip-country") ?? undefined
  }
  const cfg = await resolvePageConfig(ctx)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
  return {
    title: cfg.seo.title,
    description: cfg.seo.description,
    openGraph: { title: cfg.seo.title, description: cfg.seo.description, images: cfg.seo.ogImage ? [cfg.seo.ogImage] : undefined },
    alternates: baseUrl ? { canonical: `${baseUrl}/${slug}` } : undefined
  }
  */
}
