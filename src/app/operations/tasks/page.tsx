import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TasksClient } from "./TasksClient";

export default async function TasksPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string; view?: string }>;
}) {
  const ctx = await getSessionContext();
  const params = await searchParams;

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const orgId = ctx.organization.id;

  const [tasks, milestones, projects, users] = await Promise.all([
    prisma.projectTask.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, name: true, role: true, jobTitle: true } },
        dependsOnTask: {
          select: { id: true, code: true, name: true, status: true, progress: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.projectMilestone.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        owner: { select: { id: true, name: true, role: true } },
      },
      orderBy: { targetDate: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        code: true,
        name: true,
        phases: {
          select: { id: true, sequenceOrder: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
        sites: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: { id: true, name: true, role: true, jobTitle: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <TasksClient
        tasks={tasks.map((t) => ({
          ...t,
          startDate: t.startDate.toISOString(),
          dueDate: t.dueDate.toISOString(),
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        }))}
        milestones={milestones.map((m) => ({
          ...m,
          targetDate: m.targetDate.toISOString(),
          achievedDate: m.achievedDate ? m.achievedDate.toISOString() : null,
        }))}
        projects={projects}
        users={users}
        canManagePlanning={
          ctx.can("planning:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("site_reports:submit")
        }
        initialProjectFilter={params.projectId || "ALL"}
        initialStatusFilter={params.status || "ALL"}
        initialView={
          params.view === "board"
            ? "board"
            : params.view === "milestones"
              ? "milestones"
              : "table"
        }
      />
    </AuthenticatedLayout>
  );
}
