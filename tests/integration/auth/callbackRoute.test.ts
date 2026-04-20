import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: vi.fn(),
      verifyOtp: vi.fn(),
    },
  })),
}));

import { GET } from "@/app/auth/callback/route";

describe("auth callback route", () => {
  it("sanitizes protocol-relative next values", async () => {
    const request = new Request(
      "https://app.example/auth/callback?code=abc123&next=//evil.example/phish",
      { method: "GET" }
    );

    const response = await GET(request);
    expect(response.status).toBe(307);

    const location = response.headers.get("location");
    expect(location).toBe("https://app.example/auth/session-role?next=%2Fdashboard");
  });
});
