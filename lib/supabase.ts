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
