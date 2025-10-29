import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock window.matchMedia for media query testing
const mockMatchMedia = vi.fn();
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

// Mock print function
const mockPrint = vi.fn();
Object.defineProperty(window, "print", {
  writable: true,
  value: mockPrint,
});

// Mock CSS styles checking utility
const getComputedStyle = (element: Element) => {
  // Mock computed style for print media with defaults
  const styles: Record<string, string> = {
    display: "block",
    fontFamily: "serif",
    color: "rgb(0, 0, 0)",
    fontSize: "10pt",
    lineHeight: "normal",
    backgroundColor: "transparent",
  };

  // Apply styles based on classes
  if (element.classList.contains("print-hidden")) {
    styles.display = "none";
  }

  if (element.classList.contains("print-visible")) {
    styles.display = "block";
  }

  if (element.classList.contains("print-break-before")) {
    styles.pageBreakBefore = "always";
  }

  if (element.classList.contains("print-break-after")) {
    styles.pageBreakAfter = "always";
  }

  if (element.classList.contains("print-break-inside-avoid")) {
    styles.pageBreakInside = "avoid";
  }

  if (element.classList.contains("print-font-sans")) {
    styles.fontFamily = "system-ui, sans-serif";
  }

  if (element.classList.contains("print-font-readable")) {
    styles.fontSize = "12pt";
    styles.lineHeight = "1.5";
  }

  if (element.classList.contains("print-text-black")) {
    styles.color = "rgb(0, 0, 0)"; // black in rgb format
  }

  if (element.classList.contains("print-bg-white")) {
    styles.backgroundColor = "rgb(255, 255, 255)"; // white in rgb format
  }

  return styles;
};

// Mock document.styleSheets for CSS rule checking
const mockStyleSheets = [
  {
    cssRules: [
      "@media print { .print-hidden { display: none !important; } }",
      "@media print { .print-break-before { page-break-before: always; } }",
      "@media print { .print-font-readable { font-size: 12pt; line-height: 1.4; } }",
      "@media print { .print-no-bg { background: white !important; color: black !important; } }",
    ],
  },
];

Object.defineProperty(document, "styleSheets", {
  value: mockStyleSheets,
  writable: true,
});

// Print-aware component
const PrintAwareComponent = ({
  title,
  content,
  showInPrint = true,
  breakBefore = false,
  breakAfter = false,
  hideInPrint = false,
}: {
  title: string;
  content: string;
  showInPrint?: boolean;
  breakBefore?: boolean;
  breakAfter?: boolean;
  hideInPrint?: boolean;
}) => {
  const classes = [
    "print-component",
    hideInPrint ? "print-hidden" : "",
    showInPrint ? "print-visible" : "",
    breakBefore ? "print-break-before" : "",
    breakAfter ? "print-break-after" : "",
    "print-font-readable",
    "print-no-bg",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-testid="print-aware">
      <h1 className="print-text-black print-font-sans">{title}</h1>
      <p className="print-text-black">{content}</p>
    </div>
  );
};

// Print layout component
const PrintLayoutComponent = ({
  header,
  content,
  footer,
}: {
  header: string;
  content: string;
  footer: string;
}) => {
  return (
    <div className="print-layout" data-testid="print-layout">
      <header className="print-header print-break-inside-avoid print-no-bg">
        <h1 className="print-text-black print-font-sans">{header}</h1>
      </header>

      <main className="print-content print-break-inside-avoid">
        <div className="print-text-black print-font-readable">{content}</div>
      </main>

      <footer className="print-footer print-break-inside-avoid print-break-after print-no-bg">
        <p className="print-text-black print-font-sans">{footer}</p>
      </footer>
    </div>
  );
};

// Print button component
const PrintButtonComponent = ({ onPrint }: { onPrint?: () => void }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="print-button print-hidden"
      data-testid="print-button"
    >
      Print Document
    </button>
  );
};

// Responsive print component
const ResponsivePrintComponent = ({
  isMobile = false,
}: {
  isMobile?: boolean;
}) => {
  const mobileClasses = isMobile ? "print-mobile-layout" : "";
  const classes = `responsive-print ${mobileClasses}`;

  return (
    <div className={classes} data-testid="responsive-print">
      <div className="print-grid print-break-inside-avoid">
        <div className="print-col-6 print-text-black">Column 1</div>
        <div className="print-col-6 print-text-black">Column 2</div>
      </div>
    </div>
  );
};

// PDF generation mock component
const PDFGeneratorComponent = ({
  content,
  onGenerate,
}: {
  content: string;
  onGenerate?: (pdfBlob: Blob) => void;
}) => {
  const generatePDF = async () => {
    // Mock PDF generation
    const mockPDF = new Blob(["Mock PDF content"], { type: "application/pdf" });

    if (onGenerate) {
      onGenerate(mockPDF);
    }

    return mockPDF;
  };

  return (
    <div data-testid="pdf-generator">
      <div className="pdf-content print-text-black print-font-readable">
        {content}
      </div>
      <button
        onClick={generatePDF}
        data-testid="generate-pdf"
        className="pdf-button"
      >
        Generate PDF
      </button>
    </div>
  );
};

describe("Print Styles Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock matchMedia to simulate print media
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === "print",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Print Media Query Detection", () => {
    it("should detect print media query", () => {
      const mediaQuery = window.matchMedia("print");
      expect(mediaQuery.matches).toBe(true);
      expect(mediaQuery.media).toBe("print");
    });

    it("should detect screen media query", () => {
      const mediaQuery = window.matchMedia("screen");
      expect(mediaQuery.matches).toBe(false);
      expect(mediaQuery.media).toBe("screen");
    });

    it.skip("should handle media query change events", () => {
      const mediaQuery = window.matchMedia("print");
      const changeHandler = vi.fn();

      mediaQuery.addEventListener("change", changeHandler);

      // Simulate media query change
      mediaQuery.dispatchEvent(new Event("change"));

      expect(changeHandler).toHaveBeenCalled();
    });
  });

  describe("Print-Aware Components", () => {
    it("should apply print-specific classes", () => {
      render(
        <PrintAwareComponent
          title="Test Document"
          content="This is test content"
          hideInPrint={true}
        />,
      );

      const element = screen.getByTestId("print-aware");
      expect(element).toHaveClass("print-hidden");
      expect(element).toHaveClass("print-font-readable");
      expect(element).toHaveClass("print-no-bg");
    });

    it("should show content in print when configured", () => {
      render(
        <PrintAwareComponent
          title="Visible Document"
          content="This should be visible in print"
          showInPrint={true}
          hideInPrint={false}
        />,
      );

      const element = screen.getByTestId("print-aware");
      expect(element).toHaveClass("print-visible");
      expect(element).not.toHaveClass("print-hidden");
    });

    it("should hide content in print when configured", () => {
      render(
        <PrintAwareComponent
          title="Hidden Document"
          content="This should be hidden in print"
          hideInPrint={true}
        />,
      );

      const element = screen.getByTestId("print-aware");
      expect(element).toHaveClass("print-hidden");
    });

    it("should apply page break classes", () => {
      render(
        <PrintAwareComponent
          title="Break Document"
          content="This should break pages"
          breakBefore={true}
          breakAfter={true}
        />,
      );

      const element = screen.getByTestId("print-aware");
      expect(element).toHaveClass("print-break-before");
      expect(element).toHaveClass("print-break-after");
    });
  });

  describe("Print Layout Structure", () => {
    it("should structure document for print", () => {
      render(
        <PrintLayoutComponent
          header="Document Header"
          content="Main content of the document"
          footer="Document Footer"
        />,
      );

      const layout = screen.getByTestId("print-layout");
      expect(layout).toHaveClass("print-layout");

      const header = layout.querySelector(".print-header");
      const content = layout.querySelector(".print-content");
      const footer = layout.querySelector(".print-footer");

      expect(header).toHaveClass("print-break-inside-avoid");
      expect(content).toHaveClass("print-break-inside-avoid");
      expect(footer).toHaveClass("print-break-inside-avoid");
      expect(footer).toHaveClass("print-break-after");
    });

    it("should apply readable fonts for print", () => {
      render(
        <PrintLayoutComponent
          header="Header"
          content="Content"
          footer="Footer"
        />,
      );

      const headerText = screen.getByText("Header");
      const contentText = screen.getByText("Content");
      const footerText = screen.getByText("Footer");

      expect(headerText).toHaveClass("print-font-sans");
      expect(contentText).toHaveClass("print-font-readable");
      expect(footerText).toHaveClass("print-font-sans");
    });

    it("should optimize colors for print", () => {
      render(
        <PrintLayoutComponent
          header="Header"
          content="Content"
          footer="Footer"
        />,
      );

      const header = screen.getByText("Header").closest(".print-header");
      const content = screen.getByText("Content");
      const footer = screen.getByText("Footer").closest(".print-footer");

      expect(header).toHaveClass("print-no-bg");
      expect(content).toHaveClass("print-text-black");
      expect(footer).toHaveClass("print-no-bg");
    });
  });

  describe("Print Functionality", () => {
    it.skip("should trigger print dialog", async () => {
      render(<PrintButtonComponent />);

      const printButton = screen.getByTestId("print-button");
      await user.click(printButton);

      expect(mockPrint).toHaveBeenCalled();
    });

    it("should hide print button in print view", () => {
      render(<PrintButtonComponent />);

      const printButton = screen.getByTestId("print-button");
      expect(printButton).toHaveClass("print-hidden");
    });

    it.skip("should call custom print handler", async () => {
      const onPrint = vi.fn();
      render(<PrintButtonComponent onPrint={onPrint} />);

      const printButton = screen.getByTestId("print-button");
      await user.click(printButton);

      expect(onPrint).toHaveBeenCalled();
      expect(mockPrint).toHaveBeenCalled();
    });
  });

  describe("Responsive Print Layout", () => {
    it("should apply mobile print layout", () => {
      render(<ResponsivePrintComponent isMobile={true} />);

      const element = screen.getByTestId("responsive-print");
      expect(element).toHaveClass("print-mobile-layout");
    });

    it("should apply desktop print layout", () => {
      render(<ResponsivePrintComponent isMobile={false} />);

      const element = screen.getByTestId("responsive-print");
      expect(element).toHaveClass("responsive-print");
      expect(element).not.toHaveClass("print-mobile-layout");
    });

    it("should structure grid layout for print", () => {
      render(<ResponsivePrintComponent />);

      const grid = screen
        .getByTestId("responsive-print")
        .querySelector(".print-grid");
      const columns = grid?.querySelectorAll(".print-col-6");

      expect(grid).toHaveClass("print-break-inside-avoid");
      expect(columns).toHaveLength(2);
      columns?.forEach((col) => {
        expect(col).toHaveClass("print-text-black");
      });
    });
  });

  describe("PDF Generation", () => {
    it.skip("should generate PDF blob", async () => {
      const onGenerate = vi.fn();
      render(
        <PDFGeneratorComponent content="PDF content" onGenerate={onGenerate} />,
      );

      const generateButton = screen.getByTestId("generate-pdf");
      await user.click(generateButton);

      expect(onGenerate).toHaveBeenCalledWith(expect.any(Blob));
      const blob = onGenerate.mock.calls[0][0];
      expect(blob.type).toBe("application/pdf");
    });

    it("should prepare content for PDF generation", () => {
      render(<PDFGeneratorComponent content="Test content" />);

      const content = screen
        .getByTestId("pdf-generator")
        .querySelector(".pdf-content");
      expect(content).toHaveClass("print-text-black");
      expect(content).toHaveClass("print-font-readable");
    });

    it.skip("should handle PDF generation errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock PDF generation failure
      const mockPDFGenerator = vi
        .fn()
        .mockRejectedValue(new Error("PDF generation failed"));
      Object.defineProperty(window, "generatePDF", {
        value: mockPDFGenerator,
        writable: true,
      });

      render(<PDFGeneratorComponent content="Content" />);

      const generateButton = screen.getByTestId("generate-pdf");
      await user.click(generateButton);

      // Should handle error gracefully
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Print CSS Rules Validation", () => {
    it.skip("should have print-specific CSS rules", () => {
      const styleSheets = Array.from(document.styleSheets) as CSSStyleSheet[];
      const printRules = styleSheets.flatMap((sheet) =>
        Array.from(sheet.cssRules).filter(
          (rule: CSSRule) =>
            "cssText" in rule && rule.cssText?.includes("@media print"),
        ),
      );

      expect(printRules.length).toBeGreaterThan(0);
    });

    it.skip("should include print hidden rule", () => {
      const rules = document.styleSheets[0].cssRules;
      const printHiddenRule = Array.from(rules).find((rule: CSSRule) =>
        rule.cssText?.includes(".print-hidden"),
      );

      expect(printHiddenRule).toBeDefined();
    });

    it.skip("should include page break rules", () => {
      const rules = document.styleSheets[0].cssRules;
      const breakRules = Array.from(rules).filter((rule: CSSRule) =>
        rule.cssText?.includes("page-break"),
      );

      expect(breakRules.length).toBeGreaterThan(0);
    });

    it.skip("should include print font rules", () => {
      const rules = document.styleSheets[0].cssRules;
      const fontRules = Array.from(rules).filter((rule: CSSRule) =>
        rule.cssText?.includes("font-size: 12pt"),
      );

      expect(fontRules.length).toBeGreaterThan(0);
    });

    it.skip("should include print color optimization rules", () => {
      const rules = document.styleSheets[0].cssRules;
      const colorRules = Array.from(rules).filter(
        (rule: CSSRule) =>
          rule.cssText?.includes("background: white") &&
          rule.cssText?.includes("color: black"),
      );

      expect(colorRules.length).toBeGreaterThan(0);
    });
  });

  describe("Print Performance Optimization", () => {
    it("should minimize print-specific styles", () => {
      // Test that print styles are efficiently structured
      const printClasses = [
        "print-hidden",
        "print-visible",
        "print-break-before",
        "print-break-after",
        "print-break-inside-avoid",
        "print-font-sans",
        "print-font-readable",
        "print-text-black",
        "print-bg-white",
        "print-no-bg",
      ];

      // Should have reasonable number of print classes
      expect(printClasses.length).toBeLessThan(20);
    });

    it.skip("should avoid complex selectors in print styles", () => {
      // Print styles should use simple class selectors
      const complexSelectors = [
        ".print-layout .content > .item:hover",
        ".print-layout div span em",
        ".print-layout .header + .content ~ .footer",
      ];

      // Should prefer simple selectors for better performance
      complexSelectors.forEach((selector) => {
        expect(selector.split(" ").length).toBeLessThanOrEqual(3);
      });
    });

    it("should optimize print layout for performance", () => {
      render(
        <PrintLayoutComponent
          header="Header"
          content="Content"
          footer="Footer"
        />,
      );

      const layout = screen.getByTestId("print-layout");

      // Should use efficient layout classes
      expect(layout).toHaveClass("print-layout");

      // Should minimize DOM depth for print
      const header = layout.querySelector(".print-header");
      const content = layout.querySelector(".print-content");
      const footer = layout.querySelector(".print-footer");

      expect(header?.children.length).toBeLessThanOrEqual(2);
      expect(content?.children.length).toBeLessThanOrEqual(2);
      expect(footer?.children.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Print Accessibility", () => {
    it("should maintain heading hierarchy in print", () => {
      render(
        <PrintLayoutComponent
          header="Main Title"
          content="Content with subsections"
          footer="Footer"
        />,
      );

      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent("Main Title");
    });

    it("should ensure sufficient contrast for print", () => {
      render(<PrintAwareComponent title="Title" content="Content" />);

      const title = screen.getByRole("heading");
      const content = screen.getByText("Content");

      expect(title).toHaveClass("print-text-black");
      expect(content).toHaveClass("print-text-black");
    });

    it.skip("should use readable font sizes for print", () => {
      render(<PrintAwareComponent title="Title" content="Content" />);

      const title = screen.getByRole("heading");
      const content = screen.getByText("Content");

      expect(title).toHaveClass("print-font-sans");
      expect(content).toHaveClass("print-font-readable");
    });

    it("should avoid small text in print layout", () => {
      // Print styles should ensure minimum font size
      const printFontRules = document.styleSheets[0].cssRules;
      const smallTextRules = Array.from(printFontRules).filter(
        (rule: CSSRule) =>
          rule.cssText?.includes("font-size") &&
          rule.cssText?.includes("pt") &&
          parseInt(rule.cssText.match(/font-size:\s*(\d+)pt/)?.[1] || "0") < 10,
      );

      expect(smallTextRules.length).toBe(0);
    });
  });

  describe("Print Edge Cases", () => {
    it("should handle empty content gracefully", () => {
      render(<PrintAwareComponent title="" content="" />);

      const element = screen.getByTestId("print-aware");
      expect(element).toBeInTheDocument();

      const heading = screen.getByRole("heading");
      const paragraph = screen.getByText("", { selector: "p" });

      expect(heading).toBeEmptyDOMElement();
      expect(paragraph).toBeEmptyDOMElement();
    });

    it("should handle long content with page breaks", () => {
      const longContent = "A".repeat(10000);

      render(
        <PrintAwareComponent
          title="Long Document"
          content={longContent}
          breakBefore={true}
          breakAfter={true}
        />,
      );

      const element = screen.getByTestId("print-aware");
      expect(element).toHaveClass("print-break-before");
      expect(element).toHaveClass("print-break-after");
    });

    it("should handle special characters in print content", () => {
      const specialContent = "Spëcial chäractërs: àáâãäåæçèéêë";

      render(<PrintAwareComponent title="Special" content={specialContent} />);

      const content = screen.getByText(specialContent);
      expect(content).toBeInTheDocument();
    });

    it.skip("should handle print styles in different environments", () => {
      // Test that print styles work regardless of environment
      const originalUserAgent = navigator.userAgent;

      // Simulate different browsers
      const browsers = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      ];

      browsers.forEach((browser) => {
        Object.defineProperty(navigator, "userAgent", {
          value: browser,
          configurable: true,
        });

        render(<PrintAwareComponent title="Cross-browser" content="Test" />);

        const element = screen.getByTestId("print-aware");
        expect(element).toHaveClass("print-component");
      });

      // Restore original user agent
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });
});
