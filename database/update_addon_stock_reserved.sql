-- Migration: Update AddOnVariant stock_reserved when entitlements are created/modified
-- This ensures stock_reserved reflects the sum of qty_reserved across all entitlements

-- Function to recalculate stock_reserved for a variant
CREATE OR REPLACE FUNCTION public.recalculate_addon_variant_stock_reserved(
    p_variant_id integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_reserved integer;
BEGIN
    -- Calculate total reserved quantity across all entitlements for this variant
    SELECT COALESCE(SUM(qty_reserved), 0)::integer
    INTO v_total_reserved
    FROM public."AttendeeEntitlement"
    WHERE add_on_variant_id = p_variant_id;
    
    -- Update the AddOnVariant stock_reserved
    UPDATE public."AddOnVariant"
    SET stock_reserved = v_total_reserved,
        updated_at = NOW()
    WHERE id = p_variant_id;
    
    RETURN v_total_reserved;
END;
$$;

-- Trigger function to update stock_reserved on entitlement changes
CREATE OR REPLACE FUNCTION public.update_variant_stock_reserved_from_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_variant_id integer;
BEGIN
    -- Get the affected variant_id
    IF TG_OP = 'DELETE' THEN
        v_variant_id := OLD.add_on_variant_id;
    ELSE
        v_variant_id := NEW.add_on_variant_id;
    END IF;
    
    -- Also update old variant if it changed (UPDATE case)
    IF TG_OP = 'UPDATE' AND OLD.add_on_variant_id IS DISTINCT FROM NEW.add_on_variant_id THEN
        -- Recalculate for old variant
        PERFORM public.recalculate_addon_variant_stock_reserved(OLD.add_on_variant_id);
        -- Set for new variant
        v_variant_id := NEW.add_on_variant_id;
    END IF;
    
    -- Recalculate for the affected variant
    IF v_variant_id IS NOT NULL THEN
        PERFORM public.recalculate_addon_variant_stock_reserved(v_variant_id);
    END IF;
    
    -- Return appropriate row
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_stock_reserved ON public."AttendeeEntitlement";

-- Create trigger to maintain stock_reserved
CREATE TRIGGER trg_update_stock_reserved
    AFTER INSERT OR UPDATE OR DELETE
    ON public."AttendeeEntitlement"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_variant_stock_reserved_from_entitlement();

-- Backfill existing data: recalculate stock_reserved for all variants
DO $$
DECLARE
    v_variant record;
BEGIN
    FOR v_variant IN SELECT id FROM public."AddOnVariant" LOOP
        PERFORM public.recalculate_addon_variant_stock_reserved(v_variant.id);
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.recalculate_addon_variant_stock_reserved IS 'Recalculates and updates stock_reserved for a given variant based on sum of qty_reserved in AttendeeEntitlement';
COMMENT ON FUNCTION public.update_variant_stock_reserved_from_entitlement IS 'Trigger function to maintain stock_reserved consistency when entitlements change';
