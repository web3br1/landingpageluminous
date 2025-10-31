import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate demo content every hour
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("demo", undefined);

    if (!composition?.metadata) {
      return {
        title: "Demo - Fallback",
        description: "Interactive product demo",
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
      title: "Demo - Error Fallback",
      description: "Demo page - error occurred",
    };
  }
}

// Async page component for interactive demo content
export default async function Demo() {
  try {
    // Compose page content asynchronously with demo data
    const composition = await composePageFull("demo", undefined);

    if (!composition) {
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="demo" />;
  } catch (error) {
    return <div>Error: Failed to render demo page</div>;
  }
}
