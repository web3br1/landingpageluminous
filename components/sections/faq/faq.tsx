"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaqSectionProps } from "@/domains/marketing";

export function Faq({
  content,
  variant = "default",
  tracking,
  onQuestionClick,
  onCtaClick,
  headingId,
}: FaqSectionProps) {
  // Safety check - if content is undefined or items is undefined, provide minimal fallback
  if (!content || !content.items || !Array.isArray(content.items)) {
    console.warn(
      "Faq component received undefined content, items, or items is not an array, using fallback",
    );
    content = {
      title: "Perguntas Frequentes",
      subtitle: "Tire suas dúvidas sobre nossa plataforma",
      items: [],
    };
  }

  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number, question: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);

    // Track interaction
    onQuestionClick?.(index, question);
  };

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <h2
          id={headingId}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        )}
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {content.items.map((item, index) => {
            const isOpen = openItems.has(index);

            return (
              <div
                key={index}
                className="border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index, item.question)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="font-medium text-foreground">
                      {item.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-6 pb-4"
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    <div className="pl-8 border-l-2 border-primary/20">
                      <p className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      {content.ctaText && content.ctaLink && (
        <div className="text-center mt-12">
          <a
            href={content.ctaLink}
            onClick={onCtaClick}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {content.ctaText}
          </a>
        </div>
      )}
    </>
  );
}
