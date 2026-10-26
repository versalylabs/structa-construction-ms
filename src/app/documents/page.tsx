import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentsClient } from "./DocumentsClient";

export default async function DocumentsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [documents, projects, pendingApprovalsCount, portalUpdatesCount] =
    await Promise.all([
      prisma.projectDocument.findMany({
        where: { organizationId: ctx.organization.id },
        include: {
          project: { select: { id: true, code: true, name: true } },
          client: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true, role: true } },
          approvalWorkflows: {
            select: {
              id: true,
              approvalCode: true,
              status: true,
              digitalSignatureRef: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ documentNumber: "asc" }, { createdAt: "desc" }],
      }),
      prisma.project.findMany({
        where: { organizationId: ctx.organization.id },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
      prisma.approvalWorkflowItem.count({
        where: { organizationId: ctx.organization.id, status: "PENDING" },
      }),
      prisma.clientPortalUpdate.count({
        where: { organizationId: ctx.organization.id },
      }),
    ]);

  return (
    <AuthenticatedLayout>
      <DocumentsClient
        documents={documents.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        }))}
        projects={projects}
        pendingApprovalsCount={pendingApprovalsCount}
        portalUpdatesCount={portalUpdatesCount}
        canManageDocs={
          ctx.can("documents:manage") || ctx.can("projects:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
