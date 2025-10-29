import React from "react";
import { render, screen } from "@testing-library/react";
import { Section } from "@/app/(marketing)/components/ui/section";
import { vi } from "vitest";

// Helper function to find the section element
const getSection = () => document.querySelector("section") as HTMLElement;
const getContainer = () =>
  document.querySelector("section > div") as HTMLElement;

describe("Section Component", () => {
  it("renders children correctly", () => {
    render(
      <Section>
        <div>Test content</div>
      </Section>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies default classes", () => {
    render(
      <Section>
        <div>Test content</div>
      </Section>,
    );

    const section = getSection();
    expect(section).toHaveClass("py-16", "md:py-20"); // default padding

    const container = getContainer();
    expect(container).toHaveClass("container", "mx-auto", "px-4", "md:px-6"); // container classes
    expect(container).toHaveClass("max-w-7xl"); // default containerSize
  });

  it("applies custom id", () => {
    render(
      <Section id="test-section">
        <div>Test content</div>
      </Section>,
    );

    const section = getSection();
    expect(section).toHaveAttribute("id", "test-section");
  });

  it("applies custom className", () => {
    render(
      <Section className="custom-class">
        <div>Test content</div>
      </Section>,
    );

    const section = getSection();
    expect(section).toHaveClass("custom-class");
  });

  it("applies different container sizes", () => {
    const { rerender } = render(
      <Section containerSize="sm">
        <div>Test content</div>
      </Section>,
    );

    let container = getContainer();
    expect(container).toHaveClass("max-w-4xl");

    rerender(
      <Section containerSize="md">
        <div>Test content</div>
      </Section>,
    );
    container = getContainer();
    expect(container).toHaveClass("max-w-5xl");

    rerender(
      <Section containerSize="lg">
        <div>Test content</div>
      </Section>,
    );
    container = getContainer();
    expect(container).toHaveClass("max-w-6xl");

    rerender(
      <Section containerSize="xl">
        <div>Test content</div>
      </Section>,
    );
    container = getContainer();
    expect(container).toHaveClass("max-w-7xl");

    rerender(
      <Section containerSize="full">
        <div>Test content</div>
      </Section>,
    );
    container = getContainer();
    expect(container).toHaveClass("max-w-full");
  });

  it("applies different padding sizes", () => {
    const { rerender } = render(
      <Section padding="sm">
        <div>Test content</div>
      </Section>,
    );

    let section = getSection();
    expect(section).toHaveClass("py-12", "md:py-16");

    rerender(
      <Section padding="md">
        <div>Test content</div>
      </Section>,
    );
    section = getSection();
    expect(section).toHaveClass("py-16", "md:py-20");

    rerender(
      <Section padding="lg">
        <div>Test content</div>
      </Section>,
    );
    section = getSection();
    expect(section).toHaveClass("py-20", "md:py-28");

    rerender(
      <Section padding="xl">
        <div>Test content</div>
      </Section>,
    );
    section = getSection();
    expect(section).toHaveClass("py-24", "md:py-32");
  });

  it("applies custom style", () => {
    const customStyle = { backgroundColor: "red" };
    render(
      <Section style={customStyle}>
        <div>Test content</div>
      </Section>,
    );

    const section = getSection();
    expect(section.style.backgroundColor).toBe("red");
  });

  it("passes through additional props", () => {
    render(
      <Section data-testid="custom-section" aria-label="Test section">
        <div>Test content</div>
      </Section>,
    );

    const section = screen.getByTestId("custom-section");
    expect(section).toHaveAttribute("aria-label", "Test section");
  });
});
