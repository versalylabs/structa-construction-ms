import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorkforceClient } from "./WorkforceClient";

export default async function WorkforcePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; category?: string }>;
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

  const [workers, attendanceLogs, projects] = await Promise.all([
    prisma.siteWorker.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
      },
      orderBy: { workerCode: "asc" },
    }),
    prisma.workerAttendanceLog.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        worker: {
          select: {
            id: true,
            workerCode: true,
            fullName: true,
            tradeRole: true,
          },
        },
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { attendanceDate: "desc" },
      take: 50,
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
  ]);

  return (
    <AuthenticatedLayout>
      <WorkforceClient
        workers={workers.map((w) => ({
          ...w,
          createdAt: w.createdAt.toISOString(),
        }))}
        attendanceLogs={attendanceLogs.map((l) => ({
          ...l,
          attendanceDate: l.attendanceDate.toISOString(),
          createdAt: l.createdAt.toISOString(),
        }))}
        projects={projects}
        initialProjectId={resolvedParams.projectId || "ALL"}
        initialCategory={resolvedParams.category || "ALL"}
        currency={ctx.organization.currency}
        canManageWorkforce={
          ctx.can("workforce:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("site_reports:submit")
        }
      />
    </AuthenticatedLayout>
  );
}
