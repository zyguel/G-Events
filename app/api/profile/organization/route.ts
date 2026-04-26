import { NextRequest } from 'next/server'
import { ok, unauthorized, internalServerError } from '@/lib/utils/apiResponse'
import { createClient } from '@/lib/supabase-server'
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from '@/lib/constants'
import { getCurrentUserActiveOrganization, parseOrganizationId } from '@/lib/auth/sessionRole'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorized('Unauthorized')
    }

    const preferredOrganizationId = parseOrganizationId(
      request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value
    )

    const context = await getCurrentUserActiveOrganization(preferredOrganizationId)
    const activeMembership = context.memberships.find(
      (membership) => membership.organizationId === context.activeOrganizationId
    )

    return ok({
      organizationName: activeMembership?.organizationName || 'Organization',
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
        console.error('Profile organization API error:', error);
    }
    return internalServerError('Failed to resolve organization')
  }
}
