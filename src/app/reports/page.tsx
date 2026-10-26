import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsAnalyticsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const orgId = ctx.organization.id;

  const [
    projects,
    budgetLines,
    expenses,
    invoices,
    payments,
    variations,
    suppliers,
    purchaseOrders,
    materialRequests,
    materialStocks,
    workers,
    subcontractors,
    equipmentAssets,
    siteReports,
    projectIssues,
    inspections,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        client: { select: { id: true, code: true, name: true } },
        projectManager: { select: { id: true, name: true } },
        phases: {
          select: {
            id: true,
            sequenceOrder: true,
            name: true,
            budget: true,
            actualCost: true,
            plannedProgress: true,
            progress: true,
            status: true,
          },
          orderBy: { sequenceOrder: "asc" },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            boqItems: true,
            siteReports: true,
            projectIssues: true,
            documents: true,
          },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.projectBudgetLine.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { code: "asc" },
    }),
    prisma.projectExpense.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.clientInvoice.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.financialPayment.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.projectVariation.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { requestedDate: "desc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { purchaseOrders: true, goodsReceivedNotes: true } },
      },
      orderBy: { totalPurchased: "desc" },
    }),
    prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        material: { select: { id: true, code: true, name: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.materialRequest.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        material: { select: { id: true, code: true, name: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectMaterialStock.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
          },
        },
      },
      orderBy: { totalCost: "desc" },
    }),
    prisma.siteWorker.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
      },
      orderBy: { totalEarned: "desc" },
    }),
    prisma.subcontractor.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { contractValue: "desc" },
    }),
    prisma.equipmentAsset.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { totalOperatingCost: "desc" },
    }),
    prisma.siteReport.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { reportDate: "desc" },
    }),
    prisma.projectIssue.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.qualitySafetyInspection.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, code: true, name: true } } },
      orderBy: { inspectionDate: "desc" },
    }),
  ]);

  return (
    <AuthenticatedLayout>
      <ReportsClient
        organizationName={ctx.organization.name}
        organizationCode={ctx.organization.code}
        projects={projects.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          projectType: p.projectType,
          location: p.location,
          status: p.status,
          plannedProgress: p.plannedProgress,
          progress: p.progress,
          contractValue: p.contractValue,
          budget: p.budget,
          committedCost: p.committedCost,
          actualCost: p.actualCost,
          invoicedAmount: p.invoicedAmount,
          paidAmount: p.paidAmount,
          clientName: p.client?.name || "Internal Development",
          pmName: p.projectManager?.name || "Unassigned",
          phases: p.phases,
          counts: p._count,
        }))}
        budgetLines={budgetLines.map((b) => ({
          id: b.id,
          code: b.code,
          category: b.category,
          title: b.title,
          allocatedBudget: b.allocatedBudget,
          committedCost: b.committedCost,
          actualCost: b.actualCost,
          status: b.status,
          projectId: b.projectId,
          projectCode: b.project.code,
          projectName: b.project.name,
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          expenseNumber: e.expenseNumber,
          category: e.category,
          title: e.title,
          vendorOrPayee: e.vendorOrPayee,
          totalAmount: e.totalAmount,
          status: e.status,
          expenseDate: e.expenseDate.toISOString(),
          projectId: e.projectId,
          projectCode: e.project.code,
        }))}
        invoices={invoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          title: i.title,
          totalAmount: i.totalAmount,
          paidAmount: i.paidAmount,
          balanceAmount: i.balanceAmount,
          retentionDeducted: i.retentionDeducted,
          status: i.status,
          projectId: i.projectId,
          projectCode: i.project.code,
          clientName: i.client?.name || "Client",
        }))}
        payments={payments.map((pay) => ({
          id: pay.id,
          paymentNumber: pay.paymentNumber,
          direction: pay.direction,
          counterpartyName: pay.counterpartyName,
          amount: pay.amount,
          paymentMethod: pay.paymentMethod,
          projectId: pay.projectId,
          projectCode: pay.project.code,
        }))}
        variations={variations.map((v) => ({
          id: v.id,
          variationNumber: v.variationNumber,
          title: v.title,
          variationAmount: v.variationAmount,
          timeExtensionDays: v.timeExtensionDays,
          status: v.status,
          projectId: v.projectId,
          projectCode: v.project.code,
        }))}
        suppliers={suppliers.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          category: s.category,
          totalPurchased: s.totalPurchased,
          totalPaid: s.totalPaid,
          outstandingBalance: s.outstandingBalance,
          rating: s.rating,
          poCount: s._count.purchaseOrders,
          grnCount: s._count.goodsReceivedNotes,
        }))}
        purchaseOrders={purchaseOrders.map((po) => ({
          id: po.id,
          poNumber: po.poNumber,
          totalAmount: po.totalAmount,
          paidAmount: po.paidAmount,
          status: po.status,
          projectId: po.projectId,
          projectCode: po.project.code,
          supplierName: po.supplier.name,
          materialName: po.material.name,
          orderedQuantity: po.orderedQuantity,
          receivedQuantity: po.receivedQuantity,
          unit: po.material.unit,
        }))}
        materialRequests={materialRequests.map((mr) => ({
          id: mr.id,
          requestNumber: mr.requestNumber,
          title: mr.title,
          estimatedTotalCost: mr.estimatedTotalCost,
          status: mr.status,
          priority: mr.priority,
          projectId: mr.projectId,
          projectCode: mr.project.code,
        }))}
        materialStocks={materialStocks.map((ms) => ({
          id: ms.id,
          projectId: ms.projectId,
          projectCode: ms.project.code,
          siteName: ms.site?.name || "Main Site",
          materialCode: ms.material.code,
          materialName: ms.material.name,
          category: ms.material.category,
          unit: ms.material.unit,
          requiredQuantity: ms.requiredQuantity,
          receivedQuantity: ms.receivedQuantity,
          usedQuantity: ms.usedQuantity,
          wastageQuantity: ms.wastageQuantity,
          remainingQuantity: ms.remainingQuantity,
          unitCost: ms.unitCost,
          totalCost: ms.totalCost,
          status: ms.status,
        }))}
        workers={workers.map((w) => ({
          id: w.id,
          workerCode: w.workerCode,
          fullName: w.fullName,
          workerCategory: w.workerCategory,
          tradeRole: w.tradeRole,
          daysWorked: w.daysWorked,
          overtimeHours: w.overtimeHours,
          totalEarned: w.totalEarned,
          totalPaid: w.totalPaid,
          unpaidBalance: w.unpaidBalance,
          projectId: w.projectId,
          projectCode: w.project.code,
        }))}
        subcontractors={subcontractors.map((sc) => ({
          id: sc.id,
          code: sc.code,
          companyName: sc.companyName,
          specialization: sc.specialization,
          contractValue: sc.contractValue,
          certifiedAmount: sc.certifiedAmount,
          paidAmount: sc.paidAmount,
          outstandingBalance: sc.outstandingBalance,
          progressPct: sc.progressPct,
          performanceRating: sc.performanceRating,
          projectId: sc.projectId,
          projectCode: sc.project.code,
        }))}
        equipmentAssets={equipmentAssets.map((eq) => ({
          id: eq.id,
          assetCode: eq.assetCode,
          name: eq.name,
          category: eq.category,
          ownershipType: eq.ownershipType,
          availabilityStatus: eq.availabilityStatus,
          totalHoursLogged: eq.totalHoursLogged,
          fuelLitresLogged: eq.fuelLitresLogged,
          totalOperatingCost: eq.totalOperatingCost,
          projectId: eq.projectId,
          projectCode: eq.project?.code || "YARD",
        }))}
        siteReports={siteReports.map((sr) => ({
          id: sr.id,
          reportNumber: sr.reportNumber,
          reportDate: sr.reportDate.toISOString(),
          workersPresentCount: sr.workersPresentCount,
          subcontractorWorkersCount: sr.subcontractorWorkersCount,
          safetyIncidentsCount: sr.safetyIncidentsCount,
          overallProgressDelta: sr.overallProgressDelta,
          projectId: sr.projectId,
          projectCode: sr.project.code,
        }))}
        projectIssues={projectIssues.map((iss) => ({
          id: iss.id,
          issueCode: iss.issueCode,
          title: iss.title,
          category: iss.category,
          severity: iss.severity,
          status: iss.status,
          projectId: iss.projectId,
          projectCode: iss.project.code,
        }))}
        inspections={inspections.map((ins) => ({
          id: ins.id,
          recordNumber: ins.recordNumber,
          recordDomain: ins.recordDomain,
          title: ins.title,
          resultStatus: ins.resultStatus,
          complianceScorePct: ins.complianceScorePct,
          projectId: ins.projectId,
          projectCode: ins.project.code,
        }))}
      />
    </AuthenticatedLayout>
  );
}
