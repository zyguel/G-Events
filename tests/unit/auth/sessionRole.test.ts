import { describe, expect, it } from "vitest";
import { parseOrganizationId, resolveActiveOrganizationId } from "@/lib/auth/sessionRole";

describe("session role helpers", () => {
  it("parses numeric organization ids", () => {
    expect(parseOrganizationId("42")).toBe(42);
  });

  it("returns null for invalid organization ids", () => {
    expect(parseOrganizationId("abc")).toBeNull();
    expect(parseOrganizationId(null)).toBeNull();
  });

  it("falls back to first membership when preferred org is unavailable", () => {
    const memberships = [
      { organizationId: 3, organizationName: "Gamma", organizationRoleId: null, organizationRoleName: null },
      { organizationId: 9, organizationName: "Iota", organizationRoleId: null, organizationRoleName: null },
    ];

    expect(resolveActiveOrganizationId(memberships, 99)).toBe(3);
  });
});
