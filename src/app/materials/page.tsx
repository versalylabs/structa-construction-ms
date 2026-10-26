import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialsClient } from "./MaterialsClient";

export default async function MaterialsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tab?: string }>;
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

  const [materials, suppliers, projects, projectStocks] = await Promise.all([
    prisma.material.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        preferredSupplier: {
          select: { id: true, code: true, name: true, phone: true },
        },
        projectStocks: {
          include: {
            project: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId: ctx.organization.id, status: "ACTIVE" },
      select: { id: true, code: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        sites: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.projectMaterialStock.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            standardUnitCost: true,
          },
        },
      },
      orderBy: [{ project: { code: "asc" } }, { material: { code: "asc" } }],
    }),
  ]);

  const canManageMaterials =
    ctx.can("materials:manage") ||
    ctx.can("procurement:po_manage") ||
    ctx.can("projects:manage");

  return (
    <AuthenticatedLayout>
      <MaterialsClient
        materials={materials.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
          projectStocks: m.projectStocks.map((ps) => ({
            ...ps,
            createdAt: ps.createdAt.toISOString(),
            updatedAt: ps.updatedAt.toISOString(),
          })),
        }))}
        suppliers={suppliers}
        projects={projects.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          sites: p.sites,
        }))}
        projectStocks={projectStocks.map((ps) => ({
          ...ps,
          createdAt: ps.createdAt.toISOString(),
          updatedAt: ps.updatedAt.toISOString(),
        }))}
        currency={ctx.organization.currency}
        canManageMaterials={canManageMaterials}
        initialCategoryFilter={params.category || "ALL"}
        initialTab={
          params.tab === "requirements" ? "requirements" : "catalog"
        }
      />
    </AuthenticatedLayout>
  );
}
