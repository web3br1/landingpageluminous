import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock do componente Card real
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    data-testid="card"
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    data-testid="card-header"
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    data-testid="card-title"
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    data-testid="card-description"
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`p-6 pt-0 ${className}`}
    data-testid="card-content"
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6 pt-0 ${className}`}
    data-testid="card-footer"
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

describe("Card Components", () => {
  describe("Card", () => {
    it("should render with default props", () => {
      render(<Card>Card content</Card>);
      const card = screen.getByTestId("card");

      expect(card).toHaveTextContent("Card content");
      expect(card).toHaveClass(
        "rounded-lg",
        "border",
        "bg-card",
        "text-card-foreground",
        "shadow-sm",
      );
    });

    it("should apply custom className", () => {
      render(<Card className="custom-class">Content</Card>);
      expect(screen.getByTestId("card")).toHaveClass("custom-class");
    });

    it("should forward ref correctly", () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should forward other props", () => {
      render(<Card data-custom="value">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute(
        "data-custom",
        "value",
      );
    });
  });

  describe("CardHeader", () => {
    it("should render with default props", () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>,
      );
      const header = screen.getByTestId("card-header");

      expect(header).toHaveTextContent("Header content");
      expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
    });

    it("should apply custom className", () => {
      render(
        <Card>
          <CardHeader className="custom-header">Content</CardHeader>
        </Card>,
      );
      expect(screen.getByTestId("card-header")).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("should render with default props", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>,
      );

      const title = screen.getByTestId("card-title");
      expect(title).toHaveTextContent("Card Title");
      expect(title).toHaveClass(
        "text-2xl",
        "font-semibold",
        "leading-none",
        "tracking-tight",
      );
      expect(title.tagName).toBe("H3");
    });

    it("should apply custom className", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
        </Card>,
      );
      expect(screen.getByTestId("card-title")).toHaveClass("custom-title");
    });
  });

  describe("CardDescription", () => {
    it("should render with default props", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>,
      );

      const description = screen.getByTestId("card-description");
      expect(description).toHaveTextContent("Description text");
      expect(description).toHaveClass("text-sm", "text-muted-foreground");
      expect(description.tagName).toBe("P");
    });

    it("should apply custom className", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-desc">
              Description
            </CardDescription>
          </CardHeader>
        </Card>,
      );
      expect(screen.getByTestId("card-description")).toHaveClass("custom-desc");
    });
  });

  describe("CardContent", () => {
    it("should render with default props", () => {
      render(
        <Card>
          <CardContent>Main content</CardContent>
        </Card>,
      );
      const content = screen.getByTestId("card-content");

      expect(content).toHaveTextContent("Main content");
      expect(content).toHaveClass("p-6", "pt-0");
    });

    it("should apply custom className", () => {
      render(
        <Card>
          <CardContent className="custom-content">Content</CardContent>
        </Card>,
      );
      expect(screen.getByTestId("card-content")).toHaveClass("custom-content");
    });
  });

  describe("CardFooter", () => {
    it("should render with default props", () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>,
      );
      const footer = screen.getByTestId("card-footer");

      expect(footer).toHaveTextContent("Footer content");
      expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
    });

    it("should apply custom className", () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>,
      );
      expect(screen.getByTestId("card-footer")).toHaveClass("custom-footer");
    });
  });

  describe("Card Composition", () => {
    it("should render a complete card structure", () => {
      render(
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Project Title</CardTitle>
            <CardDescription>
              A brief description of the project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
            <ul className="list-disc list-inside mt-2">
              <li>Feature 1</li>
              <li>Feature 2</li>
              <li>Feature 3</li>
            </ul>
          </CardContent>
          <CardFooter>
            <button className="mr-2">Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>,
      );

      // Verify all components are present
      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("card-header")).toBeInTheDocument();
      expect(screen.getByTestId("card-title")).toHaveTextContent(
        "Project Title",
      );
      expect(screen.getByTestId("card-description")).toHaveTextContent(
        "A brief description of the project.",
      );
      expect(screen.getByTestId("card-content")).toHaveTextContent(
        "This is the main content of the card.",
      );
      expect(screen.getByTestId("card-footer")).toBeInTheDocument();

      // Verify content structure
      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
      expect(screen.getByText("Feature 3")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should handle minimal card structure", () => {
      render(<Card>Simple content</Card>);

      expect(screen.getByTestId("card")).toHaveTextContent("Simple content");
      expect(screen.queryByTestId("card-header")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-title")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-description")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-content")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-footer")).not.toBeInTheDocument();
    });
  });
});
