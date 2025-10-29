import { describe, it, expect, vi } from "vitest";
import { verifyJWT, isJWTExpired } from "@/lib/security/jwt";

// Mock the jose library to avoid signature verification issues in tests
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  importJWK: vi.fn(),
}));

describe("JWT Security SSR", () => {
  const secret = "test-secret-key-for-jwt-verification";

  // Mock tokens for testing
  const validToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNzM1NzE5MjAwfQ.mock-signature";
  const expiredToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNTc3ODUzNjAwfQ.mock-signature";

  it("verifica JWT válido", async () => {
    // Mock successful verification
    const { jwtVerify } = await import("jose");
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: "user123", exp: 1735719200, iat: 1735715600 },
    });

    const testDate = new Date("2024-01-01");
    const result = await verifyJWT(validToken, secret, {
      currentDate: testDate,
    });

    expect(result.sub).toBe("user123");
    expect(result.exp).toBe(1735719200);
  });

  it("falha com token expirado", async () => {
    // Mock expired token error
    const { jwtVerify } = await import("jose");
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error("JWT expired"));

    const currentDate = new Date();
    await expect(
      verifyJWT(expiredToken, secret, { currentDate }),
    ).rejects.toThrow("JWT verification failed");
  });

  it("falha com secret incorreto", async () => {
    // Mock signature verification error
    const { jwtVerify } = await import("jose");
    vi.mocked(jwtVerify).mockRejectedValueOnce(
      new Error("signature verification failed"),
    );

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
