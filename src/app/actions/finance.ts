"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";

export async function createProjectExpenseAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const siteId = String(formData.get("siteId") || "").trim() || null;
  const phaseId = String(formData.get("phaseId") || "").trim() || null;
  const category = String(formData.get("category") || "MATERIALS").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const vendorOrPayee = String(formData.get("vendorOrPayee") || "").trim();
  const amount = Math.max(0, Number(formData.get("amount") || 0));
  const includeVat = formData.get("includeVat") === "true";
  const taxAmount = includeVat
    ? Math.round(amount * 0.16)
    : Math.max(0, Number(formData.get("taxAmount") || 0));
  const totalAmount = amount + taxAmount;
  const expenseDateRaw = String(formData.get("expenseDate") || "").trim();
  const paymentMethod = String(
    formData.get("paymentMethod") || "MPESA_PAYBILL"
  ).trim();
  const paymentReference =
    String(formData.get("paymentReference") || "").trim() || "SITE-VOUCHER";
  const receiptAttachmentLabel =
    String(formData.get("receiptAttachmentLabel") || "").trim() || null;
  const status = String(formData.get("status") || "APPROVED_PAID").trim();

  if (!projectId || !title || !vendorOrPayee || amount <= 0) {
    return;
  }

  const count = await prisma.projectExpense.count({
    where: { organizationId: organization.id },
  });
  const expenseNumber = `EXP-2026-${String(count + 1).padStart(3, "0")}`;
  const expenseDate = expenseDateRaw ? new Date(expenseDateRaw) : new Date();

  await prisma.$transaction(async (tx) => {
    await tx.projectExpense.create({
      data: {
        organizationId: organization.id,
        projectId,
        siteId,
        phaseId,
        expenseNumber,
        category,
        title,
        description,
        vendorOrPayee,
        amount,
        taxAmount,
        totalAmount,
        expenseDate,
        paymentMethod,
        paymentReference,
        receiptAttachmentLabel,
        status,
        recordedById: currentUser.id,
        approvedById:
          status === "APPROVED_PAID" || status === "APPROVED_UNPAID"
            ? currentUser.id
            : null,
      },
    });

    if (status === "APPROVED_PAID" || status === "APPROVED_UNPAID") {
      await tx.project.update({
        where: { id: projectId },
        data: {
          actualCost: { increment: totalAmount },
        },
      });

      const budgetLine = await tx.projectBudgetLine.findFirst({
        where: {
          organizationId: organization.id,
          projectId,
          category,
        },
      });

      if (budgetLine) {
        const newActual = budgetLine.actualCost + totalAmount;
        const newCommitted = Math.max(budgetLine.committedCost, newActual);
        const utilizationPct =
          budgetLine.allocatedBudget > 0
            ? (newCommitted / budgetLine.allocatedBudget) * 100
            : 0;
        const newBudgetStatus =
          utilizationPct > 100
            ? "EXCEEDED"
            : utilizationPct >= budgetLine.alertThresholdPct
            ? "OVERRUN_RISK"
            : "WITHIN_BUDGET";

        await tx.projectBudgetLine.update({
          where: { id: budgetLine.id },
          data: {
            actualCost: newActual,
            committedCost: newCommitted,
            status: newBudgetStatus,
            updatedById: currentUser.id,
          },
        });
      }
    }

    if (status === "APPROVED_PAID") {
      const payCount = await tx.financialPayment.count({
        where: { organizationId: organization.id },
      });
      await tx.financialPayment.create({
        data: {
          organizationId: organization.id,
          projectId,
          paymentNumber: `PAY-2026-${String(payCount + 1).padStart(3, "0")}`,
          direction: "OUTBOUND_EXPENSE",
          counterpartyName: vendorOrPayee,
          amount: totalAmount,
          paymentMethod,
          referenceCode: paymentReference || expenseNumber,
          paymentDate: expenseDate,
          status: "CONFIRMED",
          notes: `Direct site expense settlement for ${expenseNumber}: ${title}`,
          recordedById: currentUser.id,
        },
      });
    }
  });

  revalidatePath("/finance/expenses");
  revalidatePath("/finance/payments");
  revalidatePath("/projects/budget");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function updateExpenseStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const expenseId = String(formData.get("expenseId") || "").trim();
  const nextStatus = String(formData.get("status") || "APPROVED_PAID").trim();

  if (!expenseId) return;

  const existing = await prisma.projectExpense.findUnique({
    where: { id: expenseId },
  });
  if (!existing || existing.organizationId !== organization.id) return;

  const wasApproved =
    existing.status === "APPROVED_PAID" ||
    existing.status === "APPROVED_UNPAID" ||
    existing.status === "APPROVED_POSTED";
  const willBeApproved =
    nextStatus === "APPROVED_PAID" ||
    nextStatus === "APPROVED_UNPAID" ||
    nextStatus === "APPROVED_POSTED";

  await prisma.$transaction(async (tx) => {
    await tx.projectExpense.update({
      where: { id: expenseId },
      data: {
        status: nextStatus,
        approvedById: willBeApproved ? currentUser.id : existing.approvedById,
      },
    });

    if (!wasApproved && willBeApproved) {
      await tx.project.update({
        where: { id: existing.projectId },
        data: {
          actualCost: { increment: existing.totalAmount },
        },
      });

      const budgetLine = await tx.projectBudgetLine.findFirst({
        where: {
          organizationId: organization.id,
          projectId: existing.projectId,
          category: existing.category,
        },
      });

      if (budgetLine) {
        const newActual = budgetLine.actualCost + existing.totalAmount;
        const newCommitted = Math.max(budgetLine.committedCost, newActual);
        const utilizationPct =
          budgetLine.allocatedBudget > 0
            ? (newCommitted / budgetLine.allocatedBudget) * 100
            : 0;
        const newBudgetStatus =
          utilizationPct > 100
            ? "EXCEEDED"
            : utilizationPct >= budgetLine.alertThresholdPct
            ? "OVERRUN_RISK"
            : "WITHIN_BUDGET";

        await tx.projectBudgetLine.update({
          where: { id: budgetLine.id },
          data: {
            actualCost: newActual,
            committedCost: newCommitted,
            status: newBudgetStatus,
            updatedById: currentUser.id,
          },
        });
      }
    }
  });

  revalidatePath("/finance/expenses");
  revalidatePath("/projects/budget");
  revalidatePath(`/projects/${existing.projectId}`);
  revalidatePath("/");
}

export async function createClientInvoiceAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const phaseId = String(formData.get("phaseId") || "").trim() || null;
  const valuationCertificateRef =
    String(formData.get("valuationCertificateRef") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description =
    String(formData.get("description") || "").trim() ||
    "Joint Quantity Surveyor interim valuation certificate.";
  const subtotalAmount = Math.max(
    0,
    Number(formData.get("subtotalAmount") || 0)
  );
  const vatRate = Number(formData.get("vatRate") ?? 16);
  const retentionPct = Number(formData.get("retentionPct") ?? 10);
  const invoiceDateRaw = String(formData.get("invoiceDate") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!projectId || !title || subtotalAmount <= 0) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.organizationId !== organization.id) return;

  const taxAmount = Math.round((subtotalAmount * vatRate) / 100);
  const retentionDeducted = Math.round((subtotalAmount * retentionPct) / 100);
  const totalAmount = subtotalAmount + taxAmount - retentionDeducted;

  const count = await prisma.clientInvoice.count({
    where: { organizationId: organization.id },
  });
  const invoiceNumber = `INV-IPC-2026-${String(count + 1).padStart(3, "0")}`;

  const invoiceDate = invoiceDateRaw ? new Date(invoiceDateRaw) : new Date();
  const dueDate = dueDateRaw
    ? new Date(dueDateRaw)
    : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.clientInvoice.create({
      data: {
        organizationId: organization.id,
        projectId,
        clientId: project.clientId,
        phaseId,
        invoiceNumber,
        valuationCertificateRef,
        title,
        description,
        invoiceDate,
        dueDate,
        subtotalAmount,
        vatRate,
        taxAmount,
        retentionDeducted,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: "SENT",
        notes,
        createdById: currentUser.id,
      },
    });

    await tx.project.update({
      where: { id: projectId },
      data: {
        invoicedAmount: { increment: totalAmount },
      },
    });
  });

  revalidatePath("/finance/invoices");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function recordFinancialPaymentAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const direction = String(formData.get("direction") || "INBOUND_CLIENT").trim();
  const invoiceId = String(formData.get("invoiceId") || "").trim() || null;
  const supplierId = String(formData.get("supplierId") || "").trim() || null;
  const subcontractorId =
    String(formData.get("subcontractorId") || "").trim() || null;
  const purchaseOrderId =
    String(formData.get("purchaseOrderId") || "").trim() || null;
  let counterpartyName = String(formData.get("counterpartyName") || "").trim();
  const amount = Math.max(0, Number(formData.get("amount") || 0));
  const paymentMethod = String(
    formData.get("paymentMethod") || "BANK_RTGS"
  ).trim();
  const referenceCode =
    String(formData.get("referenceCode") || "").trim() || "REF-CONFIRMED";
  const mpesaPhoneOrPaybill =
    String(formData.get("mpesaPhoneOrPaybill") || "").trim() || null;
  const paymentDateRaw = String(formData.get("paymentDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!projectId || amount <= 0) {
    return;
  }

  const count = await prisma.financialPayment.count({
    where: { organizationId: organization.id },
  });
  const paymentNumber = `PAY-2026-${String(count + 1).padStart(3, "0")}`;
  const paymentDate = paymentDateRaw ? new Date(paymentDateRaw) : new Date();

  await prisma.$transaction(async (tx) => {
    let resolvedClientId: string | null = null;

    if (direction === "INBOUND_CLIENT") {
      await tx.project.update({
        where: { id: projectId },
        data: {
          paidAmount: { increment: amount },
        },
      });

      if (invoiceId) {
        const inv = await tx.clientInvoice.findUnique({
          where: { id: invoiceId },
          include: { client: true },
        });
        if (inv && inv.organizationId === organization.id) {
          resolvedClientId = inv.clientId;
          if (!counterpartyName) {
            counterpartyName = inv.client?.name || "Project Client";
          }
          const newPaid = inv.paidAmount + amount;
          const newBalance = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";

          await tx.clientInvoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: newPaid,
              balanceAmount: newBalance,
              status: newStatus,
            },
          });
        }
      }
    }

    if (direction === "OUTBOUND_SUPPLIER" && supplierId && !counterpartyName) {
      const sup = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (sup) counterpartyName = sup.name;
    }

    if (direction === "OUTBOUND_CONTRACTOR" && subcontractorId) {
      const sub = await tx.subcontractor.findUnique({
        where: { id: subcontractorId },
      });
      if (sub && sub.organizationId === organization.id) {
        if (!counterpartyName) counterpartyName = sub.companyName;
        const newPaid = sub.paidAmount + amount;
        const newOutstanding = Math.max(0, sub.certifiedAmount - newPaid);
        await tx.subcontractor.update({
          where: { id: sub.id },
          data: {
            paidAmount: newPaid,
            outstandingBalance: newOutstanding,
          },
        });
      }
    }

    await tx.financialPayment.create({
      data: {
        organizationId: organization.id,
        projectId,
        paymentNumber,
        direction,
        clientId: resolvedClientId,
        invoiceId: direction === "INBOUND_CLIENT" ? invoiceId : null,
        supplierId: direction === "OUTBOUND_SUPPLIER" ? supplierId : null,
        subcontractorId:
          direction === "OUTBOUND_CONTRACTOR" ? subcontractorId : null,
        purchaseOrderId:
          direction === "OUTBOUND_SUPPLIER" ? purchaseOrderId : null,
        counterpartyName: counterpartyName || "Construction Counterparty",
        amount,
        paymentMethod,
        referenceCode,
        mpesaPhoneOrPaybill,
        paymentDate,
        status: "CONFIRMED",
        notes,
        recordedById: currentUser.id,
      },
    });
  });

  revalidatePath("/finance/payments");
  revalidatePath("/finance/invoices");
  revalidatePath("/people/contractors");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function createProjectVariationAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const phaseId = String(formData.get("phaseId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const reason = String(
    formData.get("reason") || "CLIENT_SCOPE_ADDITION"
  ).trim();
  const variationAmount = Number(formData.get("variationAmount") || 0);
  const costImpactBudget = Number(
    formData.get("costImpactBudget") || variationAmount
  );
  const timeExtensionDays = Math.max(
    0,
    Number(formData.get("timeExtensionDays") || 0)
  );
  const supportingDocRef =
    String(formData.get("supportingDocRef") || "").trim() || null;
  const status = String(formData.get("status") || "PENDING_APPROVAL").trim();

  if (!projectId || !title || !description || variationAmount === 0) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.organizationId !== organization.id) return;

  const count = await prisma.projectVariation.count({
    where: { organizationId: organization.id },
  });
  const variationNumber = `VO-2026-${String(count + 1).padStart(3, "0")}`;

  const originalContractAmount = project.contractValue;
  const revisedContractAmount = originalContractAmount + variationAmount;

  await prisma.$transaction(async (tx) => {
    await tx.projectVariation.create({
      data: {
        organizationId: organization.id,
        projectId,
        phaseId,
        variationNumber,
        title,
        description,
        reason,
        originalContractAmount,
        variationAmount,
        revisedContractAmount,
        costImpactBudget,
        timeExtensionDays,
        status,
        supportingDocRef,
        requestedDate: new Date(),
        approvedAt: status === "APPROVED" ? new Date() : null,
        requestedById: currentUser.id,
        approvedById: status === "APPROVED" ? currentUser.id : null,
      },
    });

    if (status === "APPROVED") {
      await tx.project.update({
        where: { id: projectId },
        data: {
          contractValue: revisedContractAmount,
          budget: { increment: costImpactBudget },
        },
      });
    }
  });

  revalidatePath("/finance/variations");
  revalidatePath("/projects/budget");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function updateVariationStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const variationId = String(formData.get("variationId") || "").trim();
  const nextStatus = String(formData.get("status") || "APPROVED").trim();

  if (!variationId) return;

  const existing = await prisma.projectVariation.findUnique({
    where: { id: variationId },
  });
  if (!existing || existing.organizationId !== organization.id) return;

  const wasApproved = existing.status === "APPROVED";
  const willBeApproved = nextStatus === "APPROVED";

  await prisma.$transaction(async (tx) => {
    await tx.projectVariation.update({
      where: { id: variationId },
      data: {
        status: nextStatus,
        approvedAt: willBeApproved ? new Date() : existing.approvedAt,
        approvedById: willBeApproved ? currentUser.id : existing.approvedById,
      },
    });

    if (!wasApproved && willBeApproved) {
      await tx.project.update({
        where: { id: existing.projectId },
        data: {
          contractValue: { increment: existing.variationAmount },
          budget: { increment: existing.costImpactBudget },
        },
      });
    }
  });

  revalidatePath("/finance/variations");
  revalidatePath("/projects/budget");
  revalidatePath(`/projects/${existing.projectId}`);
  revalidatePath("/");
}
