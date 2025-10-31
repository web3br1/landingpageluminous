// Test Sentinel - Verificação automática de aliases @shared
// Este arquivo garante que aliases funcionem em todas as pastas de teste
// Se falhar, indica problema de configuração no vitest.config.ts

import { describe, it, expect } from "vitest";
import { Result, isOk } from "../../../shared/core/Result";
import { AppError, createAppError } from "../../../shared/errors/index";

describe("Alias Verification Sentinel", () => {
  it("should resolve @shared/core imports", () => {
    expect(Result).toBeDefined();
    expect(isOk).toBeDefined();

    const result = Result.ok("test");
    expect(isOk(result)).toBe(true);
  });

  it("should resolve @shared/errors imports", () => {
    expect(AppError).toBeDefined();
    expect(createAppError).toBeDefined();

    const error = createAppError("VALIDATION_ERROR", "Test error");
    expect(error).toHaveProperty("code", "VALIDATION_ERROR");
    expect(error).toHaveProperty("message", "Test error");
  });

  it("should handle Result operations", () => {
    const ok = Result.ok("success");
    const err = Result.err("error");

    expect(isOk(ok)).toBe(true);
    expect(isOk(err)).toBe(false);
  });
});
