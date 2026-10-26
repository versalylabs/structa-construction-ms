import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UsersClient } from "./UsersClient";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const ctx = await getSessionContext();
  const params = await searchParams;

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const users = await prisma.user.findMany({
    where: {
      organizationId: ctx.organization.id,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AuthenticatedLayout>
      <UsersClient
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={ctx.user.id}
        canManageUsers={ctx.can("users:manage")}
        organizationName={ctx.organization.name}
        organizationCode={ctx.organization.code}
        initialSearch={params.q || ""}
        initialRoleFilter={params.role || "ALL"}
      />
    </AuthenticatedLayout>
  );
}
