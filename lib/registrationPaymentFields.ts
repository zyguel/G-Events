import type { FormInputField, OrderFormData } from '@/lib/types';

/** Identifiers reserved for payment (main registrant only in group bookings). */
const PAYMENT_FIELD_IDS = new Set([
  'proof_of_payment',
  'payment_reference',
  'payment_proof',
  'payment_ref',
  'bank_reference',
  'transaction_reference',
]);

/**
 * Fields the primary registrant handles for group bookings (proof + payment reference).
 * Prefer field identifiers `proof_of_payment` (file) and `payment_reference` (text) in the form builder.
 * Heuristics cover legacy forms that still use `custom` with payment-related wording.
 */
export function isPaymentRelatedField(input: Pick<FormInputField, 'fieldIdentifier' | 'type' | 'question'>): boolean {
  const fid = String(input.fieldIdentifier || '').toLowerCase();
  if (PAYMENT_FIELD_IDS.has(fid)) {
    return true;
  }

  const q = String(input.question || '').toLowerCase();
  const isTextRef =
    input.type === 'short_answer' || input.type === 'paragraph';

  if (input.type === 'file_upload') {
    const paymentish = q.includes('payment') || q.includes('pay ') || q.includes('pay.') || q.includes('transfer') || q.includes('deposit');
    const proofish =
      q.includes('proof') || q.includes('receipt') || q.includes('invoice') || q.includes('screenshot');
    if (paymentish && proofish) {
      return true;
    }
  }

  if (isTextRef && q.includes('payment') && (q.includes('reference') || q.includes('ref') || q.includes('code'))) {
    return true;
  }

  if (isTextRef && (q.includes('bank') || q.includes('transaction')) && (q.includes('reference') || q.includes('ref') || q.includes('id'))) {
    return true;
  }

  return false;
}

export function filterFormForGroupSecondary(form: OrderFormData): OrderFormData {
  return {
    sections: form.sections.map((section) => ({
      ...section,
      inputs: section.inputs.filter((input) => !isPaymentRelatedField(input)),
    })),
  };
}
