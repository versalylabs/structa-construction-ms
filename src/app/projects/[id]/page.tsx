import React from "react";
import { notFound } from "next/navigation";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectCommandCenterClient } from "./ProjectCommandCenterClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  const { id } = await params;

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  // Enforce strict tenant isolation: query both id AND organizationId
  const [project, users] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id,
        organizationId: ctx.organization.id,
      },
      include: {
        client: true,
        projectManager: {
          select: { id: true, name: true, email: true, role: true, jobTitle: true },
        },
        siteManager: {
          select: { id: true, name: true, email: true, role: true, jobTitle: true },
        },
        quantitySurveyor: {
          select: { id: true, name: true, email: true, role: true, jobTitle: true },
        },
        sites: {
          include: {
            siteManager: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        phases: {
          include: {
            leadUser: { select: { id: true, name: true, role: true } },
          },
          orderBy: { sequenceOrder: "asc" },
        },
        tasks: {
          include: {
            phase: { select: { id: true, sequenceOrder: true, name: true } },
            assignedTo: { select: { id: true, name: true, role: true } },
            dependsOnTask: { select: { id: true, code: true, name: true, status: true } },
          },
          orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        },
        milestones: {
          include: {
            phase: { select: { id: true, sequenceOrder: true, name: true } },
            owner: { select: { id: true, name: true, role: true } },
          },
          orderBy: { targetDate: "asc" },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                jobTitle: true,
                department: true,
                employeeCode: true,
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
        documents: {
          include: {
            uploadedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        boqItems: {
          include: {
            phase: { select: { id: true, sequenceOrder: true, name: true } },
          },
          orderBy: { itemCode: "asc" },
        },
        budgetLines: {
          include: {
            phase: { select: { id: true, sequenceOrder: true, name: true } },
          },
          orderBy: { code: "asc" },
        },
        projectMaterialStocks: {
          include: {
            material: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                unit: true,
                standardUnitCost: true,
              },
            },
            site: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        materialRequests: {
          include: {
            material: { select: { id: true, code: true, name: true, unit: true } },
            requestedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        purchaseOrders: {
          include: {
            supplier: { select: { id: true, code: true, name: true } },
            material: { select: { id: true, code: true, name: true, unit: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        siteWorkers: {
          orderBy: { workerCode: "asc" },
        },
        subcontractors: {
          orderBy: { contractValue: "desc" },
        },
        equipmentAssets: {
          orderBy: { assetCode: "asc" },
        },
        siteReports: {
          orderBy: { reportDate: "desc" },
          take: 10,
        },
        projectIssues: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        qualitySafetyRecords: {
          orderBy: { inspectionDate: "desc" },
          take: 10,
        },
        projectExpenses: {
          orderBy: { expenseDate: "desc" },
          take: 10,
        },
        clientInvoices: {
          orderBy: { invoiceDate: "desc" },
          take: 10,
        },
        financialPayments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
        projectVariations: {
          orderBy: { requestedDate: "desc" },
          take: 10,
        },
      },
    }),
    prisma.user.findMany({
      where: {
        organizationId: ctx.organization.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        role: true,
        jobTitle: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <ProjectCommandCenterClient
        project={{
          ...project,
          startDate: project.startDate.toISOString(),
          expectedCompletionDate: project.expectedCompletionDate.toISOString(),
          actualCompletionDate: project.actualCompletionDate
            ? project.actualCompletionDate.toISOString()
            : null,
          phases: project.phases.map((ph) => ({
            ...ph,
            startDate: ph.startDate.toISOString(),
            endDate: ph.endDate.toISOString(),
          })),
          tasks: project.tasks.map((t) => ({
            ...t,
            startDate: t.startDate.toISOString(),
            dueDate: t.dueDate.toISOString(),
            completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          })),
          milestones: project.milestones.map((m) => ({
            ...m,
            targetDate: m.targetDate.toISOString(),
            achievedDate: m.achievedDate ? m.achievedDate.toISOString() : null,
          })),
          sites: project.sites.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
          })),
          teamMembers: project.teamMembers.map((tm) => ({
            ...tm,
            assignedAt: tm.assignedAt.toISOString(),
          })),
          documents: project.documents.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
          })),
          boqItems: project.boqItems.map((b) => ({
            ...b,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
          })),
          budgetLines: project.budgetLines.map((bl) => ({
            ...bl,
            createdAt: bl.createdAt.toISOString(),
            updatedAt: bl.updatedAt.toISOString(),
          })),
          projectMaterialStocks: project.projectMaterialStocks.map((ms) => ({
            ...ms,
            createdAt: ms.createdAt.toISOString(),
            updatedAt: ms.updatedAt.toISOString(),
          })),
          materialRequests: project.materialRequests.map((mr) => ({
            ...mr,
            requiredByDate: mr.requiredByDate.toISOString(),
            approvedAt: mr.approvedAt ? mr.approvedAt.toISOString() : null,
            createdAt: mr.createdAt.toISOString(),
          })),
          purchaseOrders: project.purchaseOrders.map((po) => ({
            ...po,
            expectedDeliveryDate: po.expectedDeliveryDate.toISOString(),
            approvedAt: po.approvedAt ? po.approvedAt.toISOString() : null,
            createdAt: po.createdAt.toISOString(),
          })),
          siteWorkers: project.siteWorkers.map((sw) => ({
            ...sw,
            createdAt: sw.createdAt.toISOString(),
            updatedAt: sw.updatedAt.toISOString(),
          })),
          subcontractors: project.subcontractors.map((sc) => ({
            ...sc,
            startDate: sc.startDate ? sc.startDate.toISOString() : null,
            endDate: sc.endDate ? sc.endDate.toISOString() : null,
            createdAt: sc.createdAt.toISOString(),
            updatedAt: sc.updatedAt.toISOString(),
          })),
          equipmentAssets: project.equipmentAssets.map((eq) => ({
            ...eq,
            nextServiceDueDate: eq.nextServiceDueDate
              ? eq.nextServiceDueDate.toISOString()
              : null,
            createdAt: eq.createdAt.toISOString(),
            updatedAt: eq.updatedAt.toISOString(),
          })),
          siteReports: project.siteReports.map((sr) => ({
            ...sr,
            reportDate: sr.reportDate.toISOString(),
            createdAt: sr.createdAt.toISOString(),
            updatedAt: sr.updatedAt.toISOString(),
          })),
          projectIssues: project.projectIssues.map((iss) => ({
            ...iss,
            dueDate: iss.dueDate.toISOString(),
            resolvedAt: iss.resolvedAt ? iss.resolvedAt.toISOString() : null,
            createdAt: iss.createdAt.toISOString(),
            updatedAt: iss.updatedAt.toISOString(),
          })),
          qualitySafetyRecords: project.qualitySafetyRecords.map((qsi) => ({
            ...qsi,
            inspectionDate: qsi.inspectionDate.toISOString(),
            closedAt: qsi.closedAt ? qsi.closedAt.toISOString() : null,
            createdAt: qsi.createdAt.toISOString(),
            updatedAt: qsi.updatedAt.toISOString(),
          })),
          projectExpenses: project.projectExpenses.map((pe) => ({
            ...pe,
            expenseDate: pe.expenseDate.toISOString(),
            createdAt: pe.createdAt.toISOString(),
            updatedAt: pe.updatedAt.toISOString(),
          })),
          clientInvoices: project.clientInvoices.map((ci) => ({
            ...ci,
            invoiceDate: ci.invoiceDate.toISOString(),
            dueDate: ci.dueDate.toISOString(),
            createdAt: ci.createdAt.toISOString(),
            updatedAt: ci.updatedAt.toISOString(),
          })),
          financialPayments: project.financialPayments.map((fp) => ({
            ...fp,
            paymentDate: fp.paymentDate.toISOString(),
            createdAt: fp.createdAt.toISOString(),
          })),
          projectVariations: project.projectVariations.map((pv) => ({
            ...pv,
            requestedDate: pv.requestedDate.toISOString(),
            approvedAt: pv.approvedAt ? pv.approvedAt.toISOString() : null,
            createdAt: pv.createdAt.toISOString(),
            updatedAt: pv.updatedAt.toISOString(),
          })),
        }}
        users={users}
        currency={ctx.organization.currency}
        canManageProject={ctx.can("projects:manage")}
        canManagePlanning={
          ctx.can("planning:manage") ||
          ctx.can("projects:manage") ||
          ctx.can("site_reports:submit")
        }
        canManageBoq={ctx.can("boq:manage") || ctx.can("projects:manage")}
        canManageBudgets={
          ctx.can("budgets:manage") ||
          ctx.can("boq:manage") ||
          ctx.can("projects:manage")
        }
        canManageDocs={ctx.can("documents:manage") || ctx.can("projects:manage")}
      />
    </AuthenticatedLayout>
  );
}
