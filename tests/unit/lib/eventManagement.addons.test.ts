import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAddOn, getAddOns, updateAddOn } from "@/lib/eventManagement";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("eventManagement add-on ticket scope mapping", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("maps AddOnTicket rows to appliedTo on read", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            id: 11,
            name: "Backstage Merch",
            description: "VIP-only add-on",
            image_path: null,
            has_variants: false,
            AddOnVariant: [{ id: 201, label: "Default", stock_total: 12 }],
            AddOnTicket: [{ ticket_id: 7 }],
            created_at: "2026-04-20T00:00:00.000Z",
          },
        ],
      })
    );

    const addOns = await getAddOns("event-1");

    expect(addOns).toHaveLength(1);
    expect(addOns[0]?.appliedTo).toEqual(["7"]);
  });

  it("sends empty ticket_ids for all-ticket add-ons", async () => {
    fetchMock.mockImplementationOnce(async (input, init) => {
      expect(String(input)).toBe("/api/events/1/addons");
      expect(init?.method).toBe("POST");

      const body = init?.body;
      expect(body).toBeInstanceOf(FormData);

      const formData = body as FormData;
      expect(formData.get("ticket_ids")).toBe("[]");

      return jsonResponse({
        success: true,
        data: {
          id: 12,
          name: "General Merch",
          description: "Available to everyone",
          image_path: null,
          has_variants: false,
          AddOnVariant: [{ id: 301, label: "Default", stock_total: 25 }],
          AddOnTicket: [],
          created_at: "2026-04-20T00:00:00.000Z",
        },
      }, 201);
    });

    const created = await createAddOn("1", {
      name: "General Merch",
      description: "Available to everyone",
      hasVariants: false,
      variants: [],
      stock: 25,
      appliedTo: "all",
    });

    expect(created.appliedTo).toBe("all");
  });

  it("sends selected ticket_ids for ticket-scoped updates", async () => {
    fetchMock.mockImplementationOnce(async (input, init) => {
      expect(String(input)).toBe("/api/events/1/addons/12");
      expect(init?.method).toBe("PATCH");

      const body = init?.body;
      expect(body).toBeInstanceOf(FormData);

      const formData = body as FormData;
      expect(formData.get("ticket_ids")).toBe("[9]");

      return jsonResponse({
        success: true,
        data: {
          id: 12,
          name: "General Merch",
          description: "Available to selected ticket",
          image_path: null,
          has_variants: false,
          AddOnVariant: [{ id: 301, label: "Default", stock_total: 25 }],
          AddOnTicket: [{ ticket_id: 9 }],
          created_at: "2026-04-20T00:00:00.000Z",
        },
      });
    });

    const updated = await updateAddOn("1", "12", {
      appliedTo: ["9"],
    });

    expect(updated?.appliedTo).toEqual(["9"]);
  });
});
