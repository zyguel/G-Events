import { NextResponse } from 'next/server';
import { getCurrentUserOrganizationMemberships } from '@/lib/auth/sessionRole';
import {
  ACTIVE_ORGANIZATION_COOKIE_NAME,
  SESSION_ROLE,
  SESSION_ROLE_COOKIE_NAME,
} from '@/lib/constants';
import { getRequestPublicOrigin } from '@/lib/requestPublicOrigin';

function getSafeNextPath(value: FormDataEntryValue | null) {
  const nextPath = typeof value === 'string' ? value.trim() : '';
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export async function POST(request: Request) {
  const publicOrigin = getRequestPublicOrigin(request);
  const formData = await request.formData();

  const role = formData.get('role');
  const nextPath = getSafeNextPath(formData.get('next'));
  const organizationIdValue = formData.get('organizationId');

  const context = await getCurrentUserOrganizationMemberships();

  if (!context.isAuthenticated) {
    const loginUrl = new URL('/login', publicOrigin);
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (role !== SESSION_ROLE.ATTENDEE && role !== SESSION_ROLE.ORGANIZER) {
    const selectRoleUrl = new URL('/auth/session-role', publicOrigin);
    selectRoleUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(selectRoleUrl, { status: 303 });
  }

  if (role === SESSION_ROLE.ATTENDEE) {
    const attendeeUrl = new URL('/home', publicOrigin);
    const response = NextResponse.redirect(attendeeUrl, { status: 303 });

    response.cookies.set({
      name: SESSION_ROLE_COOKIE_NAME,
      value: SESSION_ROLE.ATTENDEE,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set({
      name: ACTIVE_ORGANIZATION_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }

  if (context.memberships.length === 0) {
    const noOrgUrl = new URL('/auth/session-role', publicOrigin);
    noOrgUrl.searchParams.set('next', nextPath);
    noOrgUrl.searchParams.set('error', 'no-organization');
    return NextResponse.redirect(noOrgUrl, { status: 303 });
  }

  const selectedOrganizationId =
    typeof organizationIdValue === 'string' && organizationIdValue.trim().length > 0
      ? Number.parseInt(organizationIdValue.trim(), 10)
      : NaN;

  const hasExplicitSelection = Number.isInteger(selectedOrganizationId);

  if (!hasExplicitSelection && context.memberships.length > 1) {
    const chooseOrganizationUrl = new URL('/auth/session-role/organization', publicOrigin);
    chooseOrganizationUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(chooseOrganizationUrl, { status: 303 });
  }

  const selectedMembership = hasExplicitSelection
    ? context.memberships.find((membership) => membership.organizationId === selectedOrganizationId)
    : context.memberships[0];

  if (!selectedMembership) {
    const chooseOrganizationUrl = new URL('/auth/session-role/organization', publicOrigin);
    chooseOrganizationUrl.searchParams.set('next', nextPath);
    chooseOrganizationUrl.searchParams.set('error', 'invalid-organization');
    return NextResponse.redirect(chooseOrganizationUrl, { status: 303 });
  }

  const redirectUrl = new URL(nextPath, publicOrigin);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });

  response.cookies.set({
    name: SESSION_ROLE_COOKIE_NAME,
    value: SESSION_ROLE.ORGANIZER,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  response.cookies.set({
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: String(selectedMembership.organizationId),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
