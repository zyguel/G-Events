import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateAddOnMock, requireUserMock } = vi.hoisted(() => ({
  updateAddOnMock: vi.fn(),
  requireUserMock: vi.fn(),
}));

vi.mock("@/lib/apiAuth", () => ({
  requireUser: requireUserMock,
}));

vi.mock("@/lib/db", () => ({
  getAddOn: vi.fn(),
  updateAddOn: updateAddOnMock,
  deleteAddOn: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { PATCH } from "@/app/api/events/[eventId]/addons/[addOnId]/route";

const buildUpdateRequest = (fields: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return new Request("https://app.example/api/events/1/addons/9", {
    method: "PATCH",
    body: formData,
  });
};

describe("addons update route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({});
    updateAddOnMock.mockResolvedValue({ id: 9, name: "Booth" });
  });

  it("rejects descriptions longer than 256 characters", async () => {
    const response = await PATCH(
      buildUpdateRequest({ description: "x".repeat(257) }) as never,
      { params: Promise.resolve({ eventId: "1", addOnId: "9" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Add-on description must be at most 256 characters.",
    });
    expect(updateAddOnMock).not.toHaveBeenCalled();
  });

  it("normalizes provided name and description on update", async () => {
    const response = await PATCH(
      buildUpdateRequest({
        name: "  Merchandise Booth  ",
        description: "  Updated description.  ",
      }) as never,
      { params: Promise.resolve({ eventId: "1", addOnId: "9" }) }
    );

    expect(response.status).toBe(200);
    expect(updateAddOnMock).toHaveBeenCalledWith(
      9,
      {
        name: "Merchandise Booth",
        description: "Updated description.",
        image_path: undefined,
        has_variants: undefined,
      },
      undefined,
      undefined
    );
  });

  it("passes ticket_ids when provided", async () => {
    const response = await PATCH(
      buildUpdateRequest({
        ticket_ids: JSON.stringify([5]),
      }) as never,
      { params: Promise.resolve({ eventId: "1", addOnId: "9" }) }
    );

    expect(response.status).toBe(200);
    expect(updateAddOnMock).toHaveBeenCalledWith(
      9,
      {
        name: undefined,
        description: undefined,
        image_path: undefined,
        has_variants: undefined,
      },
      undefined,
      [5]
    );
  });

  it("rejects invalid ticket_ids payload", async () => {
    const response = await PATCH(
      buildUpdateRequest({
        ticket_ids: JSON.stringify("not-an-array"),
      }) as never,
      { params: Promise.resolve({ eventId: "1", addOnId: "9" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Invalid ticket_ids payload.",
    });
    expect(updateAddOnMock).not.toHaveBeenCalled();
  });
});
