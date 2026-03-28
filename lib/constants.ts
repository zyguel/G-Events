const parsedDefaultOrgId = Number.parseInt(process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? '1', 10)

export const DEFAULT_ORG_ID = Number.isNaN(parsedDefaultOrgId) ? 1 : parsedDefaultOrgId

export const SESSION_ROLE_COOKIE_NAME = 'g_events_session_role'
export const ACTIVE_ORGANIZATION_COOKIE_NAME = 'g_events_active_organization_id'

export const SESSION_ROLE = {
    ATTENDEE: 'attendee',
    ORGANIZER: 'organizer',
} as const

export type SessionRole = (typeof SESSION_ROLE)[keyof typeof SESSION_ROLE]

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const
