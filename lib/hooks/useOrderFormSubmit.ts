// lib/hooks/useOrderFormSubmit.ts

import { useState, useCallback } from 'react';
import { OrderFormData, FormInputField } from '@/lib/types';
import { saveOrderFormEntry } from '@/lib/actions/orderForm';

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
    submit: (formData: OrderFormData, answers: FormAnswers) => Promise<void>;
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

    const submit = useCallback(async (
        formData: OrderFormData,
        answers: FormAnswers
    ) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

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

            const result = await saveOrderFormEntry(
                eventId,
                orderFormId,
                enrichedFormData,
                userEmail,
                registrationId
            );

            if (!result.success) {
                setError(result.error || 'Failed to submit form');
                return;
            }

            setSuccess(true);
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
        submit
    };
}
