"use client";

import { motion } from "framer-motion";
import { ProofTractionContent } from "@/domains/marketing/types/proof-traction.types";
import { Section } from "@/app/(marketing)/components/ui/section";
import { FadeUp } from "@/app/(marketing)/components/ui/fade-up";

interface ProofTractionProps {
  content: ProofTractionContent;
  sectionId?: string;
}

export function ProofTraction({
  content,
  sectionId = "proof-traction",
}: ProofTractionProps) {
  return (
    <Section id={sectionId} className="bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-12">
            {content.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {content.title}
              </h2>
            )}
            {content.subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {content.subtitle}
              </p>
            )}
          </div>
        </FadeUp>

        {content.metrics && content.metrics.length > 0 && (
          <FadeUp delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {content.metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {metric.value}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.description}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </FadeUp>
        )}

        {content.achievements && content.achievements.length > 0 && (
          <FadeUp delay={0.4}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {achievement.title}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeUp>
        )}
      </div>
    </Section>
  );
}
