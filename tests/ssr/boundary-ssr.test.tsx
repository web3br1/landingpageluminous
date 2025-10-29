import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Boundary } from "@/lib/error/Boundary";

function Explode() {
  throw new Error("boom");
}

describe("Error Boundary SSR", () => {
  it("SSR: erro propaga (Boundary não captura no render do servidor)", () => {
    expect(() =>
      renderToString(
        <Boundary>
          <Explode />
        </Boundary>,
      ),
    ).toThrow("boom");
  });

  it("SSR: conteúdo normal renderiza sem erro", () => {
    const html = renderToString(
      <Boundary>
        <div>Normal content</div>
      </Boundary>,
    );
    expect(html).toContain("Normal content");
  });

  it("SSR: erro propaga mesmo com fallback customizado", () => {
    const fallback = (error: Error) => (
      <div data-testid="custom-ssr-fallback">SSR Error: {error.message}</div>
    );

    // No SSR, erro sempre propaga - Boundary não captura
    expect(() =>
      renderToString(
        <Boundary fallback={fallback}>
          <Explode />
        </Boundary>,
      ),
    ).toThrow("boom");
  });
});
