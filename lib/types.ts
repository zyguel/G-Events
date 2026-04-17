
export type EventStatus = "Ongoing" | "Completed" | "Not Yet Published" | "Published" | "Not Started" | "Cancelled" | "Draft";

export interface EventSummary {
    id: string;
    name: string;
    date: string;
    status: EventStatus;
    eventStartAt?: string | null;
    eventEndAt?: string | null;
    allowWaitlist?: boolean;
}

export interface EventData {
    id: string;
    name: string;
    date: string;
    status: EventStatus;
    stats: {
        totalEvents: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    comments: Comment[];
    trends: {
        registrations: {
            // Weekly format for individual events
            weekly?: number[];
            weekLabels?: string[];
            registrationOpenDate?: string;
            eventDate?: string;
            // Monthly format for all events overview
            monthly?: number[];
            monthLabels?: string[];
        };
        attendance: {
            checkedIn: number;
            noShow: number;
            waitlisted: number;
        };
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
    topEvents?: { id: string; name: string; registrations: number; revenue: number; satisfaction: number; attendance: number }[];
    location?: string;
    description?: string;
    bannerImage?: string;
    startTime?: string;
    endTime?: string;
    allowGroupRegistration?: boolean;
    allowWaitlist?: boolean;
    enableBreakoutSession?: boolean;
    isVisibleToPublic?: boolean;
    registrationOpenDate?: string;
    registrationOpenTime?: string;
    registrationCloseDate?: string;
    registrationCloseTime?: string;
}

export interface Comment {
    user: string;
    rating: number;
    text: string;
    time: string;
    eventName?: string;
}
// Order Form Types
export type FormInputType = "short_answer" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "file_upload" | "multiple_choice_grid" | "checkbox_grid" | "date" | "time";

export type FieldIdentifierType = 
    | "first_name" 
    | "last_name" 
    | "email" 
    | "phone" 
    | "gender" 
    | "age" 
    | "date_of_birth" 
    | "address" 
    | "city" 
    | "state" 
    | "country" 
    | "zip_code" 
    | "company" 
    | "job_title" 
    | "department" 
    | "dietary_restrictions" 
    | "special_needs" 
    | "agree_to_terms" 
    | "newsletter_signup" 
    /** Proof of payment file — shown only to main registrant; hidden for group invite flow */
    | "proof_of_payment"
    /** Payment / bank reference code — main registrant only; hidden for group invite flow */
    | "payment_reference"
    | "custom";

export interface FormInputField {
    id: string;
    question: string;
    type: FormInputType;
    fieldIdentifier: FieldIdentifierType;
    required: boolean;
    options?: string[];
}

export interface FormSection {
    id: string;
    title: string;
    description: string;
    inputs: FormInputField[];
}

export interface OrderFormData {
    sections: FormSection[];
}

export interface OrderFormEntry {
    id: number;
    event_id: number;
    registration_id?: number;
    order_form_id: number;
    user_email?: string;
    form_data: OrderFormData;
    submitted_at: string;
    created_at: string;
    updated_at: string;
}

export interface FormDataAnswer {
    id: string;
    question: string;
    type: FormInputType;
    fieldIdentifier: FieldIdentifierType;
    answer?: string | string[] | null;
}