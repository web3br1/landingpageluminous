import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate pricing content every hour
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("pricing", undefined);

    if (!composition?.metadata) {
      return {
        title: "Pricing - Fallback",
        description: "Pricing page",
      };
    }

    return {
      title: composition.metadata.title,
      description: composition.metadata.description,
      keywords: [...composition.metadata.keywords],
      openGraph: {
        title: composition.metadata.title,
        description: composition.metadata.description,
        type: "website",
      },
    };
  } catch (error) {
    return {
      title: "Pricing - Error Fallback",
      description: "Pricing page - error occurred",
    };
  }
}

// Async page component for dynamic pricing content
export default async function Pricing() {
  try {
    // Compose page content asynchronously with pricing data
    const composition = await composePageFull("pricing", undefined);

    if (!composition) {
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="pricing" />;
  } catch (error) {
    return <div>Error: Failed to render pricing page</div>;
  }
}
