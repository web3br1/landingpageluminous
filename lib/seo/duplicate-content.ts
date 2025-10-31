import { Metadata } from "next";

/**
 * Content fingerprint for duplicate detection
 */
interface ContentFingerprint {
  hash: string;
  url: string;
  title: string;
  description: string;
  contentLength: number;
  keywords: string[];
  lastModified: Date;
}

/**
 * Duplicate content detection and prevention system
 */
export class DuplicateContentDetector {
  private static fingerprints = new Map<string, ContentFingerprint>();

  /**
   * Generate content hash for duplicate detection
   */
  private static generateContentHash(content: string): string {
    // Simple hash function for content comparison
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract keywords from content for comparison
   */
  private static extractKeywords(
    text: string,
    maxKeywords: number = 10,
  ): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = new Set([
      "a",
      "o",
      "e",
      "de",
      "do",
      "da",
      "em",
      "para",
      "com",
      "por",
      "como",
      "mais",
      "ou",
      "se",
      "que",
      "um",
      "uma",
      "os",
      "as",
      "no",
      "na",
      "nos",
      "nas",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Sort by frequency and return top keywords
    return Array.from(wordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Calculate similarity between two content fingerprints
   */
  private static calculateSimilarity(
    fp1: ContentFingerprint,
    fp2: ContentFingerprint,
  ): number {
    // Exact hash match = 100% duplicate
    if (fp1.hash === fp2.hash) {
      return 1.0;
    }

    // Calculate keyword overlap
    const keywords1 = new Set(fp1.keywords);
    const keywords2 = new Set(fp2.keywords);
    const intersection = new Set(
      Array.from(keywords1).filter((x) => keywords2.has(x)),
    );
    const union = new Set([...Array.from(keywords1), ...Array.from(keywords2)]);

    const keywordSimilarity = intersection.size / union.size;

    // Calculate title similarity (simple string comparison)
    const titleSimilarity =
      fp1.title.toLowerCase() === fp2.title.toLowerCase() ? 1.0 : 0.0;

    // Calculate description similarity
    const descSimilarity =
      fp1.description.toLowerCase() === fp2.description.toLowerCase()
        ? 1.0
        : 0.0;

    // Weighted similarity score
    return (
      keywordSimilarity * 0.6 + titleSimilarity * 0.3 + descSimilarity * 0.1
    );
  }

  /**
   * Check if content is duplicate and get canonical URL
   */
  static checkDuplicateContent(
    url: string,
    title: string,
    description: string,
    content: string,
  ): { isDuplicate: boolean; canonicalUrl?: string; similarity?: number } {
    const hash = this.generateContentHash(content);
    const keywords = this.extractKeywords(`${title} ${description} ${content}`);

    const currentFingerprint: ContentFingerprint = {
      hash,
      url,
      title,
      description,
      contentLength: content.length,
      keywords,
      lastModified: new Date(),
    };

    // Check for exact hash match
    if (this.fingerprints.has(hash)) {
      const existing = this.fingerprints.get(hash)!;
      return {
        isDuplicate: true,
        canonicalUrl: existing.url,
        similarity: 1.0,
      };
    }

    // Check for similar content (threshold: 80% similarity)
    for (const [existingHash, existingFp] of Array.from(
      this.fingerprints.entries(),
    )) {
      const similarity = this.calculateSimilarity(
        currentFingerprint,
        existingFp,
      );
      if (similarity >= 0.8) {
        return {
          isDuplicate: true,
          canonicalUrl: existingFp.url,
          similarity,
        };
      }
    }

    // Store fingerprint for future comparison
    this.fingerprints.set(hash, currentFingerprint);

    return { isDuplicate: false };
  }

  /**
   * Generate metadata with duplicate content handling
   */
  static generateMetadataWithDuplicateCheck(
    url: string,
    baseMetadata: Metadata,
    content: string,
  ): Metadata {
    const title =
      typeof baseMetadata.title === "string"
        ? baseMetadata.title
        : "Page Title";
    const description = (baseMetadata.description as string) || "";

    const duplicateCheck = this.checkDuplicateContent(
      url,
      title,
      description,
      content,
    );

    if (duplicateCheck.isDuplicate && duplicateCheck.canonicalUrl) {
      // Add canonical URL for duplicate content
      return {
        ...baseMetadata,
        alternates: {
          ...baseMetadata.alternates,
          canonical: duplicateCheck.canonicalUrl,
        },
        // Add robots meta to discourage indexing of duplicates
        robots: {
          ...(typeof baseMetadata.robots === 'object' && baseMetadata.robots ? baseMetadata.robots : {}),
          index: false,
          follow: true,
        },
        // Add meta tag indicating this is a duplicate
        other: {
          ...(typeof baseMetadata.other === 'object' && baseMetadata.other ? baseMetadata.other : {}),
          robots: "noindex,follow",
          googlebot: "noindex,follow",
        },
      };
    }

    return baseMetadata;
  }

  /**
   * Clear old fingerprints (cleanup function)
   */
  static cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [hash, fingerprint] of Array.from(this.fingerprints.entries())) {
      if (now - fingerprint.lastModified.getTime() > maxAge) {
        this.fingerprints.delete(hash);
      }
    }
  }

  /**
   * Get duplicate content report
   */
  static getDuplicateReport(): Array<{
    url: string;
    duplicates: Array<{ url: string; similarity: number }>;
  }> {
    const report: Array<{
      url: string;
      duplicates: Array<{ url: string; similarity: number }>;
    }> = [];

    for (const [hash, fingerprint] of Array.from(this.fingerprints.entries())) {
      const duplicates: Array<{ url: string; similarity: number }> = [];

      for (const [otherHash, otherFingerprint] of Array.from(
        this.fingerprints.entries(),
      )) {
        if (hash !== otherHash) {
          const similarity = this.calculateSimilarity(
            fingerprint,
            otherFingerprint,
          );
          if (similarity >= 0.8) {
            duplicates.push({
              url: otherFingerprint.url,
              similarity,
            });
          }
        }
      }

      if (duplicates.length > 0) {
        report.push({
          url: fingerprint.url,
          duplicates,
        });
      }
    }

    return report;
  }
}

/**
 * Hook for page-level duplicate content detection
 */
export function useDuplicateContentDetection() {
  return {
    checkDuplicate: DuplicateContentDetector.checkDuplicateContent.bind(
      DuplicateContentDetector,
    ),
    generateMetadata:
      DuplicateContentDetector.generateMetadataWithDuplicateCheck.bind(
        DuplicateContentDetector,
      ),
    getReport: DuplicateContentDetector.getDuplicateReport.bind(
      DuplicateContentDetector,
    ),
    cleanup: DuplicateContentDetector.cleanup.bind(DuplicateContentDetector),
  };
}

/**
 * Middleware for duplicate content handling
 */
export function handleDuplicateContentRedirect(
  request: Request,
  content: string,
): Response | null {
  const url = new URL(request.url);
  const title = "Page"; // Would be extracted from content in real implementation
  const description = ""; // Would be extracted from content in real implementation

  const duplicateCheck = DuplicateContentDetector.checkDuplicateContent(
    url.pathname,
    title,
    description,
    content,
  );

  if (duplicateCheck.isDuplicate && duplicateCheck.canonicalUrl) {
    // Redirect to canonical URL
    return new Response(null, {
      status: 301,
      headers: {
        Location: duplicateCheck.canonicalUrl,
      },
    });
  }

  return null;
}
