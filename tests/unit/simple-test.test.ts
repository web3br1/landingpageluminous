// Simple test to verify Vitest + React setup
import { describe, it, expect } from "vitest";

describe("Simple Test", () => {
  it("should work", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle strings", () => {
    expect("hello").toBe("hello");
  });
});
