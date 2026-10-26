import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApprovalsClient } from "./ApprovalsClient";

export default async function ApprovalsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [approvals, projects, documents, portalUpdatesCount] =
    await Promise.all([
      prisma.approvalWorkflowItem.findMany({
        where: { organizationId: ctx.organization.id },
        include: {
          project: { select: { id: true, code: true, name: true } },
          phase: { select: { id: true, name: true, sequenceOrder: true } },
          document: {
            select: {
              id: true,
              documentNumber: true,
              title: true,
              version: true,
              fileName: true,
            },
          },
          client: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, name: true, role: true } },
          decidedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      }),
      prisma.project.findMany({
        where: { organizationId: ctx.organization.id },
        select: {
          id: true,
          code: true,
          name: true,
          phases: {
            select: { id: true, name: true, sequenceOrder: true },
            orderBy: { sequenceOrder: "asc" },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.projectDocument.findMany({
        where: { organizationId: ctx.organization.id },
        select: {
          id: true,
          documentNumber: true,
          title: true,
          version: true,
          projectId: true,
        },
        orderBy: { documentNumber: "asc" },
      }),
      prisma.clientPortalUpdate.count({
        where: { organizationId: ctx.organization.id },
      }),
    ]);

  return (
    <AuthenticatedLayout>
      <ApprovalsClient
        approvals={approvals.map((a) => ({
          ...a,
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
          decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        }))}
        projects={projects}
        documents={documents}
        portalUpdatesCount={portalUpdatesCount}
        canApprove={
          ctx.can("documents:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("finance:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
