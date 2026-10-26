"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

const createClientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  clientType: z.string().default("CORPORATE"),
  contactPerson: z.string().min(2, "Primary contact person is required"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Valid email address is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  taxPin: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Create & Edit Projects' required to manage clients." };
  }

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    clientType: formData.get("clientType") || "CORPORATE",
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: String(formData.get("email") || "").trim(),
    address: formData.get("address") || "",
    city: formData.get("city") || "Nairobi",
    taxPin: formData.get("taxPin") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid client input." };
  }

  const data = parsed.data;
  const count = await prisma.client.count({
    where: { organizationId: ctx.organization.id },
  });
  const code = `CLI-${String(count + 1).padStart(3, "0")}`;

  const created = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        organizationId: ctx.organization.id,
        code,
        name: data.name,
        clientType: data.clientType,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address || null,
        city: data.city || "Nairobi",
        taxPin: data.taxPin || null,
        notes: data.notes || null,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "CLIENT_CREATED",
        entity: "Client",
        entityId: client.id,
        description: `${ctx.user.name} registered client ${client.name} (${client.code}).`,
        newValue: JSON.stringify({
          code: client.code,
          name: client.name,
          contactPerson: client.contactPerson,
        }),
      },
    });

    return client;
  });

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, client: created };
}

const createProjectSchema = z.object({
  name: z.string().min(3, "Project name is required"),
  code: z.string().optional(),
  projectType: z.string().default("RESIDENTIAL"),
  location: z.string().min(2, "Site location is required"),
  county: z.string().default("Nairobi"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  projectManagerId: z.string().optional(),
  siteManagerId: z.string().optional(),
  quantitySurveyorId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  expectedCompletionDate: z.string().min(1, "Expected completion date is required"),
  contractValue: z.coerce.number().min(0, "Contract value must be non-negative"),
  budget: z.coerce.number().min(0, "Budget must be non-negative"),
  status: z.string().default("PLANNING"),
  autoCreatePhases: z.string().optional(),
});

export async function createProjectAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Create & Edit Projects' required." };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || "",
    projectType: formData.get("projectType") || "RESIDENTIAL",
    location: formData.get("location"),
    county: formData.get("county") || "Nairobi",
    description: formData.get("description") || "",
    clientId: formData.get("clientId") || "",
    projectManagerId: formData.get("projectManagerId") || "",
    siteManagerId: formData.get("siteManagerId") || "",
    quantitySurveyorId: formData.get("quantitySurveyorId") || "",
    startDate: formData.get("startDate"),
    expectedCompletionDate: formData.get("expectedCompletionDate"),
    contractValue: formData.get("contractValue") || 0,
    budget: formData.get("budget") || 0,
    status: formData.get("status") || ctx.organization.defaultProjectStatus,
    autoCreatePhases: formData.get("autoCreatePhases") || "TRUE",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid project fields." };
  }

  const data = parsed.data;
  const existingCount = await prisma.project.count({
    where: { organizationId: ctx.organization.id },
  });
  const projectCode =
    data.code && data.code.trim().length > 0
      ? data.code.trim().toUpperCase()
      : `${ctx.organization.projectPrefix}${String(existingCount + 1).padStart(3, "0")}`;

  const duplicate = await prisma.project.findFirst({
    where: {
      organizationId: ctx.organization.id,
      code: projectCode,
    },
  });
  if (duplicate) {
    return { error: `A project with code ${projectCode} already exists in your organization.` };
  }

  const start = new Date(data.startDate);
  const end = new Date(data.expectedCompletionDate);

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        organizationId: ctx.organization.id,
        code: projectCode,
        name: data.name,
        projectType: data.projectType,
        location: data.location,
        county: data.county,
        description: data.description || null,
        clientId: data.clientId || null,
        projectManagerId: data.projectManagerId || null,
        siteManagerId: data.siteManagerId || null,
        quantitySurveyorId: data.quantitySurveyorId || null,
        startDate: start,
        expectedCompletionDate: end,
        contractValue: data.contractValue,
        budget: data.budget,
        status: data.status,
        plannedProgress: 0,
        progress: 0,
      },
    });

    // Create Primary Construction Site automatically
    await tx.site.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: createdProject.id,
        code: `SITE-${String(existingCount + 1).padStart(2, "0")}-MAIN`,
        name: `${data.name} — Main Construction Site`,
        location: data.location,
        county: data.county,
        siteManagerId: data.siteManagerId || null,
        status: data.status === "ACTIVE" ? "ACTIVE" : "MOBILIZING",
        notes: "Primary construction site initialized with project.",
      },
    });

    // Assign key project team members
    const teamToAssign = new Map<string, string>();
    if (data.projectManagerId) {
      teamToAssign.set(data.projectManagerId, "Lead Project Manager");
    }
    if (data.siteManagerId && !teamToAssign.has(data.siteManagerId)) {
      teamToAssign.set(data.siteManagerId, "Resident Site Manager");
    }
    if (data.quantitySurveyorId && !teamToAssign.has(data.quantitySurveyorId)) {
      teamToAssign.set(data.quantitySurveyorId, "Project Quantity Surveyor");
    }

    for (const [uid, roleLabel] of teamToAssign.entries()) {
      await tx.projectMember.create({
        data: {
          organizationId: ctx.organization.id,
          projectId: createdProject.id,
          userId: uid,
          projectRole: roleLabel,
          allocationPct: 100,
        },
      });
    }

    // Optionally seed standard 7 construction phases (Section 10)
    if (data.autoCreatePhases === "TRUE") {
      const totalBudget = data.budget || 0;
      const defaultPhases = [
        { order: 1, name: "Site Preparation & Earthworks", weight: 0.08 },
        { order: 2, name: "Foundation & Substructure", weight: 0.16 },
        { order: 3, name: "Superstructure Structural Works", weight: 0.30 },
        { order: 4, name: "Roofing & Waterproofing", weight: 0.08 },
        { order: 5, name: "Electrical & Mechanical (MEP)", weight: 0.14 },
        { order: 6, name: "Internal & External Finishing", weight: 0.18 },
        { order: 7, name: "External Works & Completion", weight: 0.06 },
      ];

      const totalMs = Math.max(end.getTime() - start.getTime(), 86400000 * 30);
      let cursorMs = start.getTime();

      for (const ph of defaultPhases) {
        const durationMs = Math.floor(totalMs * ph.weight);
        const phaseStart = new Date(cursorMs);
        const phaseEnd = new Date(cursorMs + durationMs);
        cursorMs += durationMs;

        await tx.projectPhase.create({
          data: {
            organizationId: ctx.organization.id,
            projectId: createdProject.id,
            sequenceOrder: ph.order,
            name: ph.name,
            startDate: phaseStart,
            endDate: phaseEnd,
            budget: Math.round(totalBudget * ph.weight),
            actualCost: 0,
            plannedProgress: 0,
            progress: 0,
            status: "NOT_STARTED",
            leadUserId: data.projectManagerId || data.siteManagerId || null,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PROJECT_CREATED",
        entity: "Project",
        entityId: createdProject.id,
        description: `${ctx.user.name} created project ${createdProject.code} (${createdProject.name}) with contract value KSh ${createdProject.contractValue.toLocaleString()}.`,
        newValue: JSON.stringify({
          code: createdProject.code,
          name: createdProject.name,
          contractValue: createdProject.contractValue,
          budget: createdProject.budget,
          status: createdProject.status,
        }),
      },
    });

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        userId: null,
        title: `New Project Created: ${createdProject.code}`,
        message: `${createdProject.name} (${data.location}) has been initialized with a budget of KSh ${createdProject.budget.toLocaleString()}.`,
        type: "SUCCESS",
        category: "PROJECT",
        link: `/projects/${createdProject.id}`,
        isRead: "FALSE",
      },
    });

    return createdProject;
  });

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, projectId: project.id };
}

export async function updateProjectStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Create & Edit Projects' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const status = String(formData.get("status") || "ACTIVE");
  const progress = Math.min(
    100,
    Math.max(0, Number(formData.get("progress") || 0))
  );

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: ctx.organization.id,
    },
  });

  if (!project) {
    return { error: "Project not found in your organization." };
  }

  const prev = { status: project.status, progress: project.progress };

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: {
        status,
        progress: status === "COMPLETED" ? 100 : progress,
        actualCompletionDate: status === "COMPLETED" ? new Date() : null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PROJECT_STATUS_UPDATED",
        entity: "Project",
        entityId: project.id,
        description: `${ctx.user.name} updated ${project.code} status (${prev.status} → ${status}) and progress (${prev.progress}% → ${progress}%).`,
        previousValue: JSON.stringify(prev),
        newValue: JSON.stringify({ status, progress }),
      },
    });

    if (status === "DELAYED" && prev.status !== "DELAYED") {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          userId: null,
          title: `Project Delayed Alert: ${project.code}`,
          message: `${project.name} has been flagged as DELAYED at ${progress}% completion.`,
          type: "WARNING",
          category: "PROJECT",
          link: `/projects/${project.id}`,
          isRead: "FALSE",
        },
      });
    }
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function createProjectPhaseAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("planning:manage") && !ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Manage Phases & Tasks' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const budget = Math.max(0, Number(formData.get("budget") || 0));
  const leadUserId = String(formData.get("leadUserId") || "");

  if (!projectId || !name || !startDate || !endDate) {
    return { error: "Phase name, start date, and end date are required." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organization.id },
    include: { phases: true },
  });

  if (!project) return { error: "Project not found." };

  const nextOrder =
    project.phases.reduce((max, p) => Math.max(max, p.sequenceOrder), 0) + 1;

  await prisma.$transaction(async (tx) => {
    const phase = await tx.projectPhase.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        sequenceOrder: nextOrder,
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
        actualCost: 0,
        plannedProgress: 0,
        progress: 0,
        status: "NOT_STARTED",
        leadUserId: leadUserId || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PROJECT_PHASE_CREATED",
        entity: "ProjectPhase",
        entityId: phase.id,
        description: `${ctx.user.name} added phase '${phase.name}' (Budget: KSh ${budget.toLocaleString()}) to ${project.code}.`,
        newValue: JSON.stringify({ name: phase.name, budget, sequenceOrder: nextOrder }),
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}

export async function updateProjectPhaseProgressAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("planning:manage") && !ctx.can("projects:manage") && !ctx.can("site_reports:submit")) {
    return { error: "Permission denied to update phase progress." };
  }

  const phaseId = String(formData.get("phaseId") || "");
  const status = String(formData.get("status") || "IN_PROGRESS");
  const progress = Math.min(
    100,
    Math.max(0, Number(formData.get("progress") || 0))
  );
  const actualCost = Math.max(0, Number(formData.get("actualCost") || 0));

  const phase = await prisma.projectPhase.findFirst({
    where: {
      id: phaseId,
      organizationId: ctx.organization.id,
    },
  });

  if (!phase) return { error: "Project phase not found." };

  const finalProgress = status === "COMPLETED" ? 100 : progress;

  await prisma.$transaction(async (tx) => {
    await tx.projectPhase.update({
      where: { id: phase.id },
      data: {
        status,
        progress: finalProgress,
        actualCost,
      },
    });

    // Recalculate parent project budget-weighted progress & total actual cost from phases
    const allPhases = await tx.projectPhase.findMany({
      where: { projectId: phase.projectId },
    });

    const totalPhaseBudget = allPhases.reduce((s, p) => s + p.budget, 0);
    let weightedProgress = 0;
    if (totalPhaseBudget > 0) {
      weightedProgress = Math.round(
        allPhases.reduce((s, p) => s + p.progress * p.budget, 0) /
          totalPhaseBudget
      );
    } else if (allPhases.length > 0) {
      weightedProgress = Math.round(
        allPhases.reduce((s, p) => s + p.progress, 0) / allPhases.length
      );
    }

    const totalPhaseActualCost = allPhases.reduce((s, p) => s + p.actualCost, 0);

    await tx.project.update({
      where: { id: phase.projectId },
      data: {
        progress: weightedProgress,
        actualCost: totalPhaseActualCost,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PHASE_PROGRESS_UPDATED",
        entity: "ProjectPhase",
        entityId: phase.id,
        description: `${ctx.user.name} updated phase '${phase.name}' to ${finalProgress}% (${status}), Actual Cost: KSh ${actualCost.toLocaleString()}.`,
        previousValue: JSON.stringify({
          status: phase.status,
          progress: phase.progress,
          actualCost: phase.actualCost,
        }),
        newValue: JSON.stringify({
          status,
          progress: finalProgress,
          actualCost,
          projectRollupProgress: weightedProgress,
        }),
      },
    });
  });

  revalidatePath(`/projects/${phase.projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function createSiteAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Create & Edit Projects' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const location = String(formData.get("location") || "").trim();
  const county = String(formData.get("county") || "Nairobi").trim();
  const gpsCoordinates = String(formData.get("gpsCoordinates") || "").trim();
  const siteManagerId = String(formData.get("siteManagerId") || "");
  const status = String(formData.get("status") || "ACTIVE");
  const notes = String(formData.get("notes") || "").trim();

  if (!projectId || !name || !location) {
    return { error: "Site name and location are required." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organization.id },
  });
  if (!project) return { error: "Project not found." };

  await prisma.$transaction(async (tx) => {
    const site = await tx.site.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        code: code || `SITE-${Math.floor(100 + Math.random() * 900)}`,
        name,
        location,
        county,
        gpsCoordinates: gpsCoordinates || null,
        siteManagerId: siteManagerId || null,
        status,
        notes: notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SITE_CREATED",
        entity: "Site",
        entityId: site.id,
        description: `${ctx.user.name} registered construction site '${site.name}' (${site.code}) under ${project.code}.`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function assignProjectMemberAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Create & Edit Projects' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const userId = String(formData.get("userId") || "");
  const projectRole = String(formData.get("projectRole") || "").trim();
  const allocationPct = Math.min(
    100,
    Math.max(5, Number(formData.get("allocationPct") || 100))
  );

  if (!projectId || !userId || !projectRole) {
    return { error: "Team member and project responsibility are required." };
  }

  const [project, targetUser] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    }),
    prisma.user.findFirst({
      where: { id: userId, organizationId: ctx.organization.id },
    }),
  ]);

  if (!project || !targetUser) {
    return { error: "Project or team member not found in your organization." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: targetUser.id,
        },
      },
      create: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        userId: targetUser.id,
        projectRole,
        allocationPct,
      },
      update: {
        projectRole,
        allocationPct,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PROJECT_TEAM_ASSIGNED",
        entity: "ProjectMember",
        entityId: project.id,
        description: `${ctx.user.name} assigned ${targetUser.name} as '${projectRole}' (${allocationPct}% allocation) on ${project.code}.`,
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createProjectDocumentAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("documents:manage") && !ctx.can("projects:manage")) {
    return { error: "Permission denied: 'Upload & Manage Documents' required." };
  }

  const projectId = String(formData.get("projectId") || "");
  const clientId = String(formData.get("clientId") || "");
  const title = String(formData.get("title") || "").trim();
  const documentNumber = String(formData.get("documentNumber") || "")
    .trim()
    .toUpperCase();
  const category = String(formData.get("category") || "CONTRACT");
  const version = String(formData.get("version") || "v1.0").trim();
  const fileName = String(formData.get("fileName") || "").trim();
  const fileSizeLabel = String(formData.get("fileSizeLabel") || "3.2 MB").trim();
  const status = String(formData.get("status") || "APPROVED");
  const notes = String(formData.get("notes") || "").trim();

  if (!title || !fileName) {
    return { error: "Document title and filename are required." };
  }

  await prisma.$transaction(async (tx) => {
    const doc = await tx.projectDocument.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: projectId || null,
        clientId: clientId || null,
        title,
        documentNumber:
          documentNumber ||
          `${ctx.organization.code}-DOC-${Math.floor(100 + Math.random() * 900)}`,
        category,
        version,
        fileName,
        fileSizeLabel,
        status,
        notes: notes || null,
        uploadedById: ctx.user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "DOCUMENT_REGISTERED",
        entity: "ProjectDocument",
        entityId: doc.id,
        description: `${ctx.user.name} uploaded ${doc.category} document '${doc.title}' (${doc.documentNumber}).`,
      },
    });
  });

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/documents");
  revalidatePath("/projects");
  return { success: true };
}
