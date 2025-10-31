import { describe, it, expect, vi } from "vitest";
import { verifyJWT, isJWTExpired, __setJoseMock } from "@/lib/security/jwt";

// Mock the jose library globally
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  importJWK: vi.fn(),
}));

// Mock crypto globally for JWT verification
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: vi.fn((arr) => arr.fill(0)),
    subtle: {
      importKey: vi.fn(),
      verify: vi.fn(),
    },
  },
  writable: true,
});

describe("JWT Security SSR", () => {
  const secret = "test-secret-key-for-jwt-verification";

  // Mock tokens for testing
  const validToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNzM1NzE5MjAwfQ.mock-signature";
  const expiredToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNTc3ODUzNjAwfQ.mock-signature";

  it("verifica JWT válido", async () => {
    // Mock successful verification
    __setJoseMock({
      jwtVerify: vi.fn().mockResolvedValue({
        payload: { sub: "user123", exp: 1735719200, iat: 1735715600 },
        protectedHeader: { alg: "HS256" },
      }),
      importJWK: vi.fn().mockResolvedValue({ type: "secret" }),
    } as any);

    const testDate = new Date("2024-01-01");
    const result = await verifyJWT(validToken, secret, {
      currentDate: testDate,
    });

    expect(result.sub).toBe("user123");
    expect(result.exp).toBe(1735719200);
  });

  it("falha com token expirado", async () => {
    // Mock expired token error
    __setJoseMock({
      jwtVerify: vi.fn().mockRejectedValue(new Error("JWT expired")),
      importJWK: vi.fn().mockResolvedValue({ type: "secret" }),
    } as any);

    const currentDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Future date to force expiration
    await expect(
      verifyJWT(expiredToken, secret, { currentDate }),
    ).rejects.toThrow("JWT verification failed");
  });

  it("falha com secret incorreto", async () => {
    // Mock signature verification error
    __setJoseMock({
      jwtVerify: vi.fn().mockRejectedValue(new Error("signature verification failed")),
      importJWK: vi.fn().mockResolvedValue({ type: "secret" }),
    } as any);

    const testDate = new Date("2024-01-01");
    await expect(
      verifyJWT(validToken, "wrong-secret", { currentDate: testDate }),
    ).rejects.toThrow("JWT verification failed");
  });

  it("detecta token expirado via isJWTExpired", () => {
    // Valid token payload: exp = 1735719200 (Dec 31, 2024, 23:59:59 UTC)
    expect(isJWTExpired(validToken, new Date("2024-01-01"))).toBe(false); // Before expiration
    expect(isJWTExpired(validToken, new Date("2025-01-02"))).toBe(true); // After expiration (Jan 2, 2025)

    // Expired token payload: exp = 1577853600 (Dec 31, 2019)
    expect(isJWTExpired(expiredToken, new Date())).toBe(true); // Always expired now

    // Invalid token
    expect(isJWTExpired("invalid-token", new Date())).toBe(true);
  });
});
