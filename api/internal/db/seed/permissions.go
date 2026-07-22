package seed

import (
	"context"

	"veids/api/internal/db/sqlc"
)

// Permission keys. Fine-grained capabilities; roles bundle these.
const (
	PermSystemAccess         = "system.access"          // may access the admin system at all
	PermFacilityView         = "facility.view"          // view facility administration info
	PermFacilityManageRoster = "facility.manage_roster" // (future) manage a facility roster
	PermFacilityManageConfig = "facility.manage_config" // (future) edit facility configuration
)

// Role keys. Facility.* roles are synced from VATUSA staff positions;
// system.admin is intended for manual grants.
const (
	RoleATM      = "facility.atm"
	RoleDATM     = "facility.datm"
	RoleTA       = "facility.ta"
	RoleFE       = "facility.fe"
	RoleFACCBT   = "facility.faccbt"
	RoleSysAdmin = "system.admin"
)

type permissionDef struct{ key, name, desc string }
type roleDef struct{ key, name, desc string }

var permissions = []permissionDef{
	{PermSystemAccess, "System Access", "May access the vE-IDS administration system."},
	{PermFacilityView, "View Facility", "View facility administration information."},
	{PermFacilityManageRoster, "Manage Roster", "Manage a facility's controller roster (future)."},
	{PermFacilityManageConfig, "Manage Facility Config", "Edit a facility's configuration (future)."},
}

var roles = []roleDef{
	{RoleATM, "Air Traffic Manager", "Facility ATM."},
	{RoleDATM, "Deputy Air Traffic Manager", "Facility DATM."},
	{RoleTA, "Training Administrator", "Facility TA."},
	{RoleFE, "Facility Engineer", "Facility FE."},
	{RoleFACCBT, "FAA CBT / Instructor", "Facility FACCBT / instructor."},
	{RoleSysAdmin, "System Administrator", "Full access; intended for manual grants."},
}

// rolePermissions maps each role to the permissions it grants. Every access role
// includes system.access + facility.view; admins/training staff get more.
var rolePermissions = map[string][]string{
	RoleATM:      {PermSystemAccess, PermFacilityView, PermFacilityManageRoster, PermFacilityManageConfig},
	RoleDATM:     {PermSystemAccess, PermFacilityView, PermFacilityManageRoster, PermFacilityManageConfig},
	RoleTA:       {PermSystemAccess, PermFacilityView, PermFacilityManageConfig},
	RoleFE:       {PermSystemAccess, PermFacilityView},
	RoleFACCBT:   {PermSystemAccess, PermFacilityView},
	RoleSysAdmin: {PermSystemAccess, PermFacilityView, PermFacilityManageRoster, PermFacilityManageConfig},
}

// seedPermissions upserts the baseline permissions, roles, and their mappings.
func seedPermissions(ctx context.Context, q *sqlc.Queries) error {
	for _, p := range permissions {
		if err := q.UpsertPermission(ctx, sqlc.UpsertPermissionParams{Key: p.key, Name: p.name, Description: p.desc}); err != nil {
			return err
		}
	}
	for _, r := range roles {
		if err := q.UpsertRole(ctx, sqlc.UpsertRoleParams{Key: r.key, Name: r.name, Description: r.desc}); err != nil {
			return err
		}
	}
	for roleKey, perms := range rolePermissions {
		for _, permKey := range perms {
			if err := q.UpsertRolePermission(ctx, sqlc.UpsertRolePermissionParams{RoleKey: roleKey, PermissionKey: permKey}); err != nil {
				return err
			}
		}
	}
	return nil
}
