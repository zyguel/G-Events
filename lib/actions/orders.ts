'use server';

import { createAdminClient } from "@/lib/supabase-server";
import { addOnRedemptionRowIsClaimed } from "@/lib/addOnRedemption";
import { getCachedEventOrders, setCachedEventOrders } from "@/lib/eventOrdersCache";

interface RegistrationUser {
    name: string | null;
    email: string | null;
}

interface RegistrationTicket {
    name: string | null;
    price: number | null;
    is_deleted: boolean | null;
}

type MaybeRelation<T> = T | T[] | null;

const normalizeRelation = <T,>(value: MaybeRelation<T> | undefined): T | null => {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
};

interface RegistrationOrderRow {
    id: number;
    status: string | null;
    created_at: string | null;
    registration_group_id: number | null;
    ticket_id: number | null;
    final_price_paid: number | null;
    User: RegistrationUser | null;
    Ticket: RegistrationTicket | null;
}

type RegistrationOrderRowRaw = Omit<RegistrationOrderRow, "User" | "Ticket"> & {
    User: MaybeRelation<RegistrationUser>;
    Ticket: MaybeRelation<RegistrationTicket>;
};

type OrderFormEntryRow = {
    registration_id: number | null;
    form_data: unknown;
    submitted_at: string | null;
};

const PROOF_OF_PAYMENT_FIELD_IDENTIFIER = "proof_of_payment";

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === "object" && value !== null && !Array.isArray(value)
);

const toNonEmptyString = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

function extractProofValue(value: unknown): string | null {
    const asString = toNonEmptyString(value);
    if (asString) return asString;

    if (Array.isArray(value)) {
        for (const item of value) {
            const nested = extractProofValue(item);
            if (nested) return nested;
        }
        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    const candidateKeys = [
        "publicUrl", "public_url", "url", "fileUrl", "file_url",
        "downloadUrl", "download_url", "filePath", "file_path",
        "path", "src", "value", "answer", "answers",
    ];

    for (const key of candidateKeys) {
        if (!(key in value)) continue;
        const nested = extractProofValue(value[key]);
        if (nested) return nested;
    }

    return null;
}

function extractProofFromFormData(formData: unknown): string | null {
    if (!isRecord(formData)) return null;

    const sections = formData.sections;
    if (!Array.isArray(sections)) return null;

    for (const section of sections) {
        if (!isRecord(section) || !Array.isArray(section.inputs)) continue;

        for (const input of section.inputs) {
            if (!isRecord(input)) continue;

            const fieldIdentifier = toNonEmptyString(input.fieldIdentifier) || toNonEmptyString(input.field_identifier);
            if (String(fieldIdentifier || "").toLowerCase() !== PROOF_OF_PAYMENT_FIELD_IDENTIFIER) {
                continue;
            }

            const proof = extractProofValue(input.answer ?? input.answers);
            if (proof) return proof;
        }
    }

    return null;
}

const mapStatusToUi = (s: string): "Confirmed" | "Pending" | "Rejected" => {
    if (s === "confirmed") return "Confirmed";
    if (s === "rejected" || s === "cancelled") return "Rejected";
    return "Pending";
};

export async function getOrdersByEventId(eventId: number) {
    try {
        const cached = getCachedEventOrders(eventId);
        if (cached) return cached;

        const supabase = await createAdminClient();

        const { data: regRows, error: regErr } = await supabase
            .from("Registration")
            .select("id, status, created_at, registration_group_id, ticket_id, final_price_paid, User(name, email), Ticket(name, price, is_deleted)")
            .eq("event_id", eventId)
            .order("created_at", { ascending: false });

        if (regErr) throw new Error(regErr.message);

        const registrations: RegistrationOrderRow[] = ((regRows || []) as RegistrationOrderRowRaw[])
            .map((row) => ({
                ...row,
                User: normalizeRelation(row.User),
                Ticket: normalizeRelation(row.Ticket),
            }));

        const registrationIds = registrations.map((r) => r.id);
        if (registrationIds.length === 0) {
            setCachedEventOrders(eventId, []);
            return [];
        }

        const toProofUrl = (rawValue: string): string => {
            const value = rawValue.trim();
            if (!value) return value;
            if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;

            const withoutLeadingSlash = value.replace(/^\/+/, "");
            const objectPath = withoutLeadingSlash.startsWith("events/")
                ? withoutLeadingSlash.slice("events/".length)
                : withoutLeadingSlash;

            if (!objectPath.includes("/")) return value;

            const { data } = supabase.storage.from("events").getPublicUrl(objectPath);
            return data.publicUrl || value;
        };

        const [addOnResult, paymentResult] = await Promise.all([
            supabase.from("AddOnRedemption").select("*").in("registration_id", registrationIds),
            supabase.from("PaymentProof").select("registration_id, file_path").in("registration_id", registrationIds),
        ]);

        const addOnByRegId = new Map<number, boolean>();
        (addOnResult.data || []).forEach((row: any) => {
            const regId = row.registration_id;
            const line = addOnRedemptionRowIsClaimed(row);
            if (!addOnByRegId.has(regId) || line) addOnByRegId.set(regId, line);
        });

        const paymentByRegId = new Map<number, string>();
        (paymentResult.data || []).forEach((row: any) => {
            if (row.registration_id && row.file_path) {
                paymentByRegId.set(row.registration_id, toProofUrl(row.file_path));
            }
        });

        const missingProofIds = registrationIds.filter(id => !paymentByRegId.has(id));
        const formProofByRegId = new Map<number, string>();

        if (missingProofIds.length > 0) {
            const { data: formRows } = await supabase
                .from("OrderFormEntries")
                .select("registration_id, form_data")
                .in("registration_id", missingProofIds);

            (formRows || []).forEach((row: any) => {
                const proof = extractProofFromFormData(row.form_data);
                if (proof) formProofByRegId.set(row.registration_id, toProofUrl(proof));
            });
        }

        const groupIdToEmails = new Map<number, string[]>();
        registrations.forEach(r => {
            if (r.registration_group_id) {
                if (!groupIdToEmails.has(r.registration_group_id)) groupIdToEmails.set(r.registration_group_id, []);
                if (r.User?.email) groupIdToEmails.get(r.registration_group_id)!.push(r.User.email);
            }
        });

        const formatterDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
        const formatterTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

        const orders = registrations.map((r) => {
            const createdAt = r.created_at ? new Date(r.created_at) : null;
            return {
                id: r.id.toString(),
                name: r.User?.name || "Unknown",
                email: r.User?.email || "",
                ticketId: r.ticket_id?.toString() || "",
                ticketType: r.Ticket?.name || "General Admission",
                ticketDeleted: !!r.Ticket?.is_deleted,
                ticketPrice: Number(r.Ticket?.price || 0),
                finalPricePaid: Number(r.final_price_paid || r.Ticket?.price || 0),
                registrationType: r.registration_group_id ? "Group" : "Individual",
                status: mapStatusToUi(r.status || ""),
                date: createdAt ? formatterDate.format(createdAt) : "",
                time: createdAt ? formatterTime.format(createdAt) : "",
                addOnStatus: addOnByRegId.get(r.id) ? "Claimed" : "Unclaimed",
                proofOfPayment: paymentByRegId.get(r.id) || formProofByRegId.get(r.id) || null,
                groupMemberEmails: r.registration_group_id ? groupIdToEmails.get(r.registration_group_id) || [] : [],
            };
        });

        setCachedEventOrders(eventId, orders as any[]);
        return orders;
    } catch (error) {
        console.error("getOrdersByEventId error:", error);
        return [];
    }
}
