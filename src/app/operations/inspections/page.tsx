import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InspectionsSafetyClient } from "./InspectionsSafetyClient";

export const dynamic = "force-dynamic";

export default async function InspectionsSafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; domain?: string }>;
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

  const [records, projects, users] = await Promise.all([
    prisma.qualitySafetyInspection.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        inspectorOrReporter: { select: { id: true, name: true, role: true } },
        responsiblePerson: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
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
    prisma.user.findMany({
      where: { organizationId: ctx.organization.id, status: "ACTIVE" },
      select: { id: true, name: true, role: true, jobTitle: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <InspectionsSafetyClient
        records={records.map((r) => ({
          ...r,
          inspectionDate: r.inspectionDate.toISOString(),
          closedAt: r.closedAt ? r.closedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))}
        projects={projects}
        users={users}
        initialProjectFilter={resolvedParams?.projectId || "ALL"}
        initialDomainFilter={resolvedParams?.domain || "ALL"}
        canRecordInspections={
          ctx.can("site_reports:submit") ||
          ctx.can("projects:manage") ||
          ctx.can("planning:manage")
        }
      />
    </AuthenticatedLayout>
  );
}
