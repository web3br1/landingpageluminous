import { describe, it, expect } from "vitest";
import { buildCSP, validateCSP } from "@/lib/security/csp";

describe("CSP Security SSR", () => {
  it("inclui ws em dev", () => {
    const csp = buildCSP({ ws: "ws://localhost:3000", dev: true });
    expect(csp).toContain("connect-src");
    expect(csp).toContain("ws://localhost:3000");
    expect(csp).toContain("wss:");
  });

  it("não inclui ws em produção", () => {
    const csp = buildCSP({ dev: false });
    expect(csp).toContain("connect-src");
    expect(csp).not.toContain("ws://");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("valida CSP básico", () => {
    const validCSP = buildCSP();
    expect(validateCSP(validCSP)).toBe(true);

    const invalidCSP = "invalid-directive 'none'";
    expect(validateCSP(invalidCSP)).toBe(false);
  });

  it("inclui diretivas de segurança essenciais", () => {
    const csp = buildCSP();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
