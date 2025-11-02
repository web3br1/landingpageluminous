import { Metadata } from "next";
import { composePageFull } from "@/lib/composition/page-composer";
import { PageRenderer } from "@/lib/composition/page-renderer";

// ISR: Revalidate signup content every hour
export const revalidate = 3600;

// Generate metadata dynamically from composition
export async function generateMetadata(): Promise<Metadata> {
  try {
    const composition = await composePageFull("signup", undefined);

    if (!composition?.metadata) {
      return {
        title: "Signup - Fallback",
        description: "Create your account",
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
  } catch {
    return {
      title: "Signup - Error Fallback",
      description: "Signup page - error occurred",
    };
  }
}

// Async page component for signup forms with validation
export default async function Signup() {
  try {
    // Compose page content asynchronously with signup form data
    const composition = await composePageFull("signup", undefined);

    if (!composition) {
      return <div>Error: No composition available</div>;
    }

    return <PageRenderer composition={composition} pageType="signup" />;
  } catch {
    return <div>Error: Failed to render signup page</div>;
  }
}
