/**
 * Server-only SEO Content Analyzer
 * Safe for SSR without client-side dependencies
 */

export interface ContentAnalysis {
  wordCount: number;
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  suggestions: string[];
}

export class SEOContentAnalyzerServer {
  /**
   * Analyze content for SEO optimization opportunities (server-safe)
   */
  static analyzeContent(content: string): ContentAnalysis {
    // Server-safe content analysis - no DOM dependencies
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = words.length;

    // Simple keyword density analysis
    const keywordDensity: Record<string, number> = {};
    words.forEach((word) => {
      if (word.length > 3) {
        // Only consider meaningful words
        keywordDensity[word] = (keywordDensity[word] || 0) + 1;
      }
    });

    // Normalize density
    Object.keys(keywordDensity).forEach((key) => {
      keywordDensity[key] = (keywordDensity[key] / wordCount) * 100;
    });

    // Simple readability score (Flesch Reading Ease approximation)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * (words.length / wordCount);

    // Generate suggestions
    const suggestions: string[] = [];

    if (wordCount < 300) {
      suggestions.push(
        "Conteúdo muito curto. Considere adicionar mais informações.",
      );
    }

    if (readabilityScore < 60) {
      suggestions.push(
        "Texto pode ser difícil de ler. Considere simplificar a linguagem.",
      );
    }

    const highDensityKeywords = Object.entries(keywordDensity)
      .filter(([, density]) => density > 5)
      .map(([keyword]) => keyword);

    if (highDensityKeywords.length > 3) {
      suggestions.push(
        `Possível keyword stuffing detectado: ${highDensityKeywords.slice(0, 3).join(", ")}`,
      );
    }

    return {
      wordCount,
      keywordDensity,
      readabilityScore,
      suggestions,
    };
  }

  /**
   * Generate SEO-optimized title (server-safe)
   */
  static generateTitle(
    baseTitle: string,
    keywords: string[],
    maxLength = 60,
  ): string {
    let title = baseTitle;

    // Add primary keyword if not present
    if (
      keywords.length > 0 &&
      !title.toLowerCase().includes(keywords[0].toLowerCase())
    ) {
      title = `${keywords[0]} - ${title}`;
    }

    // Ensure title is within length limits
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + "...";
    }

    return title;
  }

  /**
   * Generate SEO-optimized description (server-safe)
   */
  static generateDescription(
    content: string,
    keywords: string[],
    maxLength = 160,
  ): string {
    // Extract first meaningful paragraph
    const paragraphs = content
      .split("\n\n")
      .filter((p) => p.trim().length > 50);
    let description = paragraphs[0] || content.substring(0, maxLength);

    // Ensure primary keyword is included
    if (
      keywords.length > 0 &&
      !description.toLowerCase().includes(keywords[0].toLowerCase())
    ) {
      description = `${keywords[0]}. ${description}`;
    }

    // Trim to max length
    if (description.length > maxLength) {
      description = description.substring(0, maxLength - 3) + "...";
    }

    return description;
  }
}
