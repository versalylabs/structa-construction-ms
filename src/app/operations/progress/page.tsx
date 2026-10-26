import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressTrackingPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: ctx.organization.id },
    include: {
      client: { select: { name: true } },
      projectManager: { select: { name: true } },
      phases: {
        include: {
          tasks: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              progress: true,
            },
          },
        },
        orderBy: { sequenceOrder: "asc" },
      },
      milestones: {
        orderBy: { targetDate: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <AuthenticatedLayout>
      <ProgressClient
        projects={projects.map((p) => ({
          ...p,
          startDate: p.startDate.toISOString(),
          expectedCompletionDate: p.expectedCompletionDate.toISOString(),
          phases: p.phases.map((ph) => ({
            ...ph,
            startDate: ph.startDate.toISOString(),
            endDate: ph.endDate.toISOString(),
          })),
          milestones: p.milestones.map((m) => ({
            ...m,
            targetDate: m.targetDate.toISOString(),
            achievedDate: m.achievedDate ? m.achievedDate.toISOString() : null,
          })),
        }))}
        currency={ctx.organization.currency}
        canManageProgress={
          ctx.can("planning:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("site_reports:submit")
        }
      />
    </AuthenticatedLayout>
  );
}
