import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { ExpensesClient } from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }
  const { organization, user: currentUser } = ctx;

  const [expenses, projects] = await Promise.all([
    prisma.projectExpense.findMany({
      where: { organizationId: organization.id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            budget: true,
            actualCost: true,
          },
        },
        site: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        sites: { select: { id: true, code: true, name: true } },
        phases: {
          select: { id: true, sequenceOrder: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    expenseNumber: e.expenseNumber,
    category: e.category,
    title: e.title,
    description: e.description,
    vendorOrPayee: e.vendorOrPayee,
    amount: e.amount,
    taxAmount: e.taxAmount,
    totalAmount: e.totalAmount,
    expenseDate: e.expenseDate.toISOString(),
    paymentMethod: e.paymentMethod,
    paymentReference: e.paymentReference,
    receiptAttachmentLabel: e.receiptAttachmentLabel,
    status: e.status,
    project: {
      id: e.project.id,
      code: e.project.code,
      name: e.project.name,
      budget: e.project.budget,
      spentAmount: e.project.actualCost,
    },
    site: e.site,
    phase: e.phase
      ? {
          id: e.phase.id,
          code: `PH-0${e.phase.sequenceOrder}`,
          name: e.phase.name,
        }
      : null,
    recordedBy: e.recordedBy
      ? {
          id: e.recordedBy.id,
          fullName: e.recordedBy.name,
          role: e.recordedBy.role,
        }
      : null,
    approvedBy: e.approvedBy
      ? {
          id: e.approvedBy.id,
          fullName: e.approvedBy.name,
          role: e.approvedBy.role,
        }
      : null,
  }));

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    sites: p.sites,
    phases: p.phases.map((ph) => ({
      id: ph.id,
      code: `PH-0${ph.sequenceOrder}`,
      name: ph.name,
    })),
  }));

  return (
    <AuthenticatedLayout>
      <ExpensesClient
        expenses={serializedExpenses}
        projects={serializedProjects}
        userRole={currentUser.role}
      />
    </AuthenticatedLayout>
  );
}
