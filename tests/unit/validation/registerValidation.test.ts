import { describe, expect, it } from "vitest";
import { normalizeRegisterInput, REGISTER_LIMITS, validateRegisterInput } from "@/lib/validation/register";

describe("register validation", () => {
  it("preserves password whitespace in normalization", () => {
    const normalized = normalizeRegisterInput({
      fullName: "  John   Doe  ",
      email: "  JOHN@example.com  ",
      password: "  P@ss word!  ",
    });

    expect(normalized.fullName).toBe("John Doe");
    expect(normalized.email).toBe("john@example.com");
    expect(normalized.password).toBe("  P@ss word!  ");
  });

  it("allows non-alphanumeric password characters", () => {
    const error = validateRegisterInput({
      fullName: "John Doe",
      email: "john@example.com",
      password: "P@ssw0rd!",
    });

    expect(error).toBeNull();
  });

  it("still enforces password minimum length", () => {
    const error = validateRegisterInput({
      fullName: "John Doe",
      email: "john@example.com",
      password: "short7!",
    });

    expect(error).toBe(`Password must be at least ${REGISTER_LIMITS.PASSWORD_MIN} characters.`);
  });

  it("still enforces alphanumeric full names", () => {
    const error = validateRegisterInput({
      fullName: "John_Doe",
      email: "john@example.com",
      password: "P@ssw0rd!",
    });

    expect(error).toBe("Full name may only contain letters, numbers, and spaces.");
  });
});
