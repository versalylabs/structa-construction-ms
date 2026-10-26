"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { computeMaterialStockStatus, formatCurrency } from "@/lib/utils";

const SUPPLIER_CATEGORIES = [
  "CEMENT_CONCRETE",
  "STEEL_METALS",
  "AGGREGATES_QUARRY",
  "TIMBER_ROOFING",
  "TILES_FINISHES",
  "PAINTS_CHEMICALS",
  "ELECTRICAL_MEP",
  "PLUMBING_WATER",
  "GENERAL_HARDWARE",
] as const;

const MATERIAL_CATEGORIES = [
  "CEMENT_BINDERS",
  "STEEL_REBAR",
  "AGGREGATES_SAND",
  "MASONRY_BLOCKS",
  "TIMBER_FORMWORK",
  "ROOFING_WATERPROOFING",
  "TILES_FINISHES",
  "PAINTS_COATINGS",
  "PLUMBING_PIPES",
  "ELECTRICAL_CABLES",
] as const;

const createSupplierSchema = z.object({
  name: z.string().min(2, "Supplier company name is required"),
  code: z.string().optional(),
  category: z.enum(SUPPLIER_CATEGORIES).default("CEMENT_CONCRETE"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Valid supplier email is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  taxPin: z.string().optional(),
  paymentTerms: z.string().default("Net 30 Days"),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  mpesaPaybill: z.string().optional(),
  suppliedMaterials: z.string().min(3, "Supplied materials summary is required"),
  notes: z.string().optional(),
});

export async function createSupplierAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("procurement:po_manage") &&
    !ctx.can("materials:manage") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: Procurement or Materials management capability required.",
    };
  }

  const parsed = createSupplierSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || "",
    category: formData.get("category") || "CEMENT_CONCRETE",
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address") || "",
    city: formData.get("city") || "Nairobi",
    taxPin: formData.get("taxPin") || "",
    paymentTerms: formData.get("paymentTerms") || "Net 30 Days",
    bankName: formData.get("bankName") || "",
    bankAccountNumber: formData.get("bankAccountNumber") || "",
    mpesaPaybill: formData.get("mpesaPaybill") || "",
    suppliedMaterials: formData.get("suppliedMaterials"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid supplier details.",
    };
  }

  const data = parsed.data;
  const count = await prisma.supplier.count({
    where: { organizationId: ctx.organization.id },
  });

  const finalCode =
    data.code && data.code.trim().length > 0
      ? data.code.trim().toUpperCase()
      : `SUP-${String(count + 1).padStart(3, "0")}`;

  const existing = await prisma.supplier.findFirst({
    where: {
      organizationId: ctx.organization.id,
      code: finalCode,
    },
  });

  if (existing) {
    return { error: `Supplier code "${finalCode}" already exists.` };
  }

  await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        organizationId: ctx.organization.id,
        code: finalCode,
        name: data.name,
        category: data.category,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address || null,
        city: data.city || "Nairobi",
        taxPin: data.taxPin || null,
        paymentTerms: data.paymentTerms,
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        mpesaPaybill: data.mpesaPaybill || null,
        suppliedMaterials: data.suppliedMaterials,
        notes: data.notes || null,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SUPPLIER_CREATED",
        entity: "Supplier",
        entityId: supplier.id,
        description: `Registered construction supplier ${supplier.code} — ${supplier.name} (${supplier.category})`,
        newValue: JSON.stringify({
          code: supplier.code,
          name: supplier.name,
          category: supplier.category,
          paymentTerms: supplier.paymentTerms,
        }),
      },
    });
  });

  revalidatePath("/procurement/suppliers");
  revalidatePath("/materials");

  return { success: true };
}

const updateSupplierSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  status: z.enum(["ACTIVE", "ON_HOLD", "BLACKLISTED"]).default("ACTIVE"),
  paymentTerms: z.string().min(2),
  totalPurchased: z.coerce.number().min(0),
  totalPaid: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function updateSupplierLedgerAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("procurement:po_manage") &&
    !ctx.can("finance:payments") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: Procurement or Finance capability required.",
    };
  }

  const parsed = updateSupplierSchema.safeParse({
    supplierId: formData.get("supplierId"),
    status: formData.get("status") || "ACTIVE",
    paymentTerms: formData.get("paymentTerms") || "Net 30 Days",
    totalPurchased: formData.get("totalPurchased"),
    totalPaid: formData.get("totalPaid"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid supplier account figures.",
    };
  }

  const data = parsed.data;
  const existing = await prisma.supplier.findFirst({
    where: {
      id: data.supplierId,
      organizationId: ctx.organization.id,
    },
  });

  if (!existing) {
    return { error: "Supplier not found in your organization." };
  }

  const outstandingBalance = Math.max(0, data.totalPurchased - data.totalPaid);

  await prisma.$transaction(async (tx) => {
    await tx.supplier.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        paymentTerms: data.paymentTerms,
        totalPurchased: data.totalPurchased,
        totalPaid: data.totalPaid,
        outstandingBalance,
        notes: data.notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SUPPLIER_UPDATED",
        entity: "Supplier",
        entityId: existing.id,
        description: `Updated supplier ledger for ${existing.name} (${existing.code}) — Purchased: ${formatCurrency(data.totalPurchased)}, Paid: ${formatCurrency(data.totalPaid)}, Balance: ${formatCurrency(outstandingBalance)}`,
        previousValue: JSON.stringify({
          status: existing.status,
          totalPurchased: existing.totalPurchased,
          totalPaid: existing.totalPaid,
          outstandingBalance: existing.outstandingBalance,
        }),
        newValue: JSON.stringify({
          status: data.status,
          totalPurchased: data.totalPurchased,
          totalPaid: data.totalPaid,
          outstandingBalance,
        }),
      },
    });
  });

  revalidatePath("/procurement/suppliers");
  return { success: true };
}

const createMaterialSchema = z.object({
  name: z.string().min(3, "Material name is required"),
  code: z.string().optional(),
  category: z.enum(MATERIAL_CATEGORIES).default("CEMENT_BINDERS"),
  unit: z.string().min(1, "Unit of measurement is required"),
  standardUnitCost: z.coerce.number().positive("Standard unit rate must be > 0"),
  minimumReorderLevel: z.coerce.number().min(0).default(50),
  specification: z.string().optional(),
  preferredSupplierId: z.string().optional(),
});

export async function createMaterialCatalogItemAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("materials:manage") &&
    !ctx.can("procurement:po_manage") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: 'Manage Material Stock & Catalog' capability required.",
    };
  }

  const parsed = createMaterialSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || "",
    category: formData.get("category") || "CEMENT_BINDERS",
    unit: formData.get("unit") || "Bags",
    standardUnitCost: formData.get("standardUnitCost"),
    minimumReorderLevel: formData.get("minimumReorderLevel") || 50,
    specification: formData.get("specification") || "",
    preferredSupplierId: formData.get("preferredSupplierId") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid material catalog data.",
    };
  }

  const data = parsed.data;
  const count = await prisma.material.count({
    where: { organizationId: ctx.organization.id },
  });

  const catPrefix = data.category.slice(0, 3);
  const finalCode =
    data.code && data.code.trim().length > 0
      ? data.code.trim().toUpperCase()
      : `MAT-${catPrefix}-${String(count + 1).padStart(3, "0")}`;

  const duplicate = await prisma.material.findFirst({
    where: {
      organizationId: ctx.organization.id,
      code: finalCode,
    },
  });

  if (duplicate) {
    return { error: `Material code "${finalCode}" already exists in catalog.` };
  }

  await prisma.$transaction(async (tx) => {
    const mat = await tx.material.create({
      data: {
        organizationId: ctx.organization.id,
        code: finalCode,
        name: data.name,
        category: data.category,
        unit: data.unit,
        standardUnitCost: data.standardUnitCost,
        minimumReorderLevel: data.minimumReorderLevel,
        specification: data.specification || null,
        preferredSupplierId: data.preferredSupplierId || null,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "MATERIAL_CATALOG_CREATED",
        entity: "Material",
        entityId: mat.id,
        description: `Added material ${mat.code} (${mat.name}) to master catalog @ ${formatCurrency(mat.standardUnitCost)}/${mat.unit}`,
        newValue: JSON.stringify({
          code: mat.code,
          name: mat.name,
          unit: mat.unit,
          standardUnitCost: mat.standardUnitCost,
        }),
      },
    });
  });

  revalidatePath("/materials");
  revalidatePath("/materials/stock");

  return { success: true };
}

const assignMaterialStockSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  siteId: z.string().optional(),
  materialId: z.string().min(1, "Material selection is required"),
  requiredQuantity: z.coerce.number().positive("Required quantity must be > 0"),
  requestedQuantity: z.coerce.number().min(0).default(0),
  orderedQuantity: z.coerce.number().min(0).default(0),
  receivedQuantity: z.coerce.number().min(0).default(0),
  usedQuantity: z.coerce.number().min(0).default(0),
  wastageQuantity: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(25),
  unitCost: z.coerce.number().positive("Unit cost must be > 0"),
  notes: z.string().optional(),
});

export async function assignProjectMaterialRequirementAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("materials:manage") &&
    !ctx.can("materials:request") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: Materials management capability required.",
    };
  }

  const parsed = assignMaterialStockSchema.safeParse({
    projectId: formData.get("projectId"),
    siteId: formData.get("siteId") || "",
    materialId: formData.get("materialId"),
    requiredQuantity: formData.get("requiredQuantity"),
    requestedQuantity: formData.get("requestedQuantity") || 0,
    orderedQuantity: formData.get("orderedQuantity") || 0,
    receivedQuantity: formData.get("receivedQuantity") || 0,
    usedQuantity: formData.get("usedQuantity") || 0,
    wastageQuantity: formData.get("wastageQuantity") || 0,
    reorderLevel: formData.get("reorderLevel") || 25,
    unitCost: formData.get("unitCost"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid material requirement fields.",
    };
  }

  const data = parsed.data;

  const [project, material] = await Promise.all([
    prisma.project.findFirst({
      where: { id: data.projectId, organizationId: ctx.organization.id },
      include: { sites: true },
    }),
    prisma.material.findFirst({
      where: { id: data.materialId, organizationId: ctx.organization.id },
    }),
  ]);

  if (!project || !material) {
    return { error: "Project or Material was not found in your organization." };
  }

  const remainingQuantity =
    Math.round(
      Math.max(
        0,
        data.receivedQuantity - data.usedQuantity - data.wastageQuantity
      ) * 100
    ) / 100;
  const totalCost = Math.round(data.receivedQuantity * data.unitCost * 100) / 100;
  const status = computeMaterialStockStatus(
    remainingQuantity,
    data.reorderLevel,
    data.requiredQuantity,
    data.receivedQuantity
  );

  const targetSiteId = data.siteId || project.sites[0]?.id || null;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.projectMaterialStock.findUnique({
      where: {
        projectId_materialId: {
          projectId: project.id,
          materialId: material.id,
        },
      },
    });

    if (existing) {
      await tx.projectMaterialStock.update({
        where: { id: existing.id },
        data: {
          siteId: targetSiteId,
          requiredQuantity: data.requiredQuantity,
          requestedQuantity: data.requestedQuantity,
          orderedQuantity: data.orderedQuantity,
          receivedQuantity: data.receivedQuantity,
          usedQuantity: data.usedQuantity,
          wastageQuantity: data.wastageQuantity,
          remainingQuantity,
          reorderLevel: data.reorderLevel,
          unitCost: data.unitCost,
          totalCost,
          status,
          notes: data.notes || null,
          lastUpdatedById: ctx.user.id,
        },
      });
    } else {
      await tx.projectMaterialStock.create({
        data: {
          organizationId: ctx.organization.id,
          projectId: project.id,
          siteId: targetSiteId,
          materialId: material.id,
          requiredQuantity: data.requiredQuantity,
          requestedQuantity: data.requestedQuantity,
          orderedQuantity: data.orderedQuantity,
          receivedQuantity: data.receivedQuantity,
          usedQuantity: data.usedQuantity,
          wastageQuantity: data.wastageQuantity,
          remainingQuantity,
          reorderLevel: data.reorderLevel,
          unitCost: data.unitCost,
          totalCost,
          status,
          notes: data.notes || null,
          lastUpdatedById: ctx.user.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PROJECT_MATERIAL_ASSIGNED",
        entity: "ProjectMaterialStock",
        entityId: project.id,
        description: `Set project material requirement for ${material.name} on ${project.name}: Required ${data.requiredQuantity} ${material.unit}, Remaining Site Stock ${remainingQuantity} ${material.unit}`,
      },
    });
  });

  revalidatePath("/materials");
  revalidatePath("/materials/stock");
  revalidatePath(`/projects/${project.id}`);

  return { success: true };
}

const recordMovementSchema = z.object({
  stockId: z.string().min(1, "Site stock item is required"),
  transactionType: z.enum([
    "ISSUE_TO_WORKS",
    "DELIVERY_RECEIVED",
    "WASTAGE_LOGGED",
  ]),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  workAreaOrPhase: z.string().min(2, "Work area or store location is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordSiteMaterialMovementAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (
    !ctx.can("materials:manage") &&
    !ctx.can("site_reports:submit") &&
    !ctx.can("projects:manage")
  ) {
    return {
      error: "Permission denied: Site Store / Materials capability required.",
    };
  }

  const parsed = recordMovementSchema.safeParse({
    stockId: formData.get("stockId"),
    transactionType: formData.get("transactionType") || "ISSUE_TO_WORKS",
    quantity: formData.get("quantity"),
    workAreaOrPhase: formData.get("workAreaOrPhase"),
    referenceNumber: formData.get("referenceNumber") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid site store transaction.",
    };
  }

  const data = parsed.data;

  const stock = await prisma.projectMaterialStock.findFirst({
    where: {
      id: data.stockId,
      organizationId: ctx.organization.id,
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      material: { select: { id: true, name: true, code: true, unit: true } },
    },
  });

  if (!stock) {
    return { error: "Site stock record not found in your organization." };
  }

  // Validate available remaining stock when issuing to works or logging wastage
  if (
    (data.transactionType === "ISSUE_TO_WORKS" ||
      data.transactionType === "WASTAGE_LOGGED") &&
    data.quantity > stock.remainingQuantity
  ) {
    return {
      error: `Insufficient site store stock: Only ${stock.remainingQuantity.toLocaleString()} ${stock.material.unit} of "${stock.material.name}" is currently available on site.`,
    };
  }

  let nextReceived = stock.receivedQuantity;
  let nextUsed = stock.usedQuantity;
  let nextWastage = stock.wastageQuantity;

  if (data.transactionType === "DELIVERY_RECEIVED") {
    nextReceived += data.quantity;
  } else if (data.transactionType === "ISSUE_TO_WORKS") {
    nextUsed += data.quantity;
  } else if (data.transactionType === "WASTAGE_LOGGED") {
    nextWastage += data.quantity;
  }

  const nextRemaining =
    Math.round(Math.max(0, nextReceived - nextUsed - nextWastage) * 100) / 100;
  const nextTotalCost = Math.round(nextReceived * stock.unitCost * 100) / 100;
  const nextStatus = computeMaterialStockStatus(
    nextRemaining,
    stock.reorderLevel,
    stock.requiredQuantity,
    nextReceived
  );

  const txCost = Math.round(data.quantity * stock.unitCost * 100) / 100;

  await prisma.$transaction(async (tx) => {
    await tx.projectMaterialStock.update({
      where: { id: stock.id },
      data: {
        receivedQuantity: nextReceived,
        usedQuantity: nextUsed,
        wastageQuantity: nextWastage,
        remainingQuantity: nextRemaining,
        totalCost: nextTotalCost,
        status: nextStatus,
        lastUpdatedById: ctx.user.id,
      },
    });

    await tx.materialUsageLog.create({
      data: {
        organizationId: ctx.organization.id,
        projectMaterialStockId: stock.id,
        projectId: stock.projectId,
        siteId: stock.siteId,
        materialId: stock.materialId,
        transactionType: data.transactionType,
        quantity: data.quantity,
        unitCost: stock.unitCost,
        totalCost: txCost,
        workAreaOrPhase: data.workAreaOrPhase,
        referenceNumber:
          data.referenceNumber ||
          `STR-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: data.notes || null,
        recordedById: ctx.user.id,
      },
    });

    if (
      (nextStatus === "LOW_STOCK" || nextStatus === "CRITICAL_SHORTAGE") &&
      stock.status !== nextStatus
    ) {
      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          title:
            nextStatus === "CRITICAL_SHORTAGE"
              ? `Critical Material Shortage: ${stock.material.name}`
              : `Low Site Stock Reorder Alert: ${stock.material.name}`,
          message: `${stock.project.name} site store has ${nextRemaining} ${stock.material.unit} remaining (Reorder level: ${stock.reorderLevel} ${stock.material.unit}).`,
          type: nextStatus === "CRITICAL_SHORTAGE" ? "CRITICAL" : "WARNING",
          category: "SITE",
          link: "/materials/stock",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: `MATERIAL_${data.transactionType}`,
        entity: "ProjectMaterialStock",
        entityId: stock.id,
        description: `${data.transactionType.replace(/_/g, " ")}: ${data.quantity} ${stock.material.unit} of ${stock.material.name} on ${stock.project.name} (${data.workAreaOrPhase}). Remaining store balance: ${nextRemaining} ${stock.material.unit}.`,
        previousValue: JSON.stringify({
          receivedQuantity: stock.receivedQuantity,
          usedQuantity: stock.usedQuantity,
          wastageQuantity: stock.wastageQuantity,
          remainingQuantity: stock.remainingQuantity,
        }),
        newValue: JSON.stringify({
          receivedQuantity: nextReceived,
          usedQuantity: nextUsed,
          wastageQuantity: nextWastage,
          remainingQuantity: nextRemaining,
          status: nextStatus,
        }),
      },
    });
  });

  revalidatePath("/materials/stock");
  revalidatePath("/materials");
  revalidatePath(`/projects/${stock.projectId}`);
  revalidatePath("/");

  return { success: true };
}
