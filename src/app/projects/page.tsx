import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string; q?: string }>;
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

  const orgId = ctx.organization.id;

  const [projects, clients, users] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        client: { select: { id: true, name: true, code: true } },
        projectManager: { select: { id: true, name: true, role: true } },
        siteManager: { select: { id: true, name: true, role: true } },
        quantitySurveyor: { select: { id: true, name: true, role: true } },
        _count: {
          select: {
            phases: true,
            sites: true,
            teamMembers: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({
      where: { organizationId: orgId },
      include: {
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            contractValue: true,
            paidAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: { id: true, name: true, role: true, jobTitle: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <ProjectsClient
        projects={projects.map((p) => ({
          ...p,
          startDate: p.startDate.toISOString(),
          expectedCompletionDate: p.expectedCompletionDate.toISOString(),
          actualCompletionDate: p.actualCompletionDate
            ? p.actualCompletionDate.toISOString()
            : null,
        }))}
        clients={clients}
        users={users}
        currency={ctx.organization.currency}
        projectPrefix={ctx.organization.projectPrefix}
        canManageProjects={ctx.can("projects:manage")}
        initialStatusFilter={params.status || "ALL"}
        initialTab={params.tab === "clients" ? "clients" : "projects"}
        initialSearch={params.q || ""}
      />
    </AuthenticatedLayout>
  );
}
