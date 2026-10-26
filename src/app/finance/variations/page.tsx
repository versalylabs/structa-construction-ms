import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { VariationsClient } from "./VariationsClient";

export const dynamic = "force-dynamic";

export default async function VariationsPage() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }
  const { organization, user: currentUser } = ctx;

  const [variations, projects] = await Promise.all([
    prisma.projectVariation.findMany({
      where: { organizationId: organization.id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            contractValue: true,
            budget: true,
          },
        },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ requestedDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        contractValue: true,
        budget: true,
        phases: {
          select: { id: true, sequenceOrder: true, name: true },
          orderBy: { sequenceOrder: "asc" },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const serializedVariations = variations.map((v) => ({
    id: v.id,
    variationNumber: v.variationNumber,
    title: v.title,
    description: v.description,
    reason: v.reason,
    originalContractAmount: v.originalContractAmount,
    variationAmount: v.variationAmount,
    revisedContractAmount: v.revisedContractAmount,
    costImpactBudget: v.costImpactBudget,
    timeExtensionDays: v.timeExtensionDays,
    status: v.status,
    supportingDocRef: v.supportingDocRef,
    requestedDate: v.requestedDate.toISOString(),
    approvedAt: v.approvedAt ? v.approvedAt.toISOString() : null,
    project: v.project,
    phase: v.phase
      ? {
          id: v.phase.id,
          code: `PH-0${v.phase.sequenceOrder}`,
          name: v.phase.name,
        }
      : null,
    requestedBy: v.requestedBy
      ? {
          id: v.requestedBy.id,
          fullName: v.requestedBy.name,
          role: v.requestedBy.role,
        }
      : null,
    approvedBy: v.approvedBy
      ? {
          id: v.approvedBy.id,
          fullName: v.approvedBy.name,
          role: v.approvedBy.role,
        }
      : null,
  }));

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    contractValue: p.contractValue,
    budget: p.budget,
    phases: p.phases.map((ph) => ({
      id: ph.id,
      code: `PH-0${ph.sequenceOrder}`,
      name: ph.name,
    })),
  }));

  return (
    <AuthenticatedLayout>
      <VariationsClient
        variations={serializedVariations}
        projects={serializedProjects}
        userRole={currentUser.role}
      />
    </AuthenticatedLayout>
  );
}
