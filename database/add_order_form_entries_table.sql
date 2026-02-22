-- Migration: Add OrderFormEntries table to store user responses to order forms
-- This table stores user input data from order forms with JSONB column for flexible field storage

CREATE TABLE public.OrderFormEntries (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    event_id bigint NOT NULL,
    registration_id bigint,
    order_form_id bigint NOT NULL,
    user_email character varying,
    form_data jsonb NOT NULL,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT OrderFormEntries_pkey PRIMARY KEY (id),
    CONSTRAINT OrderFormEntries_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id) ON DELETE CASCADE,
    CONSTRAINT OrderFormEntries_order_form_id_fkey FOREIGN KEY (order_form_id) REFERENCES public.OrderForm(id) ON DELETE CASCADE,
    CONSTRAINT OrderFormEntries_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_order_form_entries_event_id ON public.OrderFormEntries(event_id);
CREATE INDEX idx_order_form_entries_order_form_id ON public.OrderFormEntries(order_form_id);
CREATE INDEX idx_order_form_entries_registration_id ON public.OrderFormEntries(registration_id);
CREATE INDEX idx_order_form_entries_submitted_at ON public.OrderFormEntries(submitted_at);
CREATE INDEX idx_order_form_entries_form_data ON public.OrderFormEntries USING gin(form_data);

-- Example JSONB structure for form_data:
-- {
--   "sections": [
--     {
--       "id": "section-1234",
--       "title": "Personal Information",
--       "inputs": [
--         {
--           "id": "input-5678",
--           "question": "First Name",
--           "type": "short_answer",
--           "fieldIdentifier": "first_name",
--           "answer": "John"
--         },
--         {
--           "id": "input-5679",
--           "question": "Email",
--           "type": "short_answer",
--           "fieldIdentifier": "email",
--           "answer": "john@example.com"
--         },
--         {
--           "id": "input-5680",
--           "question": "Dietary Preferences",
--           "type": "checkboxes",
--           "fieldIdentifier": "dietary_restrictions",
--           "answers": ["Vegetarian", "Gluten-free"]
--         }
--       ]
--     }
--   ]
-- }
