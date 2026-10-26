"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import {
  computeBudgetLineStatus,
  computeMaterialStockStatus,
} from "@/lib/utils";

function revalidateProcurementPaths(projectId?: string) {
  revalidatePath("/materials");
  revalidatePath("/materials/requests");
  revalidatePath("/materials/stock");
  revalidatePath("/procurement/suppliers");
  revalidatePath("/procurement/purchase-orders");
  revalidatePath("/procurement/receiving");
  revalidatePath("/projects");
  revalidatePath("/");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function createMaterialRequestAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canRequest =
    ctx.can("materials:request") ||
    ctx.can("materials:manage") ||
    ctx.can("procurement:manage") ||
    ctx.can("projects:manage");

  if (!canRequest) {
    return {
      error: "You do not have permission to submit material requests.",
    };
  }

  const projectId = String(formData.get("projectId") || "").trim();
  const siteId = String(formData.get("siteId") || "").trim() || null;
  const phaseId = String(formData.get("phaseId") || "").trim() || null;
  const materialId = String(formData.get("materialId") || "").trim();
  const requestNumber = String(formData.get("requestNumber") || "")
    .trim()
    .toUpperCase();
  const title = String(formData.get("title") || "").trim();
  const requestedQuantity = Number(formData.get("requestedQuantity") || 0);
  const priority = String(formData.get("priority") || "MEDIUM").trim();
  const requiredByDateRaw = String(formData.get("requiredByDate") || "").trim();
  const justification =
    String(formData.get("justification") || "").trim() || null;

  if (
    !projectId ||
    !materialId ||
    !requestNumber ||
    !title ||
    requestedQuantity <= 0
  ) {
    return {
      error:
        "Project, material, request number, title, and a positive requested quantity are required.",
    };
  }

  const [project, material] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    }),
    prisma.material.findFirst({
      where: { id: materialId, organizationId: ctx.organization.id },
    }),
  ]);

  if (!project || !material) {
    return { error: "Selected project or material was not found." };
  }

  const existingReq = await prisma.materialRequest.findUnique({
    where: {
      organizationId_requestNumber: {
        organizationId: ctx.organization.id,
        requestNumber,
      },
    },
  });

  if (existingReq) {
    return {
      error: `Material Request number '${requestNumber}' already exists.`,
    };
  }

  const estimatedUnitCost =
    Number(formData.get("estimatedUnitCost") || 0) || material.standardUnitCost;
  const estimatedTotalCost =
    Math.round(requestedQuantity * estimatedUnitCost * 100) / 100;
  const requiredByDate = requiredByDateRaw
    ? new Date(requiredByDateRaw)
    : new Date(Date.now() + 7 * 86400000);

  await prisma.$transaction(async (tx) => {
    await tx.materialRequest.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        siteId,
        phaseId,
        materialId: material.id,
        requestNumber,
        title,
        requestedQuantity,
        approvedQuantity: 0,
        estimatedUnitCost,
        estimatedTotalCost,
        priority,
        requiredByDate,
        status: "SUBMITTED",
        justification,
        requestedById: ctx.user.id,
      },
    });

    // Update or create ProjectMaterialStock requestedQuantity
    const existingStock = await tx.projectMaterialStock.findUnique({
      where: {
        projectId_materialId: {
          projectId: project.id,
          materialId: material.id,
        },
      },
    });

    if (existingStock) {
      await tx.projectMaterialStock.update({
        where: { id: existingStock.id },
        data: {
          requestedQuantity: existingStock.requestedQuantity + requestedQuantity,
          lastUpdatedById: ctx.user.id,
        },
      });
    } else {
      await tx.projectMaterialStock.create({
        data: {
          organizationId: ctx.organization.id,
          projectId: project.id,
          siteId,
          materialId: material.id,
          requiredQuantity: requestedQuantity,
          requestedQuantity,
          orderedQuantity: 0,
          receivedQuantity: 0,
          usedQuantity: 0,
          wastageQuantity: 0,
          remainingQuantity: 0,
          reorderLevel: material.minimumReorderLevel,
          unitCost: estimatedUnitCost,
          totalCost: 0,
          status: "CRITICAL_SHORTAGE",
          lastUpdatedById: ctx.user.id,
        },
      });
    }

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        title: `New Material Request: ${requestNumber}`,
        message: `${ctx.user.name} requested ${requestedQuantity.toLocaleString()} ${material.unit} of ${material.name} for ${project.name}.`,
        severity: priority === "URGENT" ? "CRITICAL" : "WARNING",
        category: "PROCUREMENT",
        linkUrl: "/materials/requests",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "MATERIAL_REQUEST_SUBMITTED",
        entity: "MaterialRequest",
        entityId: requestNumber,
        details: `Submitted ${requestNumber} for ${requestedQuantity} ${material.unit} of ${material.name} (${project.code}).`,
      },
    });
  });

  revalidateProcurementPaths(project.id);
  return { success: true };
}

export async function reviewMaterialRequestAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canApprove =
    ctx.can("materials:approve") ||
    ctx.can("procurement:manage") ||
    ctx.can("projects:manage");

  if (!canApprove) {
    return {
      error: "You do not have permission to approve or reject material requests.",
    };
  }

  const requestId = String(formData.get("requestId") || "").trim();
  const decision = String(formData.get("decision") || "APPROVED").trim(); // APPROVED, REJECTED, CANCELLED
  const approvedQuantityRaw = Number(formData.get("approvedQuantity") || 0);
  const approvalNotes =
    String(formData.get("approvalNotes") || "").trim() || null;

  const mr = await prisma.materialRequest.findFirst({
    where: { id: requestId, organizationId: ctx.organization.id },
    include: { material: true, project: true },
  });

  if (!mr) {
    return { error: "Material Request not found." };
  }

  const approvedQuantity =
    decision === "APPROVED"
      ? approvedQuantityRaw > 0
        ? approvedQuantityRaw
        : mr.requestedQuantity
      : 0;

  await prisma.$transaction(async (tx) => {
    await tx.materialRequest.update({
      where: { id: mr.id },
      data: {
        status: decision,
        approvedQuantity,
        estimatedTotalCost:
          decision === "APPROVED"
            ? approvedQuantity * mr.estimatedUnitCost
            : mr.estimatedTotalCost,
        approvalNotes,
        approvedById: ctx.user.id,
        approvedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        title: `Material Request ${decision}: ${mr.requestNumber}`,
        message: `${mr.requestNumber} (${mr.material.name}) for ${mr.project.name} was ${decision.toLowerCase()} by ${ctx.user.name}.`,
        severity: decision === "REJECTED" ? "WARNING" : "INFO",
        category: "PROCUREMENT",
        linkUrl: "/materials/requests",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: `MATERIAL_REQUEST_${decision}`,
        entity: "MaterialRequest",
        entityId: mr.id,
        details: `${decision} ${mr.requestNumber} (Approved Qty: ${approvedQuantity} ${mr.material.unit}).`,
      },
    });
  });

  revalidateProcurementPaths(mr.projectId);
  return { success: true };
}

export async function createPurchaseOrderAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canProcure =
    ctx.can("procurement:manage") || ctx.can("projects:manage");
  if (!canProcure) {
    return {
      error: "You do not have permission to issue Purchase Orders.",
    };
  }

  const poNumber = String(formData.get("poNumber") || "")
    .trim()
    .toUpperCase();
  const projectId = String(formData.get("projectId") || "").trim();
  const siteId = String(formData.get("siteId") || "").trim() || null;
  const supplierId = String(formData.get("supplierId") || "").trim();
  const materialId = String(formData.get("materialId") || "").trim();
  const materialRequestId =
    String(formData.get("materialRequestId") || "").trim() || null;
  const quotationReference =
    String(formData.get("quotationReference") || "").trim() || null;
  const orderedQuantity = Number(formData.get("orderedQuantity") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const discountAmount = Math.max(0, Number(formData.get("discountAmount") || 0));
  const taxRatePct = Math.max(0, Number(formData.get("taxRatePct") ?? 16));
  const paymentTerms =
    String(formData.get("paymentTerms") || "Net 30 Days").trim();
  const expectedDeliveryDateRaw = String(
    formData.get("expectedDeliveryDate") || ""
  ).trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (
    !poNumber ||
    !projectId ||
    !supplierId ||
    !materialId ||
    orderedQuantity <= 0 ||
    unitPrice <= 0
  ) {
    return {
      error:
        "PO Number, Project, Supplier, Material, Ordered Quantity, and Unit Price are required.",
    };
  }

  const [project, supplier, material] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    }),
    prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: ctx.organization.id },
    }),
    prisma.material.findFirst({
      where: { id: materialId, organizationId: ctx.organization.id },
    }),
  ]);

  if (!project || !supplier || !material) {
    return { error: "Selected project, supplier, or material was not found." };
  }

  const existingPo = await prisma.purchaseOrder.findUnique({
    where: {
      organizationId_poNumber: {
        organizationId: ctx.organization.id,
        poNumber,
      },
    },
  });

  if (existingPo) {
    return { error: `Purchase Order '${poNumber}' already exists.` };
  }

  // Server-side financial calculations
  const grossAmount = orderedQuantity * unitPrice;
  const subtotalAmount = Math.max(
    0,
    Math.round((grossAmount - discountAmount) * 100) / 100
  );
  const taxAmount = Math.round(subtotalAmount * (taxRatePct / 100) * 100) / 100;
  const totalAmount = Math.round((subtotalAmount + taxAmount) * 100) / 100;
  const expectedDeliveryDate = expectedDeliveryDateRaw
    ? new Date(expectedDeliveryDateRaw)
    : new Date(Date.now() + 5 * 86400000);

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        siteId,
        supplierId: supplier.id,
        materialId: material.id,
        materialRequestId,
        poNumber,
        quotationReference,
        orderedQuantity,
        receivedQuantity: 0,
        unitPrice,
        discountAmount,
        taxRatePct,
        subtotalAmount,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        paymentTerms,
        expectedDeliveryDate,
        status: "APPROVED",
        notes,
        createdById: ctx.user.id,
        approvedById: ctx.user.id,
        approvedAt: new Date(),
      },
    });

    // If linked to a MaterialRequest, transition status to ORDERED
    if (materialRequestId) {
      await tx.materialRequest.updateMany({
        where: {
          id: materialRequestId,
          organizationId: ctx.organization.id,
        },
        data: {
          status: "ORDERED",
        },
      });
    }

    // Update or create ProjectMaterialStock orderedQuantity
    const existingStock = await tx.projectMaterialStock.findUnique({
      where: {
        projectId_materialId: {
          projectId: project.id,
          materialId: material.id,
        },
      },
    });

    if (existingStock) {
      await tx.projectMaterialStock.update({
        where: { id: existingStock.id },
        data: {
          orderedQuantity: existingStock.orderedQuantity + orderedQuantity,
          unitCost: unitPrice,
          lastUpdatedById: ctx.user.id,
        },
      });
    } else {
      await tx.projectMaterialStock.create({
        data: {
          organizationId: ctx.organization.id,
          projectId: project.id,
          siteId,
          materialId: material.id,
          requiredQuantity: orderedQuantity,
          requestedQuantity: orderedQuantity,
          orderedQuantity,
          receivedQuantity: 0,
          usedQuantity: 0,
          wastageQuantity: 0,
          remainingQuantity: 0,
          reorderLevel: material.minimumReorderLevel,
          unitCost: unitPrice,
          totalCost: 0,
          status: "LOW_STOCK",
          lastUpdatedById: ctx.user.id,
        },
      });
    }

    // Increment Supplier totalPurchased and outstandingBalance
    const newSupplierPurchased = supplier.totalPurchased + totalAmount;
    const newSupplierBalance = Math.max(
      0,
      newSupplierPurchased - supplier.totalPaid
    );
    await tx.supplier.update({
      where: { id: supplier.id },
      data: {
        totalPurchased: newSupplierPurchased,
        outstandingBalance: newSupplierBalance,
      },
    });

    // Increment Project MATERIALS BudgetLine committedCost & Project committedCost
    const matBudgetLine = await tx.projectBudgetLine.findFirst({
      where: {
        projectId: project.id,
        category: "MATERIALS",
      },
    });

    if (matBudgetLine) {
      const nextCommitted = matBudgetLine.committedCost + subtotalAmount;
      const nextStatus = computeBudgetLineStatus(
        matBudgetLine.allocatedBudget,
        nextCommitted,
        matBudgetLine.actualCost,
        matBudgetLine.alertThresholdPct
      );
      await tx.projectBudgetLine.update({
        where: { id: matBudgetLine.id },
        data: {
          committedCost: nextCommitted,
          status: nextStatus,
          updatedById: ctx.user.id,
        },
      });
    }

    await tx.project.update({
      where: { id: project.id },
      data: {
        committedCost: project.committedCost + subtotalAmount,
      },
    });

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        title: `Purchase Order Issued: ${poNumber}`,
        message: `LPO ${poNumber} issued to ${supplier.name} for ${orderedQuantity.toLocaleString()} ${material.unit} of ${material.name} (${ctx.organization.currency} ${totalAmount.toLocaleString()}).`,
        severity: "INFO",
        category: "PROCUREMENT",
        linkUrl: "/procurement/purchase-orders",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PURCHASE_ORDER_CREATED",
        entity: "PurchaseOrder",
        entityId: poNumber,
        details: `Issued ${poNumber} to ${supplier.name} for ${orderedQuantity} ${material.unit} of ${material.name}. Total: ${ctx.organization.currency} ${totalAmount.toLocaleString()}.`,
      },
    });
  });

  revalidateProcurementPaths(project.id);
  return { success: true };
}

export async function updatePurchaseOrderPaymentAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("procurement:manage") ||
    ctx.can("payments:manage") ||
    ctx.can("projects:manage");

  if (!canManage) {
    return {
      error: "You do not have permission to update Purchase Order payments.",
    };
  }

  const purchaseOrderId = String(formData.get("purchaseOrderId") || "").trim();
  const additionalPayment = Math.max(
    0,
    Number(formData.get("additionalPayment") || 0)
  );
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, organizationId: ctx.organization.id },
    include: { supplier: true },
  });

  if (!po) {
    return { error: "Purchase Order not found." };
  }

  const nextPaidAmount = Math.min(
    po.totalAmount,
    Math.round((po.paidAmount + additionalPayment) * 100) / 100
  );
  const actualDeltaPaid = Math.max(0, nextPaidAmount - po.paidAmount);
  const nextStatus =
    nextPaidAmount >= po.totalAmount && po.receivedQuantity >= po.orderedQuantity
      ? "PAID"
      : status || po.status;

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        paidAmount: nextPaidAmount,
        status: nextStatus,
        notes: notes ?? po.notes,
      },
    });

    if (actualDeltaPaid > 0) {
      const nextSupplierPaid = po.supplier.totalPaid + actualDeltaPaid;
      const nextSupplierBalance = Math.max(
        0,
        po.supplier.totalPurchased - nextSupplierPaid
      );
      await tx.supplier.update({
        where: { id: po.supplierId },
        data: {
          totalPaid: nextSupplierPaid,
          outstandingBalance: nextSupplierBalance,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "PURCHASE_ORDER_UPDATED",
        entity: "PurchaseOrder",
        entityId: po.poNumber,
        details: `Updated ${po.poNumber} (Status: ${nextStatus}, Paid: ${ctx.organization.currency} ${nextPaidAmount.toLocaleString()}).`,
      },
    });
  });

  revalidateProcurementPaths(po.projectId);
  return { success: true };
}

export async function recordGoodsReceivedNoteAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canReceive =
    ctx.can("materials:receive") ||
    ctx.can("materials:manage") ||
    ctx.can("procurement:manage") ||
    ctx.can("projects:manage");

  if (!canReceive) {
    return {
      error: "You do not have permission to record Goods Received Notes.",
    };
  }

  const purchaseOrderId = String(formData.get("purchaseOrderId") || "").trim();
  const grnNumber = String(formData.get("grnNumber") || "")
    .trim()
    .toUpperCase();
  const receivedQuantity = Math.max(
    0,
    Number(formData.get("receivedQuantity") || 0)
  );
  const damagedQuantity = Math.max(
    0,
    Number(formData.get("damagedQuantity") || 0)
  );
  const missingQuantity = Math.max(
    0,
    Number(formData.get("missingQuantity") || 0)
  );
  const deliveryNoteNumber = String(
    formData.get("deliveryNoteNumber") || ""
  ).trim();
  const vehicleRegNumber =
    String(formData.get("vehicleRegNumber") || "").trim() || null;
  const deliveryDateRaw = String(formData.get("deliveryDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!purchaseOrderId || !grnNumber || !deliveryNoteNumber) {
    return {
      error:
        "Purchase Order, GRN Number, and Supplier Delivery Note Number are required.",
    };
  }

  if (receivedQuantity <= 0 && damagedQuantity <= 0) {
    return {
      error:
        "Please enter a positive received or damaged quantity for this delivery.",
    };
  }

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, organizationId: ctx.organization.id },
    include: {
      project: true,
      supplier: true,
      material: true,
    },
  });

  if (!po) {
    return { error: "Purchase Order not found." };
  }

  const existingGrn = await prisma.goodsReceivedNote.findUnique({
    where: {
      organizationId_grnNumber: {
        organizationId: ctx.organization.id,
        grnNumber,
      },
    },
  });

  if (existingGrn) {
    return { error: `GRN Number '${grnNumber}' already exists.` };
  }

  const inspectionStatus =
    receivedQuantity <= 0 && damagedQuantity > 0
      ? "REJECTED_DAMAGED"
      : damagedQuantity > 0 || missingQuantity > 0
        ? "PARTIAL_ACCEPTANCE"
        : "ACCEPTED";

  const acceptedValue = Math.round(receivedQuantity * po.unitPrice * 100) / 100;
  const deliveryDate = deliveryDateRaw ? new Date(deliveryDateRaw) : new Date();

  await prisma.$transaction(async (tx) => {
    // 1. Create GoodsReceivedNote
    await tx.goodsReceivedNote.create({
      data: {
        organizationId: ctx.organization.id,
        purchaseOrderId: po.id,
        projectId: po.projectId,
        siteId: po.siteId,
        supplierId: po.supplierId,
        materialId: po.materialId,
        grnNumber,
        orderedQuantity: po.orderedQuantity,
        receivedQuantity,
        damagedQuantity,
        missingQuantity,
        unitCost: po.unitPrice,
        acceptedValue,
        deliveryNoteNumber,
        vehicleRegNumber,
        deliveryDate,
        inspectionStatus,
        notes,
        receivedById: ctx.user.id,
      },
    });

    // 2. Update PurchaseOrder receivedQuantity & status
    const nextPoReceived =
      Math.round((po.receivedQuantity + receivedQuantity) * 100) / 100;
    const nextPoStatus =
      nextPoReceived >= po.orderedQuantity
        ? po.paidAmount >= po.totalAmount
          ? "PAID"
          : "DELIVERED"
        : nextPoReceived > 0
          ? "PARTIALLY_DELIVERED"
          : po.status;

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        receivedQuantity: nextPoReceived,
        status: nextPoStatus,
      },
    });

    // 3. If PO is linked to a MaterialRequest, update MaterialRequest status
    if (po.materialRequestId && receivedQuantity > 0) {
      await tx.materialRequest.updateMany({
        where: {
          id: po.materialRequestId,
          organizationId: ctx.organization.id,
        },
        data: {
          status:
            nextPoReceived >= po.orderedQuantity
              ? "RECEIVED"
              : "PARTIALLY_RECEIVED",
        },
      });
    }

    // 4. Update Site Inventory (ProjectMaterialStock) & create MaterialUsageLog
    if (receivedQuantity > 0) {
      let stock = await tx.projectMaterialStock.findUnique({
        where: {
          projectId_materialId: {
            projectId: po.projectId,
            materialId: po.materialId,
          },
        },
      });

      if (stock) {
        const nextReceived =
          Math.round((stock.receivedQuantity + receivedQuantity) * 100) / 100;
        const nextRemaining = Math.max(
          0,
          Math.round(
            (nextReceived - stock.usedQuantity - stock.wastageQuantity) * 100
          ) / 100
        );
        const nextStatus = computeMaterialStockStatus(
          nextRemaining,
          stock.reorderLevel,
          stock.requiredQuantity,
          nextReceived
        );

        stock = await tx.projectMaterialStock.update({
          where: { id: stock.id },
          data: {
            receivedQuantity: nextReceived,
            remainingQuantity: nextRemaining,
            unitCost: po.unitPrice,
            totalCost: Math.round(nextReceived * po.unitPrice * 100) / 100,
            status: nextStatus,
            lastUpdatedById: ctx.user.id,
          },
        });
      } else {
        stock = await tx.projectMaterialStock.create({
          data: {
            organizationId: ctx.organization.id,
            projectId: po.projectId,
            siteId: po.siteId,
            materialId: po.materialId,
            requiredQuantity: po.orderedQuantity,
            requestedQuantity: po.orderedQuantity,
            orderedQuantity: po.orderedQuantity,
            receivedQuantity,
            usedQuantity: 0,
            wastageQuantity: 0,
            remainingQuantity: receivedQuantity,
            reorderLevel: po.material.minimumReorderLevel,
            unitCost: po.unitPrice,
            totalCost: acceptedValue,
            status: "ADEQUATE",
            lastUpdatedById: ctx.user.id,
          },
        });
      }

      // Create automatic MaterialUsageLog entry for the site store ledger
      await tx.materialUsageLog.create({
        data: {
          organizationId: ctx.organization.id,
          projectMaterialStockId: stock.id,
          projectId: po.projectId,
          siteId: po.siteId,
          materialId: po.materialId,
          transactionType: "DELIVERY_RECEIVED",
          quantity: receivedQuantity,
          unitCost: po.unitPrice,
          totalCost: acceptedValue,
          workAreaOrPhase: `GRN ${grnNumber} (${po.supplier.name})`,
          referenceNumber: `${grnNumber} / ${deliveryNoteNumber}`,
          notes:
            damagedQuantity > 0
              ? `Accepted ${receivedQuantity} ${po.material.unit}; rejected ${damagedQuantity} damaged at gate.`
              : `Received via LPO ${po.poNumber} (${vehicleRegNumber || "Site Delivery"}).`,
          recordedById: ctx.user.id,
        },
      });
    }

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        title: `Goods Received Note Logged: ${grnNumber}`,
        message: `Received ${receivedQuantity.toLocaleString()} ${po.material.unit} of ${po.material.name} at ${po.project.name} against ${po.poNumber}${damagedQuantity > 0 ? ` (${damagedQuantity} damaged rejected)` : ""}.`,
        severity: damagedQuantity > 0 ? "WARNING" : "INFO",
        category: "PROCUREMENT",
        linkUrl: "/procurement/receiving",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "GOODS_RECEIVED_NOTE_LOGGED",
        entity: "GoodsReceivedNote",
        entityId: grnNumber,
        details: `Logged ${grnNumber} against ${po.poNumber}: Received ${receivedQuantity} ${po.material.unit}, Damaged ${damagedQuantity}, Missing ${missingQuantity}.`,
      },
    });
  });

  revalidateProcurementPaths(po.projectId);
  return { success: true };
}
