import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate trial content every 1 hour for fresh offers
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("trial", undefined, {
      flags: {},
    });

    if (!composition?.metadata) {
      return {
        title: "Trial - Fallback",
        description: "Start your free trial",
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
      title: "Trial - Error Fallback",
      description: "Trial page - error occurred",
    };
  }
}

// Async page component for trial forms and offers
export default async function Trial() {
  try {
    // Compose page content asynchronously with trial data and offers
    const composition = await composePageFull("trial", undefined, {
      flags: {},
    });

    if (!composition) {
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="trial" />;
  } catch (error) {
    return <div>Error: Failed to render trial page</div>;
  }
}
