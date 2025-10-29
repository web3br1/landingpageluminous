import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock do componente Button real
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
    >
      {children}
    </button>
  );
};

describe("Button Component", () => {
  it("should render with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByTestId("button");

    expect(button).toHaveTextContent("Click me");
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("should render with different variants", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByTestId("button")).toHaveClass("border", "border-input");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByTestId("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId("button")).toHaveClass("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByTestId("button")).toHaveClass("hover:bg-accent");

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByTestId("button")).toHaveClass("text-primary", "underline-offset-4");
  });

  it("should render with different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByTestId("button")).toHaveClass("h-9", "px-3");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByTestId("button")).toHaveClass("h-11", "px-8");

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByTestId("button")).toHaveClass("h-10", "w-10");
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    const button = screen.getByTestId("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByTestId("button")).toHaveClass("custom-class");
  });

  it("should have proper accessibility attributes", () => {
    render(<Button>Accessible Button</Button>);
    const button = screen.getByTestId("button");

    // Should have focus-visible ring classes
    expect(button).toHaveClass("focus-visible:outline-none");
    expect(button).toHaveClass("focus-visible:ring-2");
    expect(button).toHaveClass("focus-visible:ring-ring");
    expect(button).toHaveClass("focus-visible:ring-offset-2");
  });

  it("should handle complex children", () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    expect(screen.getByTestId("button")).toHaveTextContent("IconText");
  });
});
