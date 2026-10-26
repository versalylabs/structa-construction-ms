import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BudgetsClient } from "./BudgetsClient";

export default async function BudgetsManagementPage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string;
    category?: string;
    status?: string;
  }>;
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

  const [budgetLines, projects] = await Promise.all([
    prisma.projectBudgetLine.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            contractValue: true,
            budget: true,
            committedCost: true,
            actualCost: true,
            status: true,
          },
        },
        phase: {
          select: {
            id: true,
            sequenceOrder: true,
            name: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ project: { code: "asc" } }, { code: "asc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        phases: {
          orderBy: { sequenceOrder: "asc" },
          select: { id: true, sequenceOrder: true, name: true },
        },
        boqItems: {
          select: {
            id: true,
            totalAmount: true,
            executedAmount: true,
          },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const canManageBudgets =
    ctx.can("budgets:manage") ||
    ctx.can("boq:manage") ||
    ctx.can("projects:manage") ||
    ctx.can("finance:expenses");

  return (
    <AuthenticatedLayout>
      <BudgetsClient
        budgetLines={budgetLines.map((line) => ({
          ...line,
          createdAt: line.createdAt.toISOString(),
          updatedAt: line.updatedAt.toISOString(),
        }))}
        projects={projects.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          contractValue: p.contractValue,
          budget: p.budget,
          committedCost: p.committedCost,
          actualCost: p.actualCost,
          status: p.status,
          phases: p.phases,
          boqCount: p.boqItems.length,
          boqTotal: p.boqItems.reduce((s, b) => s + b.totalAmount, 0),
        }))}
        currency={ctx.organization.currency}
        canManageBudgets={canManageBudgets}
        initialProjectFilter={params.projectId || "ALL"}
        initialCategoryFilter={params.category || "ALL"}
        initialStatusFilter={params.status || "ALL"}
      />
    </AuthenticatedLayout>
  );
}
