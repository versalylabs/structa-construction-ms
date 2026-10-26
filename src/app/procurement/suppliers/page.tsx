import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuppliersClient } from "./SuppliersClient";

export default async function SuppliersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }
  const params = await searchParams;

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: ctx.organization.id },
    include: {
      preferredMaterials: {
        include: {
          projectStocks: {
            include: {
              project: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  const canManageSuppliers =
    ctx.can("procurement:po_manage") ||
    ctx.can("materials:manage") ||
    ctx.can("projects:manage") ||
    ctx.can("finance:payments");

  return (
    <AuthenticatedLayout>
      <SuppliersClient
        suppliers={suppliers.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          preferredMaterials: s.preferredMaterials.map((pm) => ({
            id: pm.id,
            code: pm.code,
            name: pm.name,
            unit: pm.unit,
            standardUnitCost: pm.standardUnitCost,
            projectStocks: pm.projectStocks.map((ps) => ({
              id: ps.id,
              receivedQuantity: ps.receivedQuantity,
              totalCost: ps.totalCost,
              project: ps.project,
            })),
          })),
        }))}
        currency={ctx.organization.currency}
        canManageSuppliers={canManageSuppliers}
        initialCategoryFilter={params.category || "ALL"}
        initialStatusFilter={params.status || "ALL"}
      />
    </AuthenticatedLayout>
  );
}
