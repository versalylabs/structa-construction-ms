import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { InvoicesClient } from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }
  const { organization, user: currentUser } = ctx;

  const [invoices, projects] = await Promise.all([
    prisma.clientInvoice.findMany({
      where: { organizationId: organization.id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            contractValue: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        payments: {
          orderBy: { paymentDate: "desc" },
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentMethod: true,
            referenceCode: true,
            paymentDate: true,
          },
        },
      },
      orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        contractValue: true,
        client: { select: { id: true, name: true } },
        phases: {
          select: { id: true, sequenceOrder: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const serializedInvoices = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    valuationCertificateRef: inv.valuationCertificateRef,
    title: inv.title,
    description: inv.description,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    subtotalAmount: inv.subtotalAmount,
    vatRate: inv.vatRate,
    taxAmount: inv.taxAmount,
    retentionDeducted: inv.retentionDeducted,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    balanceAmount: inv.balanceAmount,
    status: inv.status,
    notes: inv.notes,
    project: inv.project,
    client: inv.client
      ? {
          id: inv.client.id,
          companyName: inv.client.name,
          contactPerson: inv.client.contactPerson,
          email: inv.client.email,
          phone: inv.client.phone,
        }
      : null,
    phase: inv.phase
      ? {
          id: inv.phase.id,
          code: `PH-0${inv.phase.sequenceOrder}`,
          name: inv.phase.name,
        }
      : null,
    createdBy: inv.createdBy
      ? {
          id: inv.createdBy.id,
          fullName: inv.createdBy.name,
          role: inv.createdBy.role,
        }
      : null,
    payments: inv.payments.map((p) => ({
      ...p,
      paymentDate: p.paymentDate.toISOString(),
    })),
  }));

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    contractValue: p.contractValue,
    client: p.client ? { id: p.client.id, companyName: p.client.name } : null,
    phases: p.phases.map((ph) => ({
      id: ph.id,
      code: `PH-0${ph.sequenceOrder}`,
      name: ph.name,
    })),
  }));

  return (
    <AuthenticatedLayout>
      <InvoicesClient
        invoices={serializedInvoices}
        projects={serializedProjects}
        userRole={currentUser.role}
      />
    </AuthenticatedLayout>
  );
}
