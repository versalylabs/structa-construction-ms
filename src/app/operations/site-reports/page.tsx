import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SiteReportsClient } from "./SiteReportsClient";

export const dynamic = "force-dynamic";

export default async function SiteReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; tab?: string }>;
}) {
  const ctx = await getSessionContext();
  const resolvedParams = await searchParams;

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  const [siteReports, sitePhotos, projects] = await Promise.all([
    prisma.siteReport.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        phase: { select: { id: true, sequenceOrder: true, name: true } },
        submittedBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
        photos: {
          orderBy: { capturedAt: "desc" },
        },
      },
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.sitePhoto.findMany({
      where: { organizationId: ctx.organization.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, code: true, name: true } },
        siteReport: { select: { id: true, reportNumber: true } },
        uploadedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: ctx.organization.id },
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

  return (
    <AuthenticatedLayout>
      <SiteReportsClient
        siteReports={siteReports.map((r) => ({
          ...r,
          reportDate: r.reportDate.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          photos: r.photos.map((p) => ({
            ...p,
            capturedAt: p.capturedAt.toISOString(),
            createdAt: p.createdAt.toISOString(),
          })),
        }))}
        sitePhotos={sitePhotos.map((p) => ({
          ...p,
          capturedAt: p.capturedAt.toISOString(),
          createdAt: p.createdAt.toISOString(),
        }))}
        projects={projects}
        initialProjectFilter={resolvedParams?.projectId || "ALL"}
        initialTab={resolvedParams?.tab === "photos" ? "photos" : "reports"}
        canSubmitReports={
          ctx.can("site_reports:submit") ||
          ctx.can("projects:manage") ||
          ctx.can("planning:manage")
        }
        canReviewReports={ctx.can("projects:manage")}
      />
    </AuthenticatedLayout>
  );
}
