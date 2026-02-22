import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types based on database schema
export interface User {
    id: number;
    name: string;
    email: string;
    password_hash?: string;
    google_id?: string;
    created_at: string;
}

export interface OrganizationRole {
    id: number;
    organization_id: number;
    name: string;
    description?: string;
}

export interface OrganizationPermission {
    id: number;
    name: string;
    category: string;
}

export interface OrganizationUserRole {
    id: number;
    organization_id: number;
    user_id: number;
    organization_role_id: number;
}

export interface UserWithRole {
    id: number;
    name: string;
    email: string;
    role: string;
    roleId: number;
    avatar?: string;
}

// Event interface matching the public.Event table
export interface Event {
    id: number;
    organization_id: number;
    title: string;
    description?: string;
    banner_image?: string;
    event_start_at?: string;
    event_end_at?: string;
    location?: string;
    capacity?: number;
    allow_group_registration?: boolean;
    allow_waitlist?: boolean;
    allow_breakout_sessions?: boolean;
    registration_open_at?: string;
    registration_close_at?: string;
    is_published?: boolean;
    is_visible?: boolean;
    confirmation_page_message?: string;
    confirmation_email_subject?: string;
    confirmation_email_body?: string;
    objectives?: any[];
    theme?: string;
    created_at: string;
}

// OrderFormEntries interface for storing form submissions
export interface OrderFormEntry {
    id: number;
    event_id: number;
    registration_id?: number;
    order_form_id: number;
    user_email?: string;
    form_data: any; // JSONB containing the form responses
    submitted_at: string;
    created_at: string;
    updated_at: string;
}

