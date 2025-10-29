import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { DynamicMetadataGenerator } from "@/lib/seo/dynamic-metadata";
import { getServerFlags } from "@/lib/flags/server-flags";
import { FrozenFlagsProvider } from "@/lib/flags/context";
import PageRenderer from "./page-renderer";

// ISR: Revalidate content every hour for dynamic landing page
export const revalidate = 3600;

// Generate dynamic metadata based on content composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Get server flags for consistent metadata generation
    const serverFlags = await getServerFlags();

    // Get page composition for dynamic metadata
    const composition = await composePageFull(
      "landing",
      {
        experiments: serverFlags.experiments,
        featureFlags: serverFlags.flags,
      },
      {
        flags: serverFlags.flags,
      },
    );

    // Generate metadata with basic landing page info
    // Experiment data would be handled by the composition system
    return DynamicMetadataGenerator.generateLandingPageMetadata(
      undefined, // experimentId - would come from composition system
      undefined, // experimentVariant - would come from composition system
    );
  } catch (error) {
    console.error(
      "Failed to generate dynamic metadata, using fallback:",
      error,
    );

    // Fallback metadata
    return {
      title: "Sistema de Automação Empresarial - DataFlow Brasil",
      description:
        "Plataforma completa de business intelligence para PMEs brasileiras. Relatórios automáticos, dashboards interativos e insights em tempo real.",
      keywords: [
        "business intelligence",
        "relatórios automáticos",
        "PME",
        "dashboards",
        "insights",
      ],
      openGraph: {
        title: "Sistema de Automação Empresarial - DataFlow Brasil",
        description:
          "Plataforma completa de business intelligence para PMEs brasileiras. Relatórios automáticos, dashboards interativos e insights em tempo real.",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Sistema de Automação Empresarial - DataFlow Brasil",
        description:
          "Plataforma completa de business intelligence para PMEs brasileiras. Relatórios automáticos, dashboards interativos e insights em tempo real.",
      },
    };
  }
}

// Async landing page component with dynamic composition and lazy loading
export default async function LandingPage() {
  try {
    // Get server flags for consistent composition
    const serverFlags = await getServerFlags();

    // Compose page content asynchronously with frozen flags
    const composition = await composePageFull(
      "landing",
      {
        experiments: serverFlags.experiments,
        featureFlags: serverFlags.flags,
      },
      {
        flags: serverFlags.flags,
      },
    );

    if (!composition) {
      console.error("No composition returned for landing page");
      return <div>Error: No composition available</div>;
    }

    return (
      <FrozenFlagsProvider
        serverFlags={serverFlags.flags}
        serverExperiments={serverFlags.experiments}
      >
        <PageRenderer composition={composition} pageType="landing" />
      </FrozenFlagsProvider>
    );
  } catch (error) {
    console.error("Error rendering landing page:", error);
    return <div>Error: Failed to render landing page</div>;
  }
}
