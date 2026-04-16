// lib/hooks/useOrderFormSubmit.ts

import { useState, useCallback } from 'react';
import { OrderFormData, FormInputField } from '@/lib/types';

interface FormAnswers {
    [inputId: string]: string | string[] | null;
}

interface UseOrderFormSubmitProps {
    eventId: number;
    orderFormId: number;
    userEmail?: string;
    registrationId?: number;
}

interface UseOrderFormSubmitReturn {
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
    successMessage: string | null;
    submissionResult: Record<string, unknown> | null;
    submit: (
        formData: OrderFormData,
        answers: FormAnswers,
        ticketId?: number | null,
        groupEmails?: string[],
        breakoutSessionId?: number | null,
        promotionCode?: string | null,
        waitlistInviteToken?: string | null
    ) => Promise<void>;
}

export function useOrderFormSubmit({
    eventId,
    orderFormId,
    userEmail,
    registrationId
}: UseOrderFormSubmitProps): UseOrderFormSubmitReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [submissionResult, setSubmissionResult] = useState<Record<string, unknown> | null>(null);

    const submit = useCallback(async (
        formData: OrderFormData,
        answers: FormAnswers,
        ticketId?: number | null,
        groupEmails?: string[],
        breakoutSessionId?: number | null,
        promotionCode?: string | null,
        waitlistInviteToken?: string | null
    ) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        setSuccessMessage(null);
        setSubmissionResult(null);

        try {
            // Enrich form data with answers
            const enrichedFormData: OrderFormData = {
                sections: formData.sections.map(section => ({
                    ...section,
                    inputs: section.inputs.map(input => ({
                        ...input,
                        answer: answers[input.id] || null
                    }))
                }))
            };

            const response = await fetch(`/api/orderform/${orderFormId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    formData: enrichedFormData,
                    userEmail,
                    registrationId,
                    ticketId,
                    groupEmails,
                    breakoutSessionId,
                    promotionCode,
                    waitlistInviteToken,
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result?.success) {
                setError(result?.error || 'Failed to submit form');
                return;
            }

            setSuccess(true);
            setSuccessMessage(result?.message || 'Form submitted successfully.');
            setSubmissionResult(result && typeof result === 'object' ? result : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    }, [eventId, orderFormId, userEmail, registrationId]);

    return {
        isSubmitting,
        error,
        success,
        successMessage,
        submissionResult,
        submit
    };
}
