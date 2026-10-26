import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IssuesClient } from "./IssuesClient";

export const dynamic = "force-dynamic";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; severity?: string }>;
}) {
  const ctx = await getSessionContext();
  const resolvedParams = await searchParams;

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [issues, projects, users] = await Promise.all([
    prisma.projectIssue.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        reportedBy: { select: { id: true, name: true, role: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        sites: { select: { id: true, code: true, name: true } },
        phases: {
          select: { id: true, sequenceOrder: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: ctx.organization.id, status: "ACTIVE" },
      select: { id: true, name: true, role: true, jobTitle: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <IssuesClient
        issues={issues.map((i) => ({
          ...i,
          dueDate: i.dueDate.toISOString(),
          resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        }))}
        projects={projects}
        users={users}
        initialProjectFilter={resolvedParams?.projectId || "ALL"}
        initialSeverityFilter={resolvedParams?.severity || "ALL"}
        canManageIssues={
          ctx.can("site_reports:submit") ||
          ctx.can("projects:manage") ||
          ctx.can("planning:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
