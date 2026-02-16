// PASTE THIS IN BROWSER CONSOLE (F12) ON THE MANAGEMENT PAGE
// This will simulate clicking "Edit Permissions" and show exactly what's happening

console.clear();
console.log('🔍 DEBUGGING PERMISSION CHECKBOXES\n');

async function debugPermissionLoading() {
    console.log('\nStep 1: Fetching roles...');
    const rolesResp = await fetch('/backend/management/roles');
    const roleList = await rolesResp.json();
    console.log('✅ Roles List Response:', roleList);
    console.log('   Total roles:', roleList.data?.length);

    console.log('\nStep 2: Fetching all permissions...');
    const permResp = await fetch('/backend/management/permissions');
    const permData = await permResp.json();
    console.log('✅ Permissions API Response:', permData);
    console.log('   Total permissions:', permData.data?.length);

    if (!permData.success) {
        console.error('❌ Permissions API failed:', permData.error);
        return;
    }

    console.log('\nStep 3: Mapping permission IDs to names...');
    const rolePermissionNames = permData.data
        .filter(perm => roleData.data.permissionIds.includes(perm.id))
        .map(perm => perm.name);

    console.log('✅ Permission IDs:', roleData.data.permissionIds);
    console.log('✅ Permission Names:', rolePermissionNames);
    console.log('   Count:', rolePermissionNames.length);

    console.log('\nStep 4: Creating permissions object...');
    const hasPermission = (permName) => rolePermissionNames.includes(permName);

    const updatedPermissions = {
        eventCreation: {
            selectAll: false,
            createEvent: hasPermission('Create event'),
            editEventDetails: hasPermission('Edit event details'),
            manageEventStatus: hasPermission('Manage event status'),
            manageTickets: hasPermission('Manage tickets'),
            manageEventAgenda: hasPermission('Manage event agenda'),
        },
        orderRegistration: {
            selectAll: false,
            addAttendee: hasPermission('Add attendee'),
            editAttendeeDetails: hasPermission('Edit attendee details'),
            cancelAttendeeRegistration: hasPermission('Cancel attendee registration'),
        }
    };

    console.log('✅ Permissions Object (sample):', updatedPermissions);

    console.log('\n📊 SUMMARY:');
    console.log('================================');

    const trueCount = JSON.stringify(updatedPermissions).split('true').length - 1;
    console.log(`${trueCount} checkboxes should be checked`);

    console.log('\nSample permission checks:');
    console.log('  "Create event":', hasPermission('Create event') ? '✅' : '❌');
    console.log('  "Edit event details":', hasPermission('Edit event details') ? '✅' : '❌');
    console.log('  "Manage waitlist":', hasPermission('Manage waitlist') ? '✅' : '❌');

    console.log('\n🎯 ALL PERMISSIONS FROM DATABASE:');
    console.table(permData.data.slice(0, 10));

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Now click "Edit Permissions" on a role in the UI');
    console.log('2. Open React DevTools (F12 → Components tab)');
    console.log('3. Select the ManagementPage component');
    console.log('4. Check the "permissions" state - does it match the object above?');
    console.log('5. If it doesn\'t match, the setPermissions() call isn\'t working');

    return { roleData, permData, rolePermissionNames, updatedPermissions };
}

debugPermissionLoading().then(result => {
    window.debugResult = result;
    console.log('\n✅ Debug complete! Results saved to window.debugResult');
});
