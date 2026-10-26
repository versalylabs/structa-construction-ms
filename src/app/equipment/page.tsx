import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EquipmentClient } from "./EquipmentClient";

export const dynamic = "force-dynamic";

interface EquipmentPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const resolvedSearchParams = await searchParams;
  const initialTab =
    resolvedSearchParams?.tab === "maintenance" ? "maintenance" : "fleet";

  const [equipmentAssets, maintenanceLogs, projects] = await Promise.all([
    prisma.equipmentAsset.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: {
          select: { id: true, code: true, name: true },
        },
        site: {
          select: { id: true, code: true, name: true },
        },
        maintenanceLogs: {
          orderBy: { serviceDate: "desc" },
          take: 5,
        },
      },
      orderBy: [{ availabilityStatus: "asc" }, { assetCode: "asc" }],
    }),
    prisma.equipmentMaintenanceLog.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        equipment: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            category: true,
            registrationOrSerial: true,
          },
        },
        project: {
          select: { id: true, code: true, name: true },
        },
        recordedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { serviceDate: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
      select: {
        id: true,
        code: true,
        name: true,
        sites: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const serializedAssets = equipmentAssets.map((asset) => ({
    ...asset,
    nextServiceDueDate: asset.nextServiceDueDate
      ? asset.nextServiceDueDate.toISOString()
      : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    maintenanceLogs: asset.maintenanceLogs.map((m) => ({
      ...m,
      serviceDate: m.serviceDate.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
  }));

  const serializedLogs = maintenanceLogs.map((log) => ({
    ...log,
    serviceDate: log.serviceDate.toISOString(),
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <AuthenticatedLayout>
      <EquipmentClient
        equipmentAssets={serializedAssets}
        maintenanceLogs={serializedLogs}
        projects={projects}
        initialTab={initialTab}
        userRole={ctx.user.role}
      />
    </AuthenticatedLayout>
  );
}
