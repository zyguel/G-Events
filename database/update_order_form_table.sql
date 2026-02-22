-- Migration: Add form_data JSONB column to OrderForm table
-- This allows storing the complete form structure (sections, inputs, options) as JSONB

ALTER TABLE public.OrderForm 
ADD COLUMN form_data jsonb DEFAULT '{"sections":[]}'::jsonb;

-- Create index for efficient JSONB queries
CREATE INDEX idx_order_form_form_data ON public.OrderForm USING gin(form_data);

-- Update trigger to set updated_at when form_data changes
ALTER TABLE public.OrderForm
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

CREATE OR REPLACE FUNCTION update_order_form_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_form_update_timestamp ON public.OrderForm;

CREATE TRIGGER order_form_update_timestamp
BEFORE UPDATE ON public.OrderForm
FOR EACH ROW
EXECUTE FUNCTION update_order_form_timestamp();
