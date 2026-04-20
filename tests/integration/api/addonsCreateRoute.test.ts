import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAddOnMock, requireUserMock } = vi.hoisted(() => ({
  createAddOnMock: vi.fn(),
  requireUserMock: vi.fn(),
}));

vi.mock("@/lib/apiAuth", () => ({
  requireUser: requireUserMock,
}));

vi.mock("@/lib/db", () => ({
  getAddOns: vi.fn(),
  createAddOn: createAddOnMock,
}));

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { POST } from "@/app/api/events/[eventId]/addons/route";

const buildCreateRequest = (fields: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return new Request("https://app.example/api/events/1/addons", {
    method: "POST",
    body: formData,
  });
};

describe("addons create route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({});
    createAddOnMock.mockResolvedValue({ id: 1, name: "Booth" });
  });

  it("rejects add-on names longer than 23 characters", async () => {
    const response = await POST(
      buildCreateRequest({
        name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        description: "A valid description",
        has_variants: "false",
        variants: JSON.stringify([{ code: "default", label: "Default", stock_total: 5 }]),
      }) as never,
      { params: Promise.resolve({ eventId: "1" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Add-on name must be at most 23 characters.",
    });
    expect(createAddOnMock).not.toHaveBeenCalled();
  });

  it("rejects descriptions longer than 256 characters", async () => {
    const response = await POST(
      buildCreateRequest({
        name: "Booth",
        description: "x".repeat(257),
        has_variants: "false",
        variants: JSON.stringify([{ code: "default", label: "Default", stock_total: 5 }]),
      }) as never,
      { params: Promise.resolve({ eventId: "1" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Add-on description must be at most 256 characters.",
    });
    expect(createAddOnMock).not.toHaveBeenCalled();
  });

  it("normalizes name and description before create", async () => {
    const response = await POST(
      buildCreateRequest({
        name: "  Merch Booth  ",
        description: "  Official event merchandise booth.  ",
        has_variants: "false",
        variants: JSON.stringify([{ code: "default", label: "Default", stock_total: 5 }]),
      }) as never,
      { params: Promise.resolve({ eventId: "1" }) }
    );

    expect(response.status).toBe(201);
    expect(createAddOnMock).toHaveBeenCalledWith(
      1,
      {
        name: "Merch Booth",
        description: "Official event merchandise booth.",
        image_path: undefined,
        has_variants: false,
      },
      [{ code: "default", label: "Default", stock_total: 5 }],
      undefined
    );
  });

  it("passes ticket_ids when provided", async () => {
    const response = await POST(
      buildCreateRequest({
        name: "VIP Merch",
        description: "Limited add-on for VIP tickets",
        has_variants: "false",
        variants: JSON.stringify([{ code: "default", label: "Default", stock_total: 5 }]),
        ticket_ids: JSON.stringify([7]),
      }) as never,
      { params: Promise.resolve({ eventId: "1" }) }
    );

    expect(response.status).toBe(201);
    expect(createAddOnMock).toHaveBeenCalledWith(
      1,
      {
        name: "VIP Merch",
        description: "Limited add-on for VIP tickets",
        image_path: undefined,
        has_variants: false,
      },
      [{ code: "default", label: "Default", stock_total: 5 }],
      [7]
    );
  });

  it("rejects invalid ticket_ids payload", async () => {
    const response = await POST(
      buildCreateRequest({
        name: "Booth",
        description: "A valid description",
        has_variants: "false",
        variants: JSON.stringify([{ code: "default", label: "Default", stock_total: 5 }]),
        ticket_ids: JSON.stringify({ ticket: 1 }),
      }) as never,
      { params: Promise.resolve({ eventId: "1" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "Invalid ticket_ids payload.",
    });
    expect(createAddOnMock).not.toHaveBeenCalled();
  });
});
