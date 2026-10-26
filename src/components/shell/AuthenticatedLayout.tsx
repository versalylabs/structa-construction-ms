import React from "react";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, DemoUserOption } from "./AppShell";
import { ensureSeedData } from "../../../prisma/seed";

export async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureSeedData();
  const ctx = await getSessionContext();

  if (!ctx) {
    redirect("/login");
  }

  const [unreadCount, allActiveUsers] = await Promise.all([
    prisma.notification.count({
      where: {
        organizationId: ctx.organization.id,
        isRead: "FALSE",
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ organization: { name: "desc" } }, { createdAt: "asc" }],
    }),
  ]);

  const demoUsers: DemoUserOption[] = allActiveUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    jobTitle: u.jobTitle,
    organizationId: u.organization.id,
    organizationName: u.organization.name,
    organizationCode: u.organization.code,
  }));

  return (
    <AppShell
      user={ctx.user}
      organization={ctx.organization}
      permissions={ctx.permissions}
      unreadNotificationsCount={unreadCount}
      demoUsers={demoUsers}
    >
      {children}
    </AppShell>
  );
}
