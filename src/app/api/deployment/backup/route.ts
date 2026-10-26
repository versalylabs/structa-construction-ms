import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = ctx.organization.id;

  const [
    projects,
    clients,
    suppliers,
    materials,
    boqItems,
    budgets,
    purchaseOrders,
    expenses,
    invoices,
    payments,
    documents,
    auditLogs,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: { phases: true, sites: true, milestones: true },
    }),
    prisma.client.findMany({ where: { organizationId: orgId } }),
    prisma.supplier.findMany({ where: { organizationId: orgId } }),
    prisma.material.findMany({ where: { organizationId: orgId } }),
    prisma.boqItem.findMany({ where: { organizationId: orgId } }),
    prisma.projectBudgetLine.findMany({ where: { organizationId: orgId } }),
    prisma.purchaseOrder.findMany({ where: { organizationId: orgId } }),
    prisma.projectExpense.findMany({ where: { organizationId: orgId } }),
    prisma.clientInvoice.findMany({ where: { organizationId: orgId } }),
    prisma.financialPayment.findMany({ where: { organizationId: orgId } }),
    prisma.projectDocument.findMany({ where: { organizationId: orgId } }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId: ctx.user.id,
      action: "DATABASE_BACKUP_EXPORTED",
      entity: "ProductionBackup",
      entityId: orgId,
      description: `Downloaded full tenant JSON database snapshot for ${ctx.organization.name} (${projects.length} projects, ${boqItems.length} BOQ items, ${payments.length} payments).`,
      previousValue: "LIVE_STATE",
      newValue: `SNAPSHOT_${new Date().toISOString().slice(0, 10)}`,
    },
  });

  const payload = {
    backupMetadata: {
      system: "Structa Construction Management OS (by Versaly)",
      schemaVersion: "1.15.0",
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
      },
      organization: ctx.organization,
      recordCounts: {
        projects: projects.length,
        clients: clients.length,
        suppliers: suppliers.length,
        materials: materials.length,
        boqItems: boqItems.length,
        budgets: budgets.length,
        purchaseOrders: purchaseOrders.length,
        expenses: expenses.length,
        invoices: invoices.length,
        payments: payments.length,
        documents: documents.length,
        auditLogs: auditLogs.length,
      },
    },
    data: {
      projects,
      clients,
      suppliers,
      materials,
      boqItems,
      budgets,
      purchaseOrders,
      expenses,
      invoices,
      payments,
      documents,
      auditLogs,
    },
  };

  const fileName = `Structa_Backup_${ctx.organization.code}_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
