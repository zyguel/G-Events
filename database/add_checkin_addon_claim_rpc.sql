-- Migration: Atomic add-on claim RPC for check-in
-- Ensures entitlement, stock, and redemption writes happen in one transaction.

DROP FUNCTION IF EXISTS public.claim_registration_addons_atomic(integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.claim_registration_addons_atomic(
    p_event_id integer,
    p_registration_id integer,
    p_station text DEFAULT 'checkin',
    p_scanned_by text DEFAULT NULL
)
RETURNS TABLE (
    entitlement_id integer,
    add_on_variant_id integer,
    add_on_name text,
    variant_label text,
    claimed_qty integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now timestamptz := now();
    v_station text := coalesce(nullif(trim(coalesce(p_station, '')), ''), 'checkin');
    v_scanned_by text := nullif(trim(coalesce(p_scanned_by, '')), '');
    v_registration record;
BEGIN
    SELECT id, event_id, status
    INTO v_registration
    FROM public."Registration"
    WHERE id = p_registration_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_registration.event_id <> p_event_id THEN
        RAISE EXCEPTION 'Registration does not belong to this event'
            USING ERRCODE = '22023';
    END IF;

    IF lower(coalesce(v_registration.status, '')) <> 'confirmed' THEN
        RAISE EXCEPTION 'Only confirmed registrations can claim add-ons'
            USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH locked_entitlements AS (
        SELECT
            e.id AS entitlement_id,
            e.add_on_variant_id,
            coalesce(e.qty_total, 0)::integer AS qty_total,
            coalesce(e.qty_reserved, 0)::integer AS qty_reserved,
            coalesce(e.qty_redeemed, 0)::integer AS qty_redeemed,
            coalesce(a.name, 'Add-on')::text AS add_on_name,
            coalesce(v.label, 'Default')::text AS variant_label
        FROM public."AttendeeEntitlement" e
        JOIN public."AddOnVariant" v ON v.id = e.add_on_variant_id
        LEFT JOIN public."AddOn" a ON a.id = v.add_on_id
        WHERE e.registration_id = p_registration_id
        FOR UPDATE OF e, v
    ),
    claimable AS (
        SELECT
            le.entitlement_id,
            le.add_on_variant_id,
            greatest(le.qty_total - le.qty_redeemed, 0)::integer AS claim_qty,
            greatest(le.qty_reserved - greatest(le.qty_total - le.qty_redeemed, 0), 0)::integer AS next_qty_reserved,
            le.add_on_name,
            le.variant_label
        FROM locked_entitlements le
        WHERE greatest(le.qty_total - le.qty_redeemed, 0) > 0
    ),
    variant_totals AS (
        SELECT
            c.add_on_variant_id,
            sum(c.claim_qty)::integer AS claim_qty
        FROM claimable c
        GROUP BY c.add_on_variant_id
    ),
    updated_entitlements AS (
        UPDATE public."AttendeeEntitlement" e
        SET
            qty_redeemed = coalesce(e.qty_redeemed, 0) + c.claim_qty,
            qty_reserved = c.next_qty_reserved,
            updated_at = v_now
        FROM claimable c
        WHERE e.id = c.entitlement_id
        RETURNING
            c.entitlement_id,
            c.add_on_variant_id,
            c.add_on_name,
            c.variant_label,
            c.claim_qty
    ),
    updated_variants AS (
        UPDATE public."AddOnVariant" v
        SET
            stock_reserved = greatest(coalesce(v.stock_reserved, 0) - vt.claim_qty, 0),
            stock_redeemed = coalesce(v.stock_redeemed, 0) + vt.claim_qty,
            updated_at = v_now
        FROM variant_totals vt
        WHERE v.id = vt.add_on_variant_id
        RETURNING v.id
    ),
    inserted_redemptions AS (
        INSERT INTO public."AddOnRedemption" (
            registration_id,
            entitlement_id,
            add_on_variant_id,
            qty,
            redeemed_at,
            station,
            scanned_by
        )
        SELECT
            p_registration_id,
            ue.entitlement_id,
            ue.add_on_variant_id,
            ue.claim_qty,
            v_now,
            v_station,
            v_scanned_by
        FROM updated_entitlements ue
        JOIN updated_variants uv ON uv.id = ue.add_on_variant_id
        RETURNING id
    )
    SELECT
        ue.entitlement_id,
        ue.add_on_variant_id,
        ue.add_on_name,
        ue.variant_label,
        ue.claim_qty
    FROM updated_entitlements ue
    ORDER BY ue.entitlement_id;

    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_registration_addons_atomic(integer, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_registration_addons_atomic(integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_registration_addons_atomic(integer, integer, text, text) TO service_role;
