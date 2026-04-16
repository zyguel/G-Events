import { sendEmail } from '@/lib/emailProvider';
import { escapeHtml } from '@/lib/security';

type AccessChangeReason = 'role' | 'permissions' | 'role-and-permissions';

interface BaseManagementEmailParams {
    to: string;
    recipientName: string;
    organizationName: string;
    roleName: string;
    permissionNames: string[];
}

interface AccessChangedEmailParams extends BaseManagementEmailParams {
    reason: AccessChangeReason;
    changeSummary?: string;
}

interface RemovalEmailParams extends BaseManagementEmailParams {
    changeSummary?: string;
}

function formatPermissionsList(permissionNames: string[]): string {
    if (permissionNames.length === 0) {
        return '<li>No permissions are currently assigned.</li>';
    }

    return permissionNames
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .map((permission) => `<li>${escapeHtml(permission)}</li>`)
        .join('');
}

function buildEmailShell(content: string): string {
    return `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 24px; color: #111827;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe3ef; border-radius: 10px; overflow: hidden;">
                <tr>
                    <td style="background: #1f3b77; color: #ffffff; padding: 20px 24px; font-size: 20px; font-weight: 700;">
                        G Events Admin Notification
                    </td>
                </tr>
                <tr>
                    <td style="padding: 24px; line-height: 1.6; font-size: 15px;">
                        ${content}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 0 24px 24px 24px; color: #4b5563; font-size: 13px;">
                        This is an automated message from G Events. If you have questions, please contact your organization administrator.
                    </td>
                </tr>
            </table>
        </div>
    `;
}

function buildAccessSnapshotSection(params: BaseManagementEmailParams): string {
    const safeOrgName = escapeHtml(params.organizationName);
    const safeRoleName = escapeHtml(params.roleName);

    return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 16px 0;">
            <tr>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 180px; background: #f9fafb;">Organization</td>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${safeOrgName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 180px; background: #f9fafb;">Role</td>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${safeRoleName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb; font-weight: 600; width: 180px; background: #f9fafb; vertical-align: top;">Current Permissions</td>
                <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">
                    <ul style="margin: 0; padding-left: 20px;">
                        ${formatPermissionsList(params.permissionNames)}
                    </ul>
                </td>
            </tr>
        </table>
    `;
}

function buildAccessChangedSubject(reason: AccessChangeReason): string {
    if (reason === 'permissions') {
        return 'Your G Events permissions have been updated';
    }

    if (reason === 'role') {
        return 'Your G Events role has been updated';
    }

    return 'Your G Events access has been updated';
}

export async function sendManagementInvitationEmail(params: BaseManagementEmailParams): Promise<void> {
    const safeRecipientName = escapeHtml(params.recipientName || 'there');
    const safeOrganizationName = escapeHtml(params.organizationName);

    const html = buildEmailShell(`
        <p>Hello ${safeRecipientName},</p>
        <p>
            You have been invited to join <strong>${safeOrganizationName}</strong> in G Events.
            Your administrator has granted the access shown below.
        </p>
        ${buildAccessSnapshotSection(params)}
        <p>
            Please sign in to your G Events account with this email address to get started.
        </p>
        <p>Best regards,<br />G Events Team</p>
    `);

    await sendEmail({
        to: params.to,
        subject: `Invitation to ${params.organizationName} on G Events`,
        html,
    });
}

export async function sendManagementAccessChangedEmail(
    params: AccessChangedEmailParams
): Promise<void> {
    const safeRecipientName = escapeHtml(params.recipientName || 'there');
    const safeSummary = params.changeSummary ? escapeHtml(params.changeSummary) : '';

    const summarySection = safeSummary
        ? `<p><strong>What changed:</strong> ${safeSummary}</p>`
        : '';

    const html = buildEmailShell(`
        <p>Hello ${safeRecipientName},</p>
        <p>
            This is a confirmation that your organization access in G Events has been updated by an administrator.
        </p>
        ${summarySection}
        ${buildAccessSnapshotSection(params)}
        <p>If you were not expecting this change, please contact your organization administrator.</p>
        <p>Best regards,<br />G Events Team</p>
    `);

    await sendEmail({
        to: params.to,
        subject: buildAccessChangedSubject(params.reason),
        html,
    });
}

export async function sendManagementRemovalEmail(params: RemovalEmailParams): Promise<void> {
    const safeRecipientName = escapeHtml(params.recipientName || 'there');
    const safeSummary = params.changeSummary ? escapeHtml(params.changeSummary) : '';

    const summarySection = safeSummary
        ? `<p><strong>What changed:</strong> ${safeSummary}</p>`
        : '';

    const html = buildEmailShell(`
        <p>Hello ${safeRecipientName},</p>
        <p>
            This is a confirmation that your access to this organization in G Events has been removed by an administrator.
        </p>
        ${summarySection}
        ${buildAccessSnapshotSection(params)}
        <p>
            If you believe this was made in error, please contact your organization administrator.
        </p>
        <p>Best regards,<br />G Events Team</p>
    `);

    await sendEmail({
        to: params.to,
        subject: 'Your G Events organization access was removed',
        html,
    });
}
