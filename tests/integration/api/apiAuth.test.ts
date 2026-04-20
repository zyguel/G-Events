import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { getAuthErrorResponse } from "@/lib/apiAuth";

describe("api auth error adapter", () => {
  it("maps generic response objects to NextResponse", async () => {
    const response = new Response("Forbidden", { status: 403, statusText: "Forbidden" });
    const mapped = getAuthErrorResponse(response);

    expect(mapped).toBeInstanceOf(NextResponse);
    expect(mapped?.status).toBe(403);
    expect(await mapped?.json()).toEqual({ error: "Forbidden" });
  });
});
