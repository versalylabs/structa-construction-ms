import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_ROLE_PERMISSIONS, PermissionKey, UserRole } from "@/lib/rbac";
import { RolesClient } from "./RolesClient";

export default async function RolesPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const storedRolePerms = await prisma.rolePermission.findMany({
    where: { organizationId: ctx.organization.id },
  });

  const rolePermMap: Record<string, PermissionKey[]> = {
    ...DEFAULT_ROLE_PERMISSIONS,
  };

  for (const rp of storedRolePerms) {
    try {
      rolePermMap[rp.role as UserRole] = JSON.parse(rp.permissionsJson);
    } catch {
      // Fallback to default
    }
  }

  return (
    <AuthenticatedLayout>
      <RolesClient
        rolePermissionsMap={rolePermMap}
        canManageRoles={ctx.can("users:manage") || ctx.can("settings:manage")}
        organizationName={ctx.organization.name}
      />
    </AuthenticatedLayout>
  );
}
