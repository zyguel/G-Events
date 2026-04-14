-- Migration: Extend existing Feedback tables + add FeedbackSubmission
-- Safe to run multiple times (idempotent).
-- Run this in Supabase SQL Editor.

-- ── Shared trigger function (idempotent) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ── ALTER FeedbackForm — add missing columns ─────────────────────────────────
ALTER TABLE public."FeedbackForm"
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill: any existing row without is_active should be treated as active
UPDATE public."FeedbackForm" SET is_active = true WHERE is_active IS NULL;

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS trg_feedback_form_updated_at ON public."FeedbackForm";
CREATE TRIGGER trg_feedback_form_updated_at
BEFORE UPDATE ON public."FeedbackForm"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- ── ALTER FeedbackQuestion — add missing columns ─────────────────────────────
ALTER TABLE public."FeedbackQuestion"
    ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Copy existing "order" into display_order where display_order is still 0
UPDATE public."FeedbackQuestion"
SET display_order = "order"
WHERE "order" IS NOT NULL AND display_order = 0;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_feedback_question_updated_at ON public."FeedbackQuestion";
CREATE TRIGGER trg_feedback_question_updated_at
BEFORE UPDATE ON public."FeedbackQuestion"
FOR EACH ROW EXECUTE PROCEDURE public.set_timestamp_updated_at();

-- ── CREATE FeedbackSubmission (new table) ────────────────────────────────────
-- One row per attendee who completes the feedback form.
-- Links to FeedbackForm and optionally to a Registration.
CREATE TABLE IF NOT EXISTS public."FeedbackSubmission" (
    id               bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    feedback_form_id integer NOT NULL REFERENCES public."FeedbackForm"(id) ON DELETE CASCADE,
    event_id         integer NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
    registration_id  integer REFERENCES public."Registration"(id) ON DELETE SET NULL,
    submitter_name   text,
    submitter_email  text,
    submitted_at     timestamptz NOT NULL DEFAULT now(),
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_submission_form_id
    ON public."FeedbackSubmission"(feedback_form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submission_event_id
    ON public."FeedbackSubmission"(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submission_email
    ON public."FeedbackSubmission"(submitter_email);
CREATE INDEX IF NOT EXISTS idx_feedback_submission_submitted
    ON public."FeedbackSubmission"(submitted_at DESC);

-- ── ALTER FeedbackAnswer — add feedback_submission_id (nullable) ─────────────
-- Existing rows keep their registration_id link (no data loss).
-- New submissions populate feedback_submission_id instead.
ALTER TABLE public."FeedbackAnswer"
    ADD COLUMN IF NOT EXISTS feedback_submission_id bigint
        REFERENCES public."FeedbackSubmission"(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_feedback_answer_submission_id
    ON public."FeedbackAnswer"(feedback_submission_id)
    WHERE feedback_submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_answer_form_id
    ON public."FeedbackAnswer"(feedback_form_id);

CREATE INDEX IF NOT EXISTS idx_feedback_answer_question_id
    ON public."FeedbackAnswer"(feedback_question_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public."FeedbackForm"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeedbackQuestion"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeedbackSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeedbackAnswer"     ENABLE ROW LEVEL SECURITY;

-- FeedbackForm: public read (attendees load the form), service role full access
DROP POLICY IF EXISTS "feedback_form_select_all"    ON public."FeedbackForm";
CREATE POLICY "feedback_form_select_all"
    ON public."FeedbackForm" FOR SELECT USING (true);

DROP POLICY IF EXISTS "feedback_form_all_service"   ON public."FeedbackForm";
CREATE POLICY "feedback_form_all_service"
    ON public."FeedbackForm" FOR ALL USING (auth.role() = 'service_role');

-- FeedbackQuestion: same
DROP POLICY IF EXISTS "feedback_question_select_all"  ON public."FeedbackQuestion";
CREATE POLICY "feedback_question_select_all"
    ON public."FeedbackQuestion" FOR SELECT USING (true);

DROP POLICY IF EXISTS "feedback_question_all_service" ON public."FeedbackQuestion";
CREATE POLICY "feedback_question_all_service"
    ON public."FeedbackQuestion" FOR ALL USING (auth.role() = 'service_role');

-- FeedbackSubmission: anyone can insert; authenticated/service_role can read
DROP POLICY IF EXISTS "feedback_submission_insert_anon"  ON public."FeedbackSubmission";
CREATE POLICY "feedback_submission_insert_anon"
    ON public."FeedbackSubmission" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_submission_select_auth"  ON public."FeedbackSubmission";
CREATE POLICY "feedback_submission_select_auth"
    ON public."FeedbackSubmission" FOR SELECT
    USING (auth.role() IN ('authenticated', 'service_role'));

-- FeedbackAnswer: anyone can insert; authenticated/service_role can read
DROP POLICY IF EXISTS "feedback_answer_insert_anon"   ON public."FeedbackAnswer";
CREATE POLICY "feedback_answer_insert_anon"
    ON public."FeedbackAnswer" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_answer_select_auth"   ON public."FeedbackAnswer";
CREATE POLICY "feedback_answer_select_auth"
    ON public."FeedbackAnswer" FOR SELECT
    USING (auth.role() IN ('authenticated', 'service_role'));
