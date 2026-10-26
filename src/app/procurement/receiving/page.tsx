import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialReceivingClient } from "./MaterialReceivingClient";

export default async function MaterialReceivingPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
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

  const [grns, openPurchaseOrders, projects] = await Promise.all([
    prisma.goodsReceivedNote.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            orderedQuantity: true,
            receivedQuantity: true,
            status: true,
          },
        },
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
          },
        },
        receivedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { deliveryDate: "desc" },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        organizationId: ctx.organization.id,
        status: { in: ["ISSUED", "APPROVED", "PARTIALLY_DELIVERED"] },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
          },
        },
      },
      orderBy: { expectedDeliveryDate: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <MaterialReceivingClient
        grns={grns.map((g) => ({
          ...g,
          deliveryDate: g.deliveryDate.toISOString(),
          createdAt: g.createdAt.toISOString(),
        }))}
        openPurchaseOrders={openPurchaseOrders.map((po) => ({
          ...po,
          expectedDeliveryDate: po.expectedDeliveryDate.toISOString(),
        }))}
        projects={projects}
        initialProjectId={resolvedParams.projectId || "ALL"}
        currency={ctx.organization.currency}
        canReceive={
          ctx.can("materials:receive") ||
          ctx.can("materials:manage") ||
          ctx.can("procurement:manage") ||
          ctx.can("projects:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
