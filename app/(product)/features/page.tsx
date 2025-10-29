import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate content every hour for dynamic features
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("features", undefined, {
      flags: {},
    });

    // Debug: Log what we got
    console.log("Features metadata:", composition?.metadata);

    if (!composition?.metadata) {
      console.error("No metadata in composition:", composition);
      return {
        title: "Features - Fallback",
        description: "Features page",
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
    console.error("Error generating metadata for features:", error);
    return {
      title: "Features - Error Fallback",
      description: "Features page - error occurred",
    };
  }
}

// Async page component for dynamic content and ISR
export default async function Features() {
  try {
    // Compose page content asynchronously with dynamic content
    const composition = await composePageFull("features", undefined, {
      flags: {},
    });

    if (!composition) {
      console.error("No composition returned for features");
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="features" />;
  } catch (error) {
    console.error("Error rendering features page:", error);
    return <div>Error: Failed to render features page</div>;
  }
}
