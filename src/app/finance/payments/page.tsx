import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { PaymentsClient } from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }
  const { organization, user: currentUser } = ctx;

  const [
    payments,
    projects,
    invoices,
    suppliers,
    subcontractors,
    purchaseOrders,
  ] = await Promise.all([
    prisma.financialPayment.findMany({
      where: { organizationId: organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        client: { select: { id: true, name: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            valuationCertificateRef: true,
          },
        },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.clientInvoice.findMany({
      where: {
        organizationId: organization.id,
        balanceAmount: { gt: 0 },
      },
      select: {
        id: true,
        projectId: true,
        invoiceNumber: true,
        title: true,
        balanceAmount: true,
        client: { select: { name: true } },
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.supplier.findMany({
      where: { organizationId: organization.id },
      select: { id: true, code: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.subcontractor.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        code: true,
        companyName: true,
        specialization: true,
        contractValue: true,
        paidAmount: true,
      },
      orderBy: { companyName: "asc" },
    }),
    prisma.purchaseOrder.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        poNumber: true,
        projectId: true,
        supplierId: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedPayments = payments.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    direction: p.direction,
    counterpartyName: p.counterpartyName,
    amount: p.amount,
    paymentMethod: p.paymentMethod,
    referenceCode: p.referenceCode,
    mpesaPhoneOrPaybill: p.mpesaPhoneOrPaybill,
    paymentDate: p.paymentDate.toISOString(),
    status: p.status,
    notes: p.notes,
    project: p.project,
    client: p.client
      ? { id: p.client.id, companyName: p.client.name }
      : null,
    invoice: p.invoice,
    recordedBy: p.recordedBy
      ? {
          id: p.recordedBy.id,
          fullName: p.recordedBy.name,
          role: p.recordedBy.role,
        }
      : null,
  }));

  const serializedOpenInvoices = invoices.map((inv) => ({
    id: inv.id,
    projectId: inv.projectId,
    invoiceNumber: inv.invoiceNumber,
    title: inv.title,
    balanceAmount: inv.balanceAmount,
    client: inv.client ? { companyName: inv.client.name } : null,
  }));

  const serializedSubcontractors = subcontractors.map((s) => ({
    id: s.id,
    code: s.code,
    companyName: s.companyName,
    specialtyTrade: s.specialization,
    contractAmount: s.contractValue,
    amountPaid: s.paidAmount,
  }));

  return (
    <AuthenticatedLayout>
      <PaymentsClient
        payments={serializedPayments}
        projects={projects}
        openInvoices={serializedOpenInvoices}
        suppliers={suppliers}
        subcontractors={serializedSubcontractors}
        purchaseOrders={purchaseOrders}
        userRole={currentUser.role}
      />
    </AuthenticatedLayout>
  );
}
