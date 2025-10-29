"use client";

import React from "react";
import { motion } from "framer-motion";
import { CtaButton } from "./cta-button-unified";
import { FadeUp } from "@/app/(marketing)/components/ui/fade-up";

interface FormButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  loadingText?: string;
  type?: "submit" | "button";
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export function FormButton({
  children,
  isLoading = false,
  isDisabled = false,
  isBlocked = false,
  blockReason,
  loadingText = "Enviando...",
  type = "submit",
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  delay = 0,
}: FormButtonProps) {
  const isActuallyDisabled = isDisabled || isLoading || isBlocked;

  return (
    <FadeUp delay={delay}>
      <motion.div
        className={`space-y-2 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <CtaButton
          type={type}
          disabled={isActuallyDisabled}
          onClick={onClick}
          className={`
            w-full justify-center transition-all duration-200
            ${isBlocked ? "opacity-50" : ""}
          `}
        >
          {isLoading ? (
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <span>{loadingText}</span>
            </motion.div>
          ) : isBlocked ? (
            <span className="text-gray-400">
              {blockReason || "Bloqueado temporariamente"}
            </span>
          ) : (
            children
          )}
        </CtaButton>

        {isBlocked && blockReason && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-amber-600 dark:text-amber-400 text-center"
          >
            {blockReason}
          </motion.p>
        )}
      </motion.div>
    </FadeUp>
  );
}
