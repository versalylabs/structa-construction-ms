import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SiteStockClient } from "./SiteStockClient";

export default async function SiteStockPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
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

  const [stocks, usageLogs, projects] = await Promise.all([
    prisma.projectMaterialStock.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true, location: true } },
        material: {
          include: {
            preferredSupplier: {
              select: { id: true, code: true, name: true, phone: true },
            },
          },
        },
        lastUpdatedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ project: { code: "asc" } }, { material: { code: "asc" } }],
    }),
    prisma.materialUsageLog.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        material: { select: { id: true, code: true, name: true, unit: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const canManageStock =
    ctx.can("materials:manage") ||
    ctx.can("site_reports:submit") ||
    ctx.can("projects:manage");

  return (
    <AuthenticatedLayout>
      <SiteStockClient
        stocks={stocks.map((st) => ({
          ...st,
          createdAt: st.createdAt.toISOString(),
          updatedAt: st.updatedAt.toISOString(),
          material: {
            ...st.material,
            createdAt: st.material.createdAt.toISOString(),
            updatedAt: st.material.updatedAt.toISOString(),
          },
        }))}
        usageLogs={usageLogs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        }))}
        projects={projects}
        currency={ctx.organization.currency}
        canManageStock={canManageStock}
        initialProjectFilter={params.projectId || "ALL"}
        initialStatusFilter={params.status || "ALL"}
      />
    </AuthenticatedLayout>
  );
}
