import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate checkout content every hour for pricing updates
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("checkout", undefined, {
      flags: {},
    });

    if (!composition?.metadata) {
      return {
        title: "Checkout - Fallback",
        description: "Secure checkout page",
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
      title: "Checkout - Error Fallback",
      description: "Checkout page - error occurred",
    };
  }
}

// Async page component for secure checkout forms
export default async function Checkout() {
  try {
    // Compose page content asynchronously with checkout and payment data
    const composition = await composePageFull("checkout", undefined, {
      flags: {},
    });

    if (!composition) {
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="checkout" />;
  } catch (error) {
    return <div>Error: Failed to render checkout page</div>;
  }
}
