"use client";

import React from "react";
import { motion } from "framer-motion";
import { Path, FieldValues } from "react-hook-form";
import { FadeUp } from "@/app/(marketing)/components/ui/fade-up";

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: "text" | "email" | "tel" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: string[] | Array<{ value: string; label: string }>;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  rows?: number;
  delay?: number;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  required,
  options,
  error,
  value,
  onChange,
  onBlur,
  disabled,
  className = "",
  rows = 4,
  delay = 0,
}: FormFieldProps<T>) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;

  return (
    <FadeUp delay={delay}>
      <motion.div
        className={`space-y-2 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {type === "textarea" ? (
          <textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              transition-colors resize-vertical min-h-[100px]
              ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        ) : type === "select" ? (
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              transition-colors appearance-none
              ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <option value="">{placeholder || "Selecione..."}</option>
            {options?.map((option) => (
              <option
                key={typeof option === "string" ? option : option.value}
                value={typeof option === "string" ? option : option.value}
              >
                {typeof option === "string" ? option : option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              transition-colors
              ${type === "email" ? "lowercase" : ""}
              ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-600 dark:text-red-400"
            id={`${fieldId}-error`}
            aria-live="polite"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </FadeUp>
  );
}
