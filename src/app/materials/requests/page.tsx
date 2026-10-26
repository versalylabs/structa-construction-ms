import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialRequestsClient } from "./MaterialRequestsClient";

export default async function MaterialRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
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

  const [requests, projects, materials, suppliers] = await Promise.all([
    prisma.materialRequest.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            standardUnitCost: true,
            preferredSupplierId: true,
          },
        },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
    prisma.material.findMany({
      where: { organizationId: ctx.organization.id, status: "ACTIVE" },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
        standardUnitCost: true,
        preferredSupplierId: true,
      },
      orderBy: { code: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId: ctx.organization.id, status: "ACTIVE" },
      select: {
        id: true,
        code: true,
        name: true,
        paymentTerms: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <MaterialRequestsClient
        requests={requests.map((r) => ({
          ...r,
          requiredByDate: r.requiredByDate.toISOString(),
          approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
        }))}
        projects={projects}
        materials={materials}
        suppliers={suppliers}
        initialProjectId={resolvedParams.projectId || "ALL"}
        initialStatus={resolvedParams.status || "ALL"}
        currency={ctx.organization.currency}
        defaultVatRate={ctx.organization.vatRate}
        canRequest={
          ctx.can("materials:request") ||
          ctx.can("materials:manage") ||
          ctx.can("procurement:manage") ||
          ctx.can("projects:manage")
        }
        canApprove={
          ctx.can("materials:approve") ||
          ctx.can("procurement:manage") ||
          ctx.can("projects:manage")
        }
        canProcure={
          ctx.can("procurement:manage") || ctx.can("projects:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
