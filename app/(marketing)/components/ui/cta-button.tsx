import { cn } from "../../../../lib/utils";

interface CtaButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
}

export function CtaButton({
  children = "Comece grátis",
  className = "",
  onClick,
  href,
  disabled = false,
  size = "md",
  variant = "primary",
}: CtaButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary:
      "bg-gradient-primary text-white shadow-soft-sm hover:shadow-soft-md",
    secondary:
      "bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white dark:bg-neutral-800 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-400 dark:hover:text-white",
    outline:
      "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-400 dark:hover:text-white",
  };

  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none",
    sizeClasses[size],
    variantClasses[variant],
    className,
  );

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        className={baseClasses}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        aria-disabled={disabled}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses}
      type="button"
    >
      {children}
    </button>
  );
}
