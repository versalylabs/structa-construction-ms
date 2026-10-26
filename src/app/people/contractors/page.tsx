import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContractorsClient } from "./ContractorsClient";

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [subcontractors, projects] = await Promise.all([
    prisma.subcontractor.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
        phase: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ status: "asc" }, { contractValue: "desc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        phases: {
          select: { id: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const serializedSubcontractors = subcontractors.map((sc) => ({
    ...sc,
    startDate: sc.startDate ? sc.startDate.toISOString() : null,
    endDate: sc.endDate ? sc.endDate.toISOString() : null,
    createdAt: sc.createdAt.toISOString(),
    updatedAt: sc.updatedAt.toISOString(),
  }));

  return (
    <AuthenticatedLayout>
      <ContractorsClient
        subcontractors={serializedSubcontractors}
        projects={projects}
        userRole={ctx.user.role}
      />
    </AuthenticatedLayout>
  );
}
