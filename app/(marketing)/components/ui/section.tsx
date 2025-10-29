import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "sm" | "md" | "lg" | "xl";
  style?: React.CSSProperties;
}

export function Section({
  id,
  children,
  className,
  containerSize = "xl",
  padding = "md",
  style,
  ...props
}: SectionProps) {
  const containerSizes = {
    sm: "max-w-4xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const paddingSizes = {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-20",
    lg: "py-20 md:py-28",
    xl: "py-24 md:py-32",
  };

  return (
    <section
      id={id}
      className={cn(paddingSizes[padding], className)}
      style={style}
      {...props}
    >
      <div
        className={cn(
          "container mx-auto px-4 md:px-6",
          containerSizes[containerSize],
        )}
      >
        {children}
      </div>
    </section>
  );
}
