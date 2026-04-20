import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/sessionRole", () => ({
  getCurrentUserOrganizationMemberships: vi.fn(),
}));

import { POST } from "@/app/auth/session-role/choose/route";
import { getCurrentUserOrganizationMemberships } from "@/lib/auth/sessionRole";

describe("session role choose route", () => {
  it("blocks protocol-relative next redirects", async () => {
    vi.mocked(getCurrentUserOrganizationMemberships).mockResolvedValue({
      isAuthenticated: true,
      email: "owner@example.com",
      memberships: [
        {
          organizationId: 7,
          organizationName: "Core Org",
          organizationRoleId: 2,
          organizationRoleName: "Owner",
        },
      ],
    });

    const body = new URLSearchParams({
      role: "organizer",
      next: "//evil.example/phish",
      organizationId: "7",
    });

    const request = new Request("https://app.example/auth/session-role/choose", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.example/dashboard");
  });
});
