"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { BUDGET_CATEGORY_STYLES, computeBudgetLineStatus, formatCurrency } from "@/lib/utils";

const BOQ_CATEGORIES = [
  "PRELIMINARIES",
  "SUBSTRUCTURE",
  "SUPERSTRUCTURE_CONCRETE",
  "MASONRY_WALLING",
  "STEELWORK",
  "ROOFING",
  "FINISHES",
  "MEP_INSTALLATIONS",
  "EXTERNAL_WORKS",
] as const;

const BUDGET_CATEGORIES = [
  "MATERIALS",
  "LABOUR",
  "EQUIPMENT",
  "TRANSPORT",
  "SUBCONTRACTORS",
  "PROFESSIONAL_FEES",
  "PERMITS",
  "UTILITIES",
  "MISCELLANEOUS",
] as const;

const createBoqItemSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  phaseId: z.string().optional(),
  itemCode: z.string().optional(),
  description: z.string().min(4, "BOQ item description is required"),
  category: z.enum(BOQ_CATEGORIES).default("SUPERSTRUCTURE_CONCRETE"),
  costCategory: z.enum(BUDGET_CATEGORIES).default("MATERIALS"),
  unit: z.string().min(1, "Unit of measurement is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  executedQuantity: z.coerce.number().min(0).default(0),
  unitRate: z.coerce.number().positive("Unit rate (KSh) must be greater than 0"),
  notes: z.string().optional(),
});

export async function createBoqItemAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("boq:manage") && !ctx.can("projects:manage")) {
    return {
      error: "Permission denied: 'Manage BOQ Items' capability required.",
    };
  }

  const parsed = createBoqItemSchema.safeParse({
    projectId: formData.get("projectId"),
    phaseId: formData.get("phaseId") || "",
    itemCode: formData.get("itemCode") || "",
    description: formData.get("description"),
    category: formData.get("category") || "SUPERSTRUCTURE_CONCRETE",
    costCategory: formData.get("costCategory") || "MATERIALS",
    unit: formData.get("unit") || "m³",
    quantity: formData.get("quantity"),
    executedQuantity: formData.get("executedQuantity") || 0,
    unitRate: formData.get("unitRate"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid BOQ item fields.",
    };
  }

  const data = parsed.data;

  // Enforce strict tenant isolation
  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      organizationId: ctx.organization.id,
    },
  });

  if (!project) {
    return { error: "Selected project was not found in your organization." };
  }

  const existingCount = await prisma.boqItem.count({
    where: { projectId: project.id },
  });

  const shortPrj = project.code.split("-").pop() || "PRJ";
  const finalItemCode =
    data.itemCode && data.itemCode.trim().length > 0
      ? data.itemCode.trim().toUpperCase()
      : `BOQ-${shortPrj}-${String(existingCount + 1).padStart(2, "0")}`;

  const duplicate = await prisma.boqItem.findFirst({
    where: {
      projectId: project.id,
      itemCode: finalItemCode,
    },
  });

  if (duplicate) {
    return {
      error: `BOQ Item Code "${finalItemCode}" already exists on ${project.name}.`,
    };
  }

  // Server-side calculation: Total = Quantity × Unit Rate (Section 12)
  const totalAmount = Math.round(data.quantity * data.unitRate * 100) / 100;
  const executedAmount =
    Math.round(data.executedQuantity * data.unitRate * 100) / 100;

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.boqItem.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        phaseId: data.phaseId || null,
        itemCode: finalItemCode,
        description: data.description,
        category: data.category,
        costCategory: data.costCategory,
        unit: data.unit,
        quantity: data.quantity,
        executedQuantity: data.executedQuantity,
        unitRate: data.unitRate,
        totalAmount,
        executedAmount,
        notes: data.notes || null,
        createdById: ctx.user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "BOQ_ITEM_CREATED",
        entity: "BoqItem",
        entityId: item.id,
        description: `Added BOQ item ${item.itemCode} (${data.quantity} ${data.unit} @ ${formatCurrency(data.unitRate)} = ${formatCurrency(totalAmount)}) to ${project.name}`,
        newValue: JSON.stringify({
          itemCode: item.itemCode,
          quantity: item.quantity,
          unitRate: item.unitRate,
          totalAmount: item.totalAmount,
        }),
      },
    });

    return item;
  });

  revalidatePath("/finance/boq");
  revalidatePath("/finance/budgets");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/");

  return { success: true, itemId: created.id };
}

const updateBoqValuationSchema = z.object({
  itemId: z.string().min(1, "BOQ item ID is required"),
  quantity: z.coerce.number().positive("Bill quantity must be greater than 0"),
  executedQuantity: z.coerce.number().min(0, "Measured quantity cannot be negative"),
  unitRate: z.coerce.number().positive("Unit rate must be greater than 0"),
  notes: z.string().optional(),
});

export async function updateBoqItemValuationAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("boq:manage") &&
    !ctx.can("projects:manage") &&
    !ctx.can("site_reports:submit")
  ) {
    return {
      error: "Permission denied: 'Manage BOQ Items' capability required.",
    };
  }

  const parsed = updateBoqValuationSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    executedQuantity: formData.get("executedQuantity"),
    unitRate: formData.get("unitRate"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid BOQ measurement values.",
    };
  }

  const data = parsed.data;

  const existing = await prisma.boqItem.findFirst({
    where: {
      id: data.itemId,
      organizationId: ctx.organization.id,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!existing) {
    return { error: "BOQ item not found in your organization." };
  }

  const totalAmount = Math.round(data.quantity * data.unitRate * 100) / 100;
  const executedAmount =
    Math.round(data.executedQuantity * data.unitRate * 100) / 100;

  await prisma.$transaction(async (tx) => {
    await tx.boqItem.update({
      where: { id: existing.id },
      data: {
        quantity: data.quantity,
        executedQuantity: data.executedQuantity,
        unitRate: data.unitRate,
        totalAmount,
        executedAmount,
        notes: data.notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "BOQ_ITEM_VALUED",
        entity: "BoqItem",
        entityId: existing.id,
        description: `Updated QS measurement on ${existing.itemCode} (${existing.project.name}): Executed ${data.executedQuantity}/${data.quantity} ${existing.unit} (${formatCurrency(executedAmount)})`,
        previousValue: JSON.stringify({
          quantity: existing.quantity,
          executedQuantity: existing.executedQuantity,
          unitRate: existing.unitRate,
          totalAmount: existing.totalAmount,
        }),
        newValue: JSON.stringify({
          quantity: data.quantity,
          executedQuantity: data.executedQuantity,
          unitRate: data.unitRate,
          totalAmount,
          executedAmount,
        }),
      },
    });
  });

  revalidatePath("/finance/boq");
  revalidatePath(`/projects/${existing.projectId}`);
  revalidatePath("/");

  return { success: true };
}

const createBudgetLineSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  phaseId: z.string().optional(),
  code: z.string().optional(),
  category: z.enum(BUDGET_CATEGORIES).default("MATERIALS"),
  title: z.string().min(3, "Budget line title is required"),
  description: z.string().optional(),
  allocatedBudget: z.coerce.number().positive("Allocated budget must be greater than 0"),
  committedCost: z.coerce.number().min(0).default(0),
  actualCost: z.coerce.number().min(0).default(0),
  alertThresholdPct: z.coerce.number().min(50).max(100).default(85),
  notes: z.string().optional(),
});

async function recalculateProjectFinancialRollup(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  projectId: string
) {
  const allLines = await tx.projectBudgetLine.findMany({
    where: { projectId },
  });

  if (allLines.length === 0) return;

  const totalBudget = allLines.reduce((sum, l) => sum + l.allocatedBudget, 0);
  const totalCommitted = allLines.reduce((sum, l) => sum + l.committedCost, 0);
  const totalActual = allLines.reduce((sum, l) => sum + l.actualCost, 0);

  await tx.project.update({
    where: { id: projectId },
    data: {
      budget: totalBudget,
      committedCost: totalCommitted,
      actualCost: totalActual,
    },
  });
}

export async function createBudgetLineAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("budgets:manage") &&
    !ctx.can("boq:manage") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: 'Manage Budgets' capability required.",
    };
  }

  const parsed = createBudgetLineSchema.safeParse({
    projectId: formData.get("projectId"),
    phaseId: formData.get("phaseId") || "",
    code: formData.get("code") || "",
    category: formData.get("category") || "MATERIALS",
    title: formData.get("title"),
    description: formData.get("description") || "",
    allocatedBudget: formData.get("allocatedBudget"),
    committedCost: formData.get("committedCost") || 0,
    actualCost: formData.get("actualCost") || 0,
    alertThresholdPct: formData.get("alertThresholdPct") || 85,
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid budget line data.",
    };
  }

  const data = parsed.data;

  const project = await prisma.project.findFirst({
    where: {
      id: data.projectId,
      organizationId: ctx.organization.id,
    },
  });

  if (!project) {
    return { error: "Project not found in your organization." };
  }

  const existingCount = await prisma.projectBudgetLine.count({
    where: { projectId: project.id },
  });

  const shortPrj = project.code.split("-").pop() || "PRJ";
  const shortCat = data.category.slice(0, 3);
  const finalCode =
    data.code && data.code.trim().length > 0
      ? data.code.trim().toUpperCase()
      : `BDG-${shortPrj}-${shortCat}-${String(existingCount + 1).padStart(2, "0")}`;

  const status = computeBudgetLineStatus(
    data.allocatedBudget,
    data.committedCost,
    data.actualCost,
    data.alertThresholdPct
  );

  await prisma.$transaction(async (tx) => {
    const line = await tx.projectBudgetLine.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        phaseId: data.phaseId || null,
        code: finalCode,
        category: data.category,
        title: data.title,
        description: data.description || null,
        allocatedBudget: data.allocatedBudget,
        committedCost: data.committedCost,
        actualCost: data.actualCost,
        alertThresholdPct: data.alertThresholdPct,
        status,
        notes: data.notes || null,
        updatedById: ctx.user.id,
      },
    });

    await recalculateProjectFinancialRollup(tx, project.id);

    if (status === "EXCEEDED" || status === "OVERRUN_RISK") {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          title:
            status === "EXCEEDED"
              ? `Cost Overrun Flag: ${line.code} (${project.name})`
              : `Budget Threshold Alert: ${line.code} (${project.name})`,
          message: `${line.title} has Committed ${formatCurrency(line.committedCost)} / Actual ${formatCurrency(line.actualCost)} against Allocated Budget ${formatCurrency(line.allocatedBudget)}.`,
          type: status === "EXCEEDED" ? "CRITICAL" : "WARNING",
          category: "BUDGET",
          link: "/finance/budgets",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "BUDGET_LINE_CREATED",
        entity: "ProjectBudgetLine",
        entityId: line.id,
        description: `Created budget line ${line.code} (${data.category}) on ${project.name} — Allocated: ${formatCurrency(data.allocatedBudget)}`,
        newValue: JSON.stringify({
          code: line.code,
          category: line.category,
          allocatedBudget: line.allocatedBudget,
          committedCost: line.committedCost,
          actualCost: line.actualCost,
          status: line.status,
        }),
      },
    });
  });

  revalidatePath("/finance/budgets");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/");

  return { success: true };
}

const updateBudgetLineSchema = z.object({
  budgetLineId: z.string().min(1, "Budget line ID is required"),
  allocatedBudget: z.coerce.number().positive("Allocated budget must be greater than 0"),
  committedCost: z.coerce.number().min(0, "Committed cost cannot be negative"),
  actualCost: z.coerce.number().min(0, "Actual cost cannot be negative"),
  alertThresholdPct: z.coerce.number().min(50).max(100).default(85),
  notes: z.string().optional(),
});

export async function updateBudgetLineCostAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("budgets:manage") &&
    !ctx.can("finance:expenses") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: 'Manage Budgets' capability required.",
    };
  }

  const parsed = updateBudgetLineSchema.safeParse({
    budgetLineId: formData.get("budgetLineId"),
    allocatedBudget: formData.get("allocatedBudget"),
    committedCost: formData.get("committedCost"),
    actualCost: formData.get("actualCost"),
    alertThresholdPct: formData.get("alertThresholdPct") || 85,
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid cost control figures.",
    };
  }

  const data = parsed.data;

  const existing = await prisma.projectBudgetLine.findFirst({
    where: {
      id: data.budgetLineId,
      organizationId: ctx.organization.id,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!existing) {
    return { error: "Budget line not found in your organization." };
  }

  const newStatus = computeBudgetLineStatus(
    data.allocatedBudget,
    data.committedCost,
    data.actualCost,
    data.alertThresholdPct
  );

  await prisma.$transaction(async (tx) => {
    await tx.projectBudgetLine.update({
      where: { id: existing.id },
      data: {
        allocatedBudget: data.allocatedBudget,
        committedCost: data.committedCost,
        actualCost: data.actualCost,
        alertThresholdPct: data.alertThresholdPct,
        status: newStatus,
        notes: data.notes || null,
        updatedById: ctx.user.id,
      },
    });

    await recalculateProjectFinancialRollup(tx, existing.projectId);

    if (
      (newStatus === "EXCEEDED" || newStatus === "OVERRUN_RISK") &&
      existing.status !== newStatus
    ) {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          title:
            newStatus === "EXCEEDED"
              ? `Cost Overrun Alert: ${existing.code} (${existing.project.name})`
              : `Budget Threshold Warning: ${existing.code} (${existing.project.name})`,
          message: `Budget line "${existing.title}" is now ${newStatus.replace("_", " ")} (Committed: ${formatCurrency(data.committedCost)}, Actual: ${formatCurrency(data.actualCost)}, Budget: ${formatCurrency(data.allocatedBudget)}).`,
          type: newStatus === "EXCEEDED" ? "CRITICAL" : "WARNING",
          category: "BUDGET",
          link: "/finance/budgets",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "BUDGET_LINE_UPDATED",
        entity: "ProjectBudgetLine",
        entityId: existing.id,
        description: `Updated cost control for ${existing.code} (${existing.project.name}): Budget ${formatCurrency(data.allocatedBudget)}, Committed ${formatCurrency(data.committedCost)}, Actual ${formatCurrency(data.actualCost)} [${newStatus}]`,
        previousValue: JSON.stringify({
          allocatedBudget: existing.allocatedBudget,
          committedCost: existing.committedCost,
          actualCost: existing.actualCost,
          status: existing.status,
        }),
        newValue: JSON.stringify({
          allocatedBudget: data.allocatedBudget,
          committedCost: data.committedCost,
          actualCost: data.actualCost,
          status: newStatus,
        }),
      },
    });
  });

  revalidatePath("/finance/budgets");
  revalidatePath(`/projects/${existing.projectId}`);
  revalidatePath("/");

  return { success: true };
}

export async function syncBudgetFromBoqAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("budgets:manage") &&
    !ctx.can("boq:manage") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: 'Manage Budgets' capability required.",
    };
  }

  const projectId = String(formData.get("projectId") || "");
  if (!projectId) return { error: "Project selection is required." };

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: ctx.organization.id,
    },
    include: {
      boqItems: true,
      budgetLines: true,
    },
  });

  if (!project) {
    return { error: "Project not found in your organization." };
  }

  if (project.boqItems.length === 0) {
    return {
      error: `No priced BOQ items exist yet for ${project.name}. Add BOQ items first to generate baseline budgets.`,
    };
  }

  // Group BOQ totals by costCategory
  const groupedTotals = new Map<
    string,
    { totalBill: number; totalExecuted: number; itemCount: number }
  >();

  for (const item of project.boqItems) {
    const cat = item.costCategory || "MATERIALS";
    const current = groupedTotals.get(cat) || {
      totalBill: 0,
      totalExecuted: 0,
      itemCount: 0,
    };
    current.totalBill += item.totalAmount;
    current.totalExecuted += item.executedAmount;
    current.itemCount += 1;
    groupedTotals.set(cat, current);
  }

  const shortPrj = project.code.split("-").pop() || "PRJ";

  await prisma.$transaction(async (tx) => {
    for (const [category, stats] of groupedTotals.entries()) {
      const existingLine = project.budgetLines.find(
        (b) => b.category === category
      );
      const catLabel =
        BUDGET_CATEGORY_STYLES[category]?.label || category;

      if (existingLine) {
        const nextBudget = Math.max(existingLine.allocatedBudget, stats.totalBill);
        const nextActual = Math.max(existingLine.actualCost, stats.totalExecuted);
        const nextCommitted = Math.max(existingLine.committedCost, nextActual);
        const nextStatus = computeBudgetLineStatus(
          nextBudget,
          nextCommitted,
          nextActual,
          existingLine.alertThresholdPct
        );

        await tx.projectBudgetLine.update({
          where: { id: existingLine.id },
          data: {
            allocatedBudget: nextBudget,
            committedCost: nextCommitted,
            actualCost: nextActual,
            status: nextStatus,
            updatedById: ctx.user.id,
          },
        });
      } else {
        const code = `BDG-${shortPrj}-${category.slice(0, 3)}`;
        const status = computeBudgetLineStatus(
          stats.totalBill,
          stats.totalExecuted,
          stats.totalExecuted,
          85
        );
        await tx.projectBudgetLine.create({
          data: {
            organizationId: ctx.organization.id,
            projectId: project.id,
            code,
            category,
            title: `${catLabel} — Rolled up from ${stats.itemCount} Priced BOQ Item(s)`,
            description: `Automatically synced from priced Bill of Quantities schedule on ${project.name}.`,
            allocatedBudget: stats.totalBill,
            committedCost: stats.totalExecuted,
            actualCost: stats.totalExecuted,
            alertThresholdPct: 85,
            status,
            updatedById: ctx.user.id,
          },
        });
      }
    }

    await recalculateProjectFinancialRollup(tx, project.id);

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "BUDGET_SYNCED_FROM_BOQ",
        entity: "Project",
        entityId: project.id,
        description: `Synchronized ${groupedTotals.size} budget categories from ${project.boqItems.length} priced BOQ items on ${project.name}`,
      },
    });
  });

  revalidatePath("/finance/boq");
  revalidatePath("/finance/budgets");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/");

  return { success: true };
}
