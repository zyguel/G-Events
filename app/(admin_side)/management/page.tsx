"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import Image from 'next/image';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLocale } from '@/contexts/LocaleContext';
import AccessDenied from '@/components/admin/AccessDenied';

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
    roleId: number;
    avatar?: string;
}

interface Role {
    id: number;
    name: string;
}

// Thin guard wrapper — keeps all useState/useEffect hooks inside ManagementPageInner
// to avoid React Rules of Hooks violations from conditional returns
export default function ManagementPage() {
    const { t } = useLocale();
    const { isAdmin, loading } = usePermissions();
    if (loading) return null;
    if (!isAdmin) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar activePage="management" />
                    <main className="flex-1 ml-20 overflow-y-auto">
                        <AccessDenied message={t('Only administrators can access the Management page.')} />
                    </main>
                </div>
            </div>
        );
    }
    return <ManagementPageInner />;
}

function ManagementPageInner() {
    const { t } = useLocale();
    // Toast notifications
    const { toasts, showToast, removeToast } = useToast();

    // Loading states
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);

    // Data state
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'Team' | 'Role'>('Team');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // Invite User Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setInviteName('');
        setInviteEmail('');
        setSelectedRole('');
        setIsRoleDropdownOpen(false);
    };

    const [editable, setEditable] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [openPermissionCategory, setOpenPermissionCategory] = useState<string | null>(null);

    // Fetch users and roles on mount
    useEffect(() => {
        async function fetchUsers() {
            try {
                setIsLoadingUsers(true);
                const response = await fetch('/api/management/users');
                const result = await response.json();

                if (result.success) {
                    setMembers(result.data);
                } else {
                    showToast(result.error || 'Failed to fetch users', 'error');
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                showToast('Failed to load users. Please refresh the page.', 'error');
            } finally {
                setIsLoadingUsers(false);
            }
        }

        async function fetchRoles() {
            try {
                setIsLoadingRoles(true);
                const response = await fetch('/api/management/roles');
                const result = await response.json();

                if (result.success) {
                    setRoles(result.data);
                } else {
                    showToast(result.error || 'Failed to fetch roles', 'error');
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                showToast('Failed to load roles. Please refresh the page.', 'error');
            } finally {
                setIsLoadingRoles(false);
            }
        }

        fetchUsers();
        fetchRoles();
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        setSelectedRole('');
        setIsRoleDropdownOpen(false);
    };

    const handleAddUser = async () => {
        if (inviteName && inviteEmail && selectedRole) {
            try {
                const selectedRoleObj = roles.find(r => r.name === selectedRole);
                if (!selectedRoleObj) {
                    showToast('Invalid role selected', 'error');
                    return;
                }

                const response = await fetch('/api/management/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: inviteName,
                        email: inviteEmail,
                        roleId: selectedRoleObj.id,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    setMembers([...members, result.data]);
                    showToast('User invited successfully!', 'success');
                    handleCloseModal();
                } else {
                    showToast(result.error || 'Failed to invite user', 'error');
                }
            } catch (error) {
                console.error('Error inviting user:', error);
                showToast('Failed to invite user. Please try again.', 'error');
            }
        }
    };

    const handleSelectRole = (role: string) => {
        setSelectedRole(role);
        setIsRoleDropdownOpen(false);
    };

    // Edit User Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState<string>('Core Member');
    const [isEditRoleDropdownOpen, setIsEditRoleDropdownOpen] = useState(false);

    const handleOpenEditModal = (member: TeamMember) => {
        setEditingMember(member);
        setEditEmail(member.email);
        setEditRole(member.role);
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingMember(null);
        setEditEmail('');
        setEditRole('Core Member');
        setIsEditRoleDropdownOpen(false);
    };

    const handleSaveEdit = async () => {
        if (editingMember && editEmail) {
            try {
                const selectedRoleObj = roles.find(r => r.name === editRole);
                if (!selectedRoleObj) {
                    showToast('Invalid role selected', 'error');
                    return;
                }

                const response = await fetch(`/api/management/users/${editingMember.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: editEmail,
                        roleId: selectedRoleObj.id,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    setMembers(members.map(member =>
                        member.id === editingMember.id
                            ? { ...member, email: editEmail, role: editRole, roleId: selectedRoleObj.id }
                            : member
                    ));
                    showToast('User updated successfully!', 'success');
                    handleCloseEditModal();
                } else {
                    showToast(result.error || 'Failed to update user', 'error');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showToast('Failed to update user. Please try again.', 'error');
            }
        }
    };

    // Remove Confirmation Modal State
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const handleRemoveUser = () => {
        // Show confirmation modal instead of removing directly
        setIsRemoveModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (editingMember) {
            try {
                const response = await fetch(`/api/management/users/${editingMember.id}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    setMembers(members.filter(member => member.id !== editingMember.id));
                    showToast('User removed successfully!', 'success');
                    setIsRemoveModalOpen(false);
                    handleCloseEditModal();
                } else {
                    showToast(result.error || 'Failed to remove user', 'error');
                }
            } catch (error) {
                console.error('Error removing user:', error);
                showToast('Failed to remove user. Please try again.', 'error');
            }
        }
    };

    const handleCancelRemove = () => {
        setIsRemoveModalOpen(false);
    };

    const handleSelectEditRole = (role: string) => {
        setEditRole(role);
        setIsEditRoleDropdownOpen(false);
    };

    // Create Role Panel State
    const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [expandedSections, setExpandedSections] = useState<string[]>(['eventCreation']);

    // Permissions state
    const [permissions, setPermissions] = useState({
        eventCreation: {
            selectAll: false,
            createEvent: false,
            editEventDetails: false,
            manageEventStatus: false,
            manageTickets: false,
            manageEventAgenda: false,
        },
        orderRegistration: {
            selectAll: false,
            addAttendee: false,
            editAttendeeDetails: false,
            cancelAttendeeRegistration: false,
            viewListOfAttendees: false,
            checkInAttendees: false,
            applyDiscountsAndPromoCodes: false,
            manageTicketAddOns: false,
            sendEmails: false,
            manageTicketAddOns2: false,
        },
        breakoutSession: {
            selectAll: false,
            createBreakoutSessions: false,
            editBreakoutSessions: false,
            manageBreakoutSessionAttendance: false,
        },
        waitlistManagement: {
            selectAll: false,
            manageWaitlist: false,
            viewWaitlistQueue: false,
        },
        eCertificate: {
            selectAll: false,
            manageCertificateIssuance: false,
            viewECertificates: false,
        },
        reporting: {
            selectAll: false,
            viewReports: false,
            exportOrderReport: false,
        },
        emailsUserCanReceive: {
            selectAll: false,
            newRegistrantEmail: false,
            waitlistEmail: false,
            newMessageOrInquiryFromAttendee: false,
        },
    });

    const handleOpenCreateRole = () => {
        setIsCreateRoleOpen(true);
        setNewRoleName('');
        setEditingRole(null);
        // Reset permissions
        setSelectedPermissions([]);
    };

    const handleCloseCreateRole = () => {
        setIsCreateRoleOpen(false);
        setEditingRole(null);
        setSelectedPermissions([]);
    };

    const handleSaveRole = async () => {
        if (newRoleName.trim()) {
            try {
                // Mapping from UI state keys to database permission names
                const PERMISSION_MAP: Record<string, Record<string, string>> = {
                    eventCreation: {
                        createEvent: 'Create Event',
                        editEventDetails: 'Edit Event Details',
                        manageEventStatus: 'Manage Event Status',
                        manageTickets: 'Manage Tickets',
                        manageEventAgenda: 'Manage Event Agenda',
                    },
                    orderRegistration: {
                        addAttendee: 'Add Attendee',
                        editAttendeeDetails: 'Edit Attendee Details',
                        cancelAttendeeRegistration: 'Cancel Attendee Registration',
                        viewListOfAttendees: 'View List of Attendees',
                        checkInAttendees: 'Check In Attendees',
                        applyDiscountsAndPromoCodes: 'Apply Discounts and Promo Codes',
                        manageTicketAddOns: 'Manage Ticket Add-Ons',
                        sendEmails: 'Send Emails',
                    },
                    breakoutSession: {
                        createBreakoutSessions: 'Create Breakout Sessions',
                        editBreakoutSessions: 'Edit Breakout Sessions',
                        manageBreakoutSessionAttendance: 'Manage Breakout Session Attendance',
                    },
                    waitlistManagement: {
                        manageWaitlist: 'Manage Waitlist',
                        viewWaitlistQueue: 'View Waitlist Queue',
                    },
                    eCertificate: {
                        manageCertificateIssuance: 'Manage Certificate Issuance',
                        viewECertificates: 'View E-Certificates',
                    },
                    reporting: {
                        viewReports: 'View Reports',
                        exportOrderReport: 'Export Order Report',
                    },
                    emailsUserCanReceive: {
                        newRegistrantEmail: 'New Registrant Email',
                        waitlistEmail: 'Waitlist Email',
                        newMessageOrInquiryFromAttendee: 'New Message or Inquiry From Attendee',
                    }
                };

                const currentSelectedPermissions: string[] = [];
                Object.entries(permissions).forEach(([category, perms]) => {
                    const mapping = PERMISSION_MAP[category];
                    if (mapping) {
                        Object.entries(perms).forEach(([key, value]) => {
                            if (value && mapping[key]) {
                                currentSelectedPermissions.push(mapping[key]);
                            }
                        });
                    }
                });

                // Fetch all permissions to convert names to IDs
                const permResponse = await fetch('/api/management/permissions');
                const permResult = await permResponse.json();

                let permissionIds: number[] = [];
                if (permResult.success) {
                    const allPermissions = permResult.data;
                    // Convert selected permission names to IDs
                    permissionIds = allPermissions
                        .filter((perm: any) => currentSelectedPermissions.includes(perm.name))
                        .map((perm: any) => perm.id);
                }

                if (editingRole) {
                    // Update existing role
                    const response = await fetch(`/api/management/roles/${editingRole.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: newRoleName.trim(),
                            description: '',
                            permissionIds,
                        }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        setRoles(roles.map(r =>
                            r.id === editingRole.id
                                ? { ...r, name: newRoleName.trim() }
                                : r
                        ));
                        showToast('Role updated successfully!', 'success');
                    } else {
                        showToast(result.error || 'Failed to update role', 'error');
                    }
                } else {
                    // Create new role
                    const response = await fetch('/api/management/roles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: newRoleName.trim(),
                            description: '',
                            permissionIds,
                        }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        setRoles([...roles, result.data]);
                        showToast('Role created successfully!', 'success');
                    } else {
                        showToast(result.error || 'Failed to create role', 'error');
                    }
                }
                setIsCreateRoleOpen(false);
                setEditingRole(null);
                setSelectedPermissions([]);
            } catch (error) {
                console.error('Error saving role:', error);
                showToast('Failed to save role. Please try again.', 'error');
            }
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const handlePermissionChange = (category: string, permission: string, value: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                [permission]: value,
            },
        }));
    };

    const handleSelectAll = (category: string, value: boolean) => {
        const categoryPermissions = permissions[category as keyof typeof permissions];
        const updatedCategory: Record<string, boolean> = {};
        Object.keys(categoryPermissions).forEach(key => {
            updatedCategory[key] = value;
        });
        setPermissions(prev => ({
            ...prev,
            [category]: updatedCategory,
        }));
    };

    // Role Menu State
    const [openRoleMenuId, setOpenRoleMenuId] = useState<number | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
    const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const toggleRoleMenu = (roleId: number) => {
        setOpenRoleMenuId(openRoleMenuId === roleId ? null : roleId);
    };

    const handleEditRolePermissions = async (role: Role) => {
        try {
            // Fetch the role's current permissions
            const response = await fetch(`/api/management/roles/${role.id}`);
            const result = await response.json();

            if (result.success) {
                // Convert permission IDs to permission names for the checkboxes
                const permResponse = await fetch('/api/management/permissions');
                const permResult = await permResponse.json();

                if (permResult.success) {
                    const allPermissions = permResult.data;
                    // Map the permission IDs to permission names
                    const rolePermissionNames = allPermissions
                        .filter((perm: any) => result.data.permissionIds.includes(perm.id))
                        .map((perm: any) => perm.name);

                    setSelectedPermissions(rolePermissionNames);

                    // ALSO update the permissions object for the UI checkboxes
                    // Create a helper to check if a permission is included
                    const hasPermission = (permName: string) => rolePermissionNames.includes(permName);

                    // Map database permission names to the UI structure
                    const updatedPermissions = {
                        eventCreation: {
                            selectAll: false,
                            createEvent: hasPermission('Create Event'),
                            editEventDetails: hasPermission('Edit Event Details'),
                            manageEventStatus: hasPermission('Manage Event Status'),
                            manageTickets: hasPermission('Manage Tickets'),
                            manageEventAgenda: hasPermission('Manage Event Agenda'),
                        },
                        orderRegistration: {
                            selectAll: false,
                            addAttendee: hasPermission('Add Attendee'),
                            editAttendeeDetails: hasPermission('Edit Attendee Details'),
                            cancelAttendeeRegistration: hasPermission('Cancel Attendee Registration'),
                            viewListOfAttendees: hasPermission('View List of Attendees'),
                            checkInAttendees: hasPermission('Check In Attendees'),
                            applyDiscountsAndPromoCodes: hasPermission('Apply Discounts and Promo Codes'),
                            manageTicketAddOns: hasPermission('Manage Ticket Add-Ons'),
                            sendEmails: hasPermission('Send Emails'),
                            manageTicketAddOns2: false,
                        },
                        breakoutSession: {
                            selectAll: false,
                            createBreakoutSessions: hasPermission('Create Breakout Sessions'),
                            editBreakoutSessions: hasPermission('Edit Breakout Sessions'),
                            manageBreakoutSessionAttendance: hasPermission('Manage Breakout Session Attendance'),
                        },
                        waitlistManagement: {
                            selectAll: false,
                            manageWaitlist: hasPermission('Manage Waitlist'),
                            viewWaitlistQueue: hasPermission('View Waitlist Queue'),
                        },
                        eCertificate: {
                            selectAll: false,
                            manageCertificateIssuance: hasPermission('Manage Certificate Issuance'),
                            viewECertificates: hasPermission('View E-Certificates'),
                        },
                        reporting: {
                            selectAll: false,
                            viewReports: hasPermission('View Reports'),
                            exportOrderReport: hasPermission('Export Order Report'),
                        },
                        emailsUserCanReceive: {
                            selectAll: false,
                            newRegistrantEmail: hasPermission('New Registrant Email'),
                            waitlistEmail: hasPermission('Waitlist Email'),
                            newMessageOrInquiryFromAttendee: hasPermission('New Message or Inquiry From Attendee'),
                        },
                    };

                    setPermissions(updatedPermissions as any);
                }
            }

            setEditingRole(role);
            setNewRoleName(role.name);
            setOpenRoleMenuId(null);
            setIsCreateRoleOpen(true); // Reuse the create role panel for editing
        } catch (error) {
            console.error('Error loading role permissions:', error);
            showToast('Failed to load role permissions', 'error');
        }
    };

    const handleDeleteRoleClick = (role: Role) => {
        setRoleToDelete(role);
        setOpenRoleMenuId(null);
        setIsDeleteRoleModalOpen(true);
    };

    const handleConfirmDeleteRole = async () => {
        if (roleToDelete) {
            try {
                const response = await fetch(`/api/management/roles/${roleToDelete.id}`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    setRoles(roles.filter(r => r.id !== roleToDelete.id));
                    showToast('Role deleted successfully!', 'success');
                    setIsDeleteRoleModalOpen(false);
                    setRoleToDelete(null);
                } else {
                    showToast(result.error || 'Failed to delete role', 'error');
                }
            } catch (error) {
                console.error('Error deleting role:', error);
                showToast('Failed to delete role. Please try again.', 'error');
            }
        }
    };

    const handleCancelDeleteRole = () => {
        setIsDeleteRoleModalOpen(false);
        setRoleToDelete(null);
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMenu = (id: number) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    return (
        <div className="min-h-screen h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans overflow-hidden transition-colors">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="management" />

                <main className="flex-1 ml-20 p-4 md:p-8 overflow-y-auto scrollbar-hide">
                    <div className="space-y-6 max-w-7xl mx-auto">
                        {/* Page Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Management')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('Manage your team members and roles')}</p>
                        </div>

                        {/* Filters and Search Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Search */}
                                    <div className="relative flex-1 max-w-md">
                                        <Image
                                            src="/icons/search-interface-symbol.png"
                                            alt="Search"
                                            width={18}
                                            height={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 dark:invert"
                                        />
                                        <input
                                            type="text"
                                            placeholder={t('Search members or roles...')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* Filter Tabs */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setActiveFilter('Team')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeFilter === 'Team'
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <Image
                                                    src="/icons/user.png"
                                                    alt="Team"
                                                    width={16}
                                                    height={16}
                                                    className={`brightness-0 dark:invert ${activeFilter === 'Team' ? '' : 'opacity-60'}`}
                                                />
                                                {t('Team')}
                                            </button>
                                            <button
                                                onClick={() => setActiveFilter('Role')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeFilter === 'Role'
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <Image
                                                    src="/icons/list.png"
                                                    alt="Role"
                                                    width={16}
                                                    height={16}
                                                    className={`dark:invert ${activeFilter === 'Role' ? '' : 'opacity-60'}`}
                                                />
                                                {t('Roles')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={activeFilter === 'Team' ? handleOpenModal : handleOpenCreateRole}
                                        className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3D518C] text-white rounded-xl text-sm font-medium hover:bg-[#2d3d6b] transition-all shadow-sm md:ml-auto"
                                    >
                                        <Image
                                            src="/icons/add.png"
                                            alt="Add"
                                            width={16}
                                            height={16}
                                            className="brightness-0 invert"
                                        />
                                        {activeFilter === 'Team' ? t('Invite User') : t('Create Role')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content based on active filter */}
                        {activeFilter === 'Team' ? (
                            /* Team Members List */
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                                        >
                                            {/* Avatar and Name */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {member.avatar ? (
                                                        <Image
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            width={40}
                                                            height={40}
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white font-bold text-sm">{member.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Name')}</p>
                                                    <p className="text-sm font-medium text-[#3A3B49] dark:text-white">{member.name}</p>
                                                </div>
                                            </div>

                                            {/* Email Address */}
                                            <div className="w-full md:w-1/3 pl-14 md:pl-0">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Email Address')}</p>
                                                <p className="text-sm text-[#3A3B49] dark:text-gray-200 break-all">{member.email}</p>
                                            </div>

                                            {/* Role & Actions Container */}
                                            <div className="flex items-center justify-between w-full md:w-auto md:gap-8 pl-14 md:pl-0">
                                                {/* Role */}
                                                <div className="md:w-32">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Role')}</p>
                                                    <p className="text-sm font-medium text-[#3A3B49] dark:text-white">{member.role}</p>
                                                </div>

                                                {/* Action Menu */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => handleOpenEditModal(member)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <Image
                                                            src="/icons/dots.png"
                                                            alt="Menu"
                                                            width={20}
                                                            height={20}
                                                            className="opacity-60 dark:invert"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Roles List */
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredRoles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                                        >
                                            {/* Role Icon and Name */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                                                    {role.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</p>
                                            </div>

                                            {/* Action Menu - only for non-Admin roles */}
                                            {role.name !== 'Admin' && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => toggleRoleMenu(role.id)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <Image
                                                            src="/icons/dots.png"
                                                            alt="Menu"
                                                            width={20}
                                                            height={20}
                                                            className="opacity-60 dark:invert"
                                                        />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openRoleMenuId === role.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 w-48">
                                                            <button
                                                                onClick={() => handleEditRolePermissions(role)}
                                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                                                            >
                                                                {t('Edit Permissions')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoleClick(role)}
                                                                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg"
                                                            >
                                                                {t('Delete Role')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div >

            {/* Invite User Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[480px]">
                            {/* Modern Header */}
                            <div className="bg-gradient-to-r from-[#3D518C] to-indigo-600 px-8 py-6 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white">{t('Invite Team Member')}</h2>
                                <p className="text-indigo-200 text-sm mt-1">{t('Add a new member to your team')}</p>
                            </div>

                            <div className="p-8">
                                {/* Name Input */}
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Full Name')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('Enter full name...')}
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Email Input */}
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Email Address')}</label>
                                    <input
                                        type="email"
                                        placeholder={t('Enter email address...')}
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Role Dropdown */}
                                <div className="mb-6 relative">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Assign Role')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:bg-gray-700"
                                    >
                                        <span className={selectedRole ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                                            {selectedRole || t('Select a role...')}
                                        </span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Options */}
                                    {isRoleDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-10 overflow-hidden">
                                            <div className="max-h-60 overflow-y-auto">
                                                {roles.map((role) => (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => handleSelectRole(role.name)}
                                                        className="w-full px-4 py-3.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {role.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{role.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {role.name === 'Admin' ? t('Full system access') :
                                                                    role.name === 'Volunteer' ? t('Limited access for volunteers') :
                                                                        t('Full access to team features')}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button
                                        onClick={handleAddUser}
                                        className="px-8 py-3 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-[#2d3d6b] hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                                    >
                                        {t('Send Invite')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                isEditModalOpen && editingMember && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-[450px]">
                            {/* Modal Title */}
                            <h2 className="text-lg text-gray-600 dark:text-gray-300 mb-6">{t('Edit User')}</h2>

                            {/* Email Input */}
                            <div className="mb-4">
                                <input
                                    type="email"
                                    placeholder={t('E-mail')}
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-white dark:bg-gray-700 outline-none focus:border-[#3D518C] dark:focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Role Dropdown */}
                            <div className="mb-4 relative">
                                <button
                                    type="button"
                                    onClick={() => setIsEditRoleDropdownOpen(!isEditRoleDropdownOpen)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between outline-none focus:border-[#3D518C] dark:focus:border-indigo-500 transition-colors dark:bg-gray-700"
                                >
                                    <span className="text-gray-700 dark:text-white">
                                        {editRole}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isEditRoleDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Options */}
                                {isEditRoleDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto">
                                            {roles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => handleSelectEditRole(role.name)}
                                                    className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-0 flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                                        {role.name.charAt(0)}
                                                    </div>
                                                    {role.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remove User Link */}
                            <button
                                onClick={handleRemoveUser}
                                className="text-[#F87171] text-sm underline hover:text-red-600 transition-colors mb-6"
                            >
                                {t('Remove User')}
                            </button>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-4 mt-8">
                                <button
                                    onClick={handleCloseEditModal}
                                    className="px-8 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-10 py-2.5 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-[#2d3d6b] hover:to-indigo-700 transition-colors shadow-md"
                                >
                                    {t('Save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Remove User Confirmation Modal */}
            {
                isRemoveModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl px-12 py-8 text-center w-full max-w-md">
                            {/* Confirmation Text */}
                            <p className="text-gray-500 dark:text-gray-300 text-lg mb-8">{t('Remove User?')}</p>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleCancelRemove}
                                    className="px-8 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmRemove}
                                    className="px-10 py-2.5 bg-[#F87171] text-white text-sm font-medium rounded-lg hover:bg-[#EF4444] transition-colors shadow-md"
                                >
                                    {t('Remove')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create Role Panel */}
            {
                isCreateRoleOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8 px-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col">
                            {/* Modern Header */}
                            <div className="bg-gradient-to-r from-[#3D518C] to-indigo-600 rounded-t-2xl px-8 py-6">
                                <h2 className="text-xl font-bold text-white">{editingRole ? t('Edit Role') : t('Create New Role')}</h2>
                                <p className="text-indigo-200 text-sm mt-1">{t('Configure role permissions and access levels')}</p>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                                {/* Role Information Card */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6 border border-gray-100 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        {t('Role Information')}
                                    </h3>
                                    <input
                                        type="text"
                                        placeholder={t('Enter role name...')}
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Permissions Section */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        {t('Permissions')}
                                    </h3>
                                </div>

                                {/* Event Creation */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('eventCreation')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">Event Creation</span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('eventCreation') ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('eventCreation') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.selectAll} onChange={(e) => handleSelectAll('eventCreation', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.createEvent} onChange={(e) => handlePermissionChange('eventCreation', 'createEvent', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Create event</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.editEventDetails} onChange={(e) => handlePermissionChange('eventCreation', 'editEventDetails', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Edit event details</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.manageEventStatus} onChange={(e) => handlePermissionChange('eventCreation', 'manageEventStatus', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage event status</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.manageTickets} onChange={(e) => handlePermissionChange('eventCreation', 'manageTickets', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage tickets</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eventCreation.manageEventAgenda} onChange={(e) => handlePermissionChange('eventCreation', 'manageEventAgenda', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage event agenda</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Order & Registration Management */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('orderRegistration')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">Order & Registration Management</span>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('orderRegistration') ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('orderRegistration') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.selectAll} onChange={(e) => handleSelectAll('orderRegistration', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.addAttendee} onChange={(e) => handlePermissionChange('orderRegistration', 'addAttendee', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Add attendee</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.editAttendeeDetails} onChange={(e) => handlePermissionChange('orderRegistration', 'editAttendeeDetails', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Edit attendee details</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.cancelAttendeeRegistration} onChange={(e) => handlePermissionChange('orderRegistration', 'cancelAttendeeRegistration', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Cancel attendee registration</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.viewListOfAttendees} onChange={(e) => handlePermissionChange('orderRegistration', 'viewListOfAttendees', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">View list of attendees</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.checkInAttendees} onChange={(e) => handlePermissionChange('orderRegistration', 'checkInAttendees', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Check-in attendees</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.applyDiscountsAndPromoCodes} onChange={(e) => handlePermissionChange('orderRegistration', 'applyDiscountsAndPromoCodes', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Apply Discounts and Promo Codes</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.manageTicketAddOns} onChange={(e) => handlePermissionChange('orderRegistration', 'manageTicketAddOns', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage Ticket Add-ons</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.orderRegistration.sendEmails} onChange={(e) => handlePermissionChange('orderRegistration', 'sendEmails', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Send e-mails</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Breakout Session Management */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('breakoutSession')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">Breakout Session Management</span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('breakoutSession') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('breakoutSession') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.breakoutSession.selectAll} onChange={(e) => handleSelectAll('breakoutSession', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.breakoutSession.createBreakoutSessions} onChange={(e) => handlePermissionChange('breakoutSession', 'createBreakoutSessions', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Create Breakout Sessions</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.breakoutSession.editBreakoutSessions} onChange={(e) => handlePermissionChange('breakoutSession', 'editBreakoutSessions', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Edit Breakout Sessions</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.breakoutSession.manageBreakoutSessionAttendance} onChange={(e) => handlePermissionChange('breakoutSession', 'manageBreakoutSessionAttendance', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage Breakout Session Attendance</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Waitlist Management */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('waitlistManagement')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">Waitlist Management</span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('waitlistManagement') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('waitlistManagement') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.waitlistManagement.selectAll} onChange={(e) => handleSelectAll('waitlistManagement', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.waitlistManagement.manageWaitlist} onChange={(e) => handlePermissionChange('waitlistManagement', 'manageWaitlist', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage Waitlist</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.waitlistManagement.viewWaitlistQueue} onChange={(e) => handlePermissionChange('waitlistManagement', 'viewWaitlistQueue', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">View Waitlist Queue</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* E-Certificate Management */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('eCertificate')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">E-Certificate Management</span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('eCertificate') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('eCertificate') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eCertificate.selectAll} onChange={(e) => handleSelectAll('eCertificate', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eCertificate.manageCertificateIssuance} onChange={(e) => handlePermissionChange('eCertificate', 'manageCertificateIssuance', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Manage Certificate Issuance</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.eCertificate.viewECertificates} onChange={(e) => handlePermissionChange('eCertificate', 'viewECertificates', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">View E-Certificates</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Reporting */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('reporting')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">Reporting</span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('reporting') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('reporting') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.reporting.selectAll} onChange={(e) => handleSelectAll('reporting', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.reporting.viewReports} onChange={(e) => handlePermissionChange('reporting', 'viewReports', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">View Reports</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.reporting.exportOrderReport} onChange={(e) => handlePermissionChange('reporting', 'exportOrderReport', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Export Order Report</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* E-mails User can Receive */}
                                <div className="bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 mb-4 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('emailsUserCanReceive')}
                                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <span className="text-[#3D518C] dark:text-indigo-400 font-semibold">E-mails User can Receive</span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes('emailsUserCanReceive') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expandedSections.includes('emailsUserCanReceive') && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-600 pt-4">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.emailsUserCanReceive.selectAll} onChange={(e) => handleSelectAll('emailsUserCanReceive', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Select All</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.emailsUserCanReceive.newRegistrantEmail} onChange={(e) => handlePermissionChange('emailsUserCanReceive', 'newRegistrantEmail', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">New Registrant E-mail</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.emailsUserCanReceive.waitlistEmail} onChange={(e) => handlePermissionChange('emailsUserCanReceive', 'waitlistEmail', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Waitlist E-mail</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <input type="checkbox" checked={permissions.emailsUserCanReceive.newMessageOrInquiryFromAttendee} onChange={(e) => handlePermissionChange('emailsUserCanReceive', 'newMessageOrInquiryFromAttendee', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">New Message or Inquiry from Attendee</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Floating Action Buttons */}
                            <div className="sticky bottom-0 right-0 flex justify-end gap-4 p-6 bg-gradient-to-t from-white via-white to-white/95 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/95 border-t border-gray-100 dark:border-gray-700 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
                                <button
                                    onClick={handleCloseCreateRole}
                                    className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    onClick={handleSaveRole}
                                    className="px-10 py-3 bg-gradient-to-r from-[#3D518C] to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-[#2d3d6b] hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                                >
                                    {editingRole ? t('Update Role') : t('Create Role')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Role Confirmation Modal */}
            {
                isDeleteRoleModalOpen && roleToDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                        <div className="bg-white rounded-xl shadow-2xl px-12 py-8 text-center">
                            <p className="text-gray-500 text-lg mb-8">{t('Delete role confirmation').replace('{role}', roleToDelete.name)}</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleCancelDeleteRole}
                                    className="px-8 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmDeleteRole}
                                    className="px-10 py-2.5 bg-[#F87171] text-white text-sm font-medium rounded-lg hover:bg-[#EF4444] transition-colors shadow-md"
                                >
                                    {t('Delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
