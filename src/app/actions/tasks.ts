"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  phaseId: z.string().optional(),
  siteId: z.string().optional(),
  name: z.string().min(3, "Task title is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date / deadline is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED"])
    .default("NOT_STARTED"),
  dependsOnTaskId: z.string().optional(),
  notes: z.string().optional(),
  blockerReason: z.string().optional(),
});

export async function createTaskAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("planning:manage") &&
    !ctx.can("projects:manage") &&
    !ctx.can("site_reports:submit")
  ) {
    return {
      error: "Permission denied: 'Manage Phases & Tasks' capability required.",
    };
  }

  const parsed = createTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    phaseId: formData.get("phaseId") || "",
    siteId: formData.get("siteId") || "",
    name: formData.get("name"),
    code: formData.get("code") || "",
    description: formData.get("description") || "",
    assignedToId: formData.get("assignedToId") || "",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority") || "MEDIUM",
    status: formData.get("status") || "NOT_STARTED",
    dependsOnTaskId: formData.get("dependsOnTaskId") || "",
    notes: formData.get("notes") || "",
    blockerReason: formData.get("blockerReason") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid task parameters.",
    };
  }

  const data = parsed.data;

  // Enforce strict tenant isolation on project lookup
  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      organizationId: ctx.organization.id,
    },
  });

  if (!project) {
    return { error: "Selected project was not found in your organization." };
  }

  const existingTaskCount = await prisma.projectTask.count({
    where: { projectId: project.id },
  });

  const shortPrj = project.code.split("-").pop() || "PRJ";
  const taskCode =
    data.code && data.code.trim().length > 0
      ? data.code.trim().toUpperCase()
      : `TSK-${shortPrj}-${String(existingTaskCount + 1).padStart(3, "0")}`;

  const created = await prisma.$transaction(async (tx) => {
    const newTask = await tx.projectTask.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        phaseId: data.phaseId || null,
        siteId: data.siteId || null,
        code: taskCode,
        name: data.name,
        description: data.description || null,
        assignedToId: data.assignedToId || null,
        createdById: ctx.user.id,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        priority: data.priority,
        status: data.status,
        progress: data.status === "COMPLETED" ? 100 : 0,
        completedAt: data.status === "COMPLETED" ? new Date() : null,
        dependsOnTaskId: data.dependsOnTaskId || null,
        notes: data.notes || null,
        blockerReason:
          data.status === "BLOCKED" ? data.blockerReason || "Site blocker reported" : null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "TASK_CREATED",
        entity: "ProjectTask",
        entityId: newTask.id,
        description: `${ctx.user.name} scheduled task ${newTask.code} ('${newTask.name}') under ${project.code} [Priority: ${newTask.priority}].`,
        newValue: JSON.stringify({
          code: newTask.code,
          name: newTask.name,
          project: project.code,
          priority: newTask.priority,
          dueDate: data.dueDate,
        }),
      },
    });

    if (data.priority === "CRITICAL" || data.status === "BLOCKED") {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          userId: data.assignedToId || null,
          title: `${data.status === "BLOCKED" ? "Blocked Task" : "Critical Task"} Scheduled: ${newTask.code}`,
          message: `${newTask.name} (${project.code}) — Due ${data.dueDate}.`,
          type: data.status === "BLOCKED" ? "WARNING" : "INFO",
          category: "PROJECT",
          link: "/operations/tasks",
          isRead: "FALSE",
        },
      });
    }

    return newTask;
  });

  revalidatePath("/operations/tasks");
  revalidatePath("/operations/progress");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/");
  return { success: true, task: created };
}

export async function updateTaskStatusAndProgressAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("planning:manage") &&
    !ctx.can("projects:manage") &&
    !ctx.can("site_reports:submit")
  ) {
    return { error: "Permission denied to update tasks." };
  }

  const taskId = String(formData.get("taskId") || "");
  const status = String(formData.get("status") || "IN_PROGRESS");
  const rawProgress = Number(formData.get("progress") || 0);
  const blockerReason = String(formData.get("blockerReason") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  const task = await prisma.projectTask.findFirst({
    where: {
      id: taskId,
      organizationId: ctx.organization.id,
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
      dependsOnTask: { select: { id: true, code: true, name: true, status: true } },
    },
  });

  if (!task) {
    return { error: "Task not found in your organization." };
  }

  // Enforce construction dependency rule: cannot mark COMPLETED if prerequisite task is not COMPLETED
  if (
    status === "COMPLETED" &&
    task.dependsOnTask &&
    task.dependsOnTask.status !== "COMPLETED"
  ) {
    return {
      error: `Dependency Constraint: Cannot mark ${task.code} as COMPLETED while prerequisite task ${task.dependsOnTask.code} ('${task.dependsOnTask.name}') is still ${task.dependsOnTask.status}.`,
    };
  }

  const finalProgress =
    status === "COMPLETED"
      ? 100
      : status === "NOT_STARTED"
        ? 0
        : Math.min(99, Math.max(0, rawProgress));

  const previousSnapshot = {
    status: task.status,
    progress: task.progress,
    blockerReason: task.blockerReason,
  };

  await prisma.$transaction(async (tx) => {
    await tx.projectTask.update({
      where: { id: task.id },
      data: {
        status,
        progress: finalProgress,
        completedAt: status === "COMPLETED" ? new Date() : null,
        blockerReason:
          status === "BLOCKED"
            ? blockerReason || task.blockerReason || "Blocked on site"
            : null,
        notes: notes || task.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "TASK_PROGRESS_UPDATED",
        entity: "ProjectTask",
        entityId: task.id,
        description: `${ctx.user.name} updated ${task.code} ('${task.name}') to ${status} (${finalProgress}%).`,
        previousValue: JSON.stringify(previousSnapshot),
        newValue: JSON.stringify({
          status,
          progress: finalProgress,
          blockerReason: status === "BLOCKED" ? blockerReason : null,
        }),
      },
    });

    if (status === "BLOCKED" && previousSnapshot.status !== "BLOCKED") {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          userId: null,
          title: `Task Blocked on Site: ${task.code} (${task.project.code})`,
          message: `${task.name} is blocked: ${blockerReason || "Requires management intervention"}.`,
          type: "WARNING",
          category: "SITE",
          link: "/operations/tasks",
          isRead: "FALSE",
        },
      });
    }
  });

  revalidatePath("/operations/tasks");
  revalidatePath("/operations/progress");
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/");
  return { success: true };
}

export async function createMilestoneAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("planning:manage") && !ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Manage Phases & Tasks' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const phaseId = String(formData.get("phaseId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const targetDate = String(formData.get("targetDate") || "");
  const status = String(formData.get("status") || "UPCOMING");
  const valuationLinkedNote = String(
    formData.get("valuationLinkedNote") || ""
  ).trim();
  const ownerId = String(formData.get("ownerId") || "");

  if (!projectId || !title || !targetDate) {
    return { error: "Project, milestone title, and target date are required." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organization.id },
  });
  if (!project) return { error: "Project not found." };

  const count = await prisma.projectMilestone.count({
    where: { projectId: project.id },
  });
  const shortPrj = project.code.split("-").pop() || "PRJ";
  const code = `MS-${shortPrj}-${String(count + 1).padStart(2, "0")}`;

  await prisma.$transaction(async (tx) => {
    const ms = await tx.projectMilestone.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        phaseId: phaseId || null,
        code,
        title,
        description: description || null,
        targetDate: new Date(targetDate),
        achievedDate: status === "ACHIEVED" ? new Date() : null,
        status,
        valuationLinkedNote: valuationLinkedNote || null,
        ownerId: ownerId || ctx.user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "MILESTONE_CREATED",
        entity: "ProjectMilestone",
        entityId: ms.id,
        description: `${ctx.user.name} created milestone ${ms.code} ('${ms.title}') for ${project.code}.`,
      },
    });
  });

  revalidatePath("/operations/tasks");
  revalidatePath("/operations/progress");
  revalidatePath(`/projects/${project.id}`);
  return { success: true };
}

export async function updateMilestoneStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("planning:manage") && !ctx.can("projects:manage")) {
    return { error: "Permission denied to update milestones." };
  }

  const milestoneId = String(formData.get("milestoneId") || "");
  const status = String(formData.get("status") || "ACHIEVED");

  const ms = await prisma.projectMilestone.findFirst({
    where: {
      id: milestoneId,
      organizationId: ctx.organization.id,
    },
    include: { project: { select: { code: true } } },
  });

  if (!ms) return { error: "Milestone not found." };

  await prisma.$transaction(async (tx) => {
    await tx.projectMilestone.update({
      where: { id: ms.id },
      data: {
        status,
        achievedDate: status === "ACHIEVED" ? new Date() : null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "MILESTONE_STATUS_UPDATED",
        entity: "ProjectMilestone",
        entityId: ms.id,
        description: `${ctx.user.name} updated milestone ${ms.code} ('${ms.title}') status: ${ms.status} → ${status}.`,
        previousValue: JSON.stringify({ status: ms.status }),
        newValue: JSON.stringify({ status }),
      },
    });

    if (status === "ACHIEVED") {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          userId: null,
          title: `Milestone Achieved: ${ms.code} (${ms.project.code})`,
          message: `${ms.title} has been marked ACHIEVED. ${ms.valuationLinkedNote || ""}`,
          type: "SUCCESS",
          category: "PROJECT",
          link: "/operations/progress",
          isRead: "FALSE",
        },
      });
    }
  });

  revalidatePath("/operations/tasks");
  revalidatePath("/operations/progress");
  revalidatePath(`/projects/${ms.projectId}`);
  return { success: true };
}
