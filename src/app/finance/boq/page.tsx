import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BoqClient } from "./BoqClient";

export default async function BoqManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; category?: string }>;
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

  const [boqItems, projects] = await Promise.all([
    prisma.boqItem.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            contractValue: true,
            budget: true,
          },
        },
        phase: {
          select: {
            id: true,
            sequenceOrder: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ project: { code: "asc" } }, { itemCode: "asc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        phases: {
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            sequenceOrder: true,
            name: true,
          },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const canManageBoq = ctx.can("boq:manage") || ctx.can("projects:manage");
  const canManageBudgets =
    ctx.can("budgets:manage") ||
    ctx.can("boq:manage") ||
    ctx.can("projects:manage");

  return (
    <AuthenticatedLayout>
      <BoqClient
        boqItems={boqItems.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }))}
        projects={projects.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          contractValue: p.contractValue,
          budget: p.budget,
          phases: p.phases,
        }))}
        currency={ctx.organization.currency}
        canManageBoq={canManageBoq}
        canManageBudgets={canManageBudgets}
        initialProjectFilter={params.projectId || "ALL"}
        initialCategoryFilter={params.category || "ALL"}
      />
    </AuthenticatedLayout>
  );
}
