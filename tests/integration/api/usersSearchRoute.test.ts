import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/apiAuth", async () => ({
  ...(await vi.importActual("@/lib/apiAuth")),
  requireUser: vi.fn(async () => {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),
}));

vi.mock("@/lib/supabase-server", () => ({
  createAdminClient: vi.fn(),
}));

import { GET } from "@/app/api/users/search/route";

describe("users search route", () => {
  it("preserves auth failures as 401 responses", async () => {
    const request = new Request("https://app.example/api/users/search?q=ab");
    const response = await GET(request as never);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});
