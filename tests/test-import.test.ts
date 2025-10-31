// Simple test to check if shared imports work in vitest
import { describe, it, expect } from "vitest";
import { Result, isOk } from "@shared/core/Result";

describe("Import Test", () => {
  it("should import Result from shared", () => {
    expect(Result).toBeDefined();
    expect(isOk).toBeDefined();

    const okResult = Result.ok("test");
    expect(isOk(okResult)).toBe(true);
  });
});
