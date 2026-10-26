import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PurchaseOrdersClient } from "./PurchaseOrdersClient";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; supplierId?: string; po?: string }>;
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

  const [purchaseOrders, projects, suppliers, materials, approvedRequests] =
    await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { organizationId: ctx.organization.id },
        include: {
          project: { select: { id: true, code: true, name: true } },
          site: { select: { id: true, code: true, name: true } },
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
              contactPerson: true,
              phone: true,
              paymentTerms: true,
            },
          },
          material: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              unit: true,
            },
          },
          materialRequest: {
            select: {
              id: true,
              requestNumber: true,
              title: true,
            },
          },
          createdBy: { select: { id: true, name: true, role: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
          goodsReceivedNotes: {
            select: {
              id: true,
              grnNumber: true,
              receivedQuantity: true,
              damagedQuantity: true,
              deliveryDate: true,
              inspectionStatus: true,
            },
            orderBy: { deliveryDate: "desc" },
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
          outstandingBalance: true,
        },
        orderBy: { name: "asc" },
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
      prisma.materialRequest.findMany({
        where: {
          organizationId: ctx.organization.id,
          status: "APPROVED",
        },
        select: {
          id: true,
          requestNumber: true,
          title: true,
          projectId: true,
          siteId: true,
          materialId: true,
          approvedQuantity: true,
          estimatedUnitCost: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <AuthenticatedLayout>
      <PurchaseOrdersClient
        purchaseOrders={purchaseOrders.map((po) => ({
          ...po,
          expectedDeliveryDate: po.expectedDeliveryDate.toISOString(),
          approvedAt: po.approvedAt ? po.approvedAt.toISOString() : null,
          createdAt: po.createdAt.toISOString(),
          goodsReceivedNotes: po.goodsReceivedNotes.map((g) => ({
            ...g,
            deliveryDate: g.deliveryDate.toISOString(),
          })),
        }))}
        projects={projects}
        suppliers={suppliers}
        materials={materials}
        approvedRequests={approvedRequests}
        initialProjectId={resolvedParams.projectId || "ALL"}
        initialSupplierId={resolvedParams.supplierId || "ALL"}
        initialSearch={resolvedParams.po || ""}
        currency={ctx.organization.currency}
        defaultVatRate={ctx.organization.vatRate}
        canProcure={
          ctx.can("procurement:manage") || ctx.can("projects:manage")
        }
        canReceive={
          ctx.can("materials:receive") ||
          ctx.can("materials:manage") ||
          ctx.can("procurement:manage") ||
          ctx.can("projects:manage")
        }
        canPay={
          ctx.can("payments:manage") ||
          ctx.can("procurement:manage") ||
          ctx.can("projects:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
