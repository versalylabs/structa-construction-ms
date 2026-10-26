"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

function generateSitePhotoSvg(
  projectCode: string,
  category: string,
  title: string,
  locationTag: string
): string {
  const accentMap: Record<string, string> = {
    PROGRESS: "#f59e0b",
    COMPLETED_WORK: "#10b981",
    MATERIALS_DELIVERY: "#38bdf8",
    DEFECT_SNAG: "#f43f5e",
    SAFETY_COMPLIANCE: "#a855f7",
    SITE_CONDITION: "#94a3b8",
  };
  const accent = accentMap[category] || "#f59e0b";
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 46);
  const safeLocation = locationTag
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 44);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <rect width="800" height="500" fill="#0f172a"/>
    <g stroke="#1e293b" stroke-width="2">
      <line x1="0" y1="125" x2="800" y2="125"/><line x1="0" y1="250" x2="800" y2="250"/><line x1="0" y1="375" x2="800" y2="375"/>
      <line x1="200" y1="0" x2="200" y2="500"/><line x1="400" y1="0" x2="400" y2="500"/><line x1="600" y1="0" x2="600" y2="500"/>
    </g>
    <rect x="140" y="130" width="520" height="290" rx="10" fill="#1e293b" stroke="${accent}" stroke-width="3"/>
    <line x1="140" y1="275" x2="660" y2="275" stroke="${accent}" stroke-width="2" stroke-dasharray="10 6"/>
    <line x1="400" y1="130" x2="400" y2="420" stroke="${accent}" stroke-width="2" stroke-dasharray="10 6"/>
    <rect x="30" y="30" width="520" height="76" rx="8" fill="#020617" opacity="0.92" stroke="${accent}" stroke-width="1.5"/>
    <text x="48" y="58" fill="#f8fafc" font-family="monospace" font-size="15" font-weight="bold">${projectCode} • ${safeLocation}</text>
    <text x="48" y="84" fill="${accent}" font-family="monospace" font-size="13">${safeTitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ----------------------------------------------------------------------------
// 1. CREATE DAILY / WEEKLY SITE REPORT
// ----------------------------------------------------------------------------
export async function createSiteReportAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const projectId = String(formData.get("projectId") || "").trim();
  const siteIdRaw = String(formData.get("siteId") || "").trim();
  const phaseIdRaw = String(formData.get("phaseId") || "").trim();
  const reportType = String(formData.get("reportType") || "DAILY").trim();
  const reportDateRaw = String(formData.get("reportDate") || "").trim();
  const weatherCondition = String(
    formData.get("weatherCondition") || "SUNNY_CLEAR"
  ).trim();
  const temperatureCelsius =
    parseFloat(String(formData.get("temperatureCelsius") || "25")) || 25;
  const groundCondition = String(
    formData.get("groundCondition") || "DRY_FIRM"
  ).trim();
  const workersPresentCount =
    parseInt(String(formData.get("workersPresentCount") || "0"), 10) || 0;
  const subcontractorWorkersCount =
    parseInt(String(formData.get("subcontractorWorkersCount") || "0"), 10) || 0;
  const workCompletedSummary = String(
    formData.get("workCompletedSummary") || ""
  ).trim();
  const workPlannedNext = String(formData.get("workPlannedNext") || "").trim();
  const materialsReceivedNote =
    String(formData.get("materialsReceivedNote") || "").trim() || null;
  const equipmentUsedNote =
    String(formData.get("equipmentUsedNote") || "").trim() || null;
  const issuesSummaryNote =
    String(formData.get("issuesSummaryNote") || "").trim() || null;
  const safetyToolboxTalkTopic =
    String(formData.get("safetyToolboxTalkTopic") || "").trim() || null;
  const safetyIncidentsCount =
    parseInt(String(formData.get("safetyIncidentsCount") || "0"), 10) || 0;
  const overallProgressDelta =
    parseFloat(String(formData.get("overallProgressDelta") || "0")) || 0;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!projectId || !workCompletedSummary || !workPlannedNext) {
    return {
      error:
        "Project, Work Completed Summary, and Planned Next Works are required.",
    };
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    });
    if (!project) return { error: "Project not found in your organization." };

    const count = await prisma.siteReport.count({
      where: { organizationId: ctx.organization.id },
    });
    const reportNumber = `DSR-2026-${String(count + 1).padStart(3, "0")}`;

    const status =
      safetyIncidentsCount > 0 || weatherCondition === "HEAVY_RAIN"
        ? "FLAGGED_DELAY"
        : "SUBMITTED";

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.siteReport.create({
        data: {
          organizationId: ctx.organization.id,
          projectId,
          siteId: siteIdRaw || null,
          phaseId: phaseIdRaw || null,
          reportNumber,
          reportDate: reportDateRaw ? new Date(reportDateRaw) : new Date(),
          reportType,
          weatherCondition,
          temperatureCelsius,
          groundCondition,
          workersPresentCount,
          subcontractorWorkersCount,
          workCompletedSummary,
          workPlannedNext,
          materialsReceivedNote,
          equipmentUsedNote,
          issuesSummaryNote,
          safetyToolboxTalkTopic,
          safetyIncidentsCount,
          overallProgressDelta,
          status,
          notes,
          submittedById: ctx.user.id,
        },
      });

      if (overallProgressDelta > 0) {
        const nextProgress = Math.min(
          100,
          Number((project.progress + overallProgressDelta).toFixed(1))
        );
        await tx.project.update({
          where: { id: project.id },
          data: { progress: nextProgress },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: "SITE_REPORT_SUBMITTED",
          entity: "SiteReport",
          entityId: created.id,
          description: `Submitted ${reportType} Site Report ${reportNumber} for ${project.code} (${workersPresentCount + subcontractorWorkersCount} operatives on site).`,
        },
      });

      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          title: `Site Report ${reportNumber} Submitted (${project.code})`,
          message: `${ctx.user.name} logged ${workersPresentCount} direct workers & ${subcontractorWorkersCount} subcontractor operatives on ${project.name}.`,
          type: status === "FLAGGED_DELAY" ? "WARNING" : "INFO",
          category: "SITE",
          link: "/operations/site-reports",
        },
      });

      return created;
    });

    revalidatePath("/operations/site-reports");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    return { success: true, reportId: report.id };
  } catch (err) {
    console.error("createSiteReportAction error:", err);
    return { error: "Failed to save site report." };
  }
}

// ----------------------------------------------------------------------------
// 2. REVIEW / SIGN-OFF SITE REPORT
// ----------------------------------------------------------------------------
export async function reviewSiteReportAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const reportId = String(formData.get("reportId") || "").trim();
  const status = String(formData.get("status") || "REVIEWED").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!reportId) return { error: "Report ID is required." };

  try {
    const existing = await prisma.siteReport.findFirst({
      where: { id: reportId, organizationId: ctx.organization.id },
    });
    if (!existing) return { error: "Site report not found." };

    await prisma.siteReport.update({
      where: { id: existing.id },
      data: {
        status,
        notes: notes || existing.notes,
        reviewedById: ctx.user.id,
      },
    });

    revalidatePath("/operations/site-reports");
    revalidatePath(`/projects/${existing.projectId}`);
    return { success: true };
  } catch (err) {
    console.error("reviewSiteReportAction error:", err);
    return { error: "Failed to update site report review status." };
  }
}

// ----------------------------------------------------------------------------
// 3. UPLOAD / REGISTER SITE PHOTO
// ----------------------------------------------------------------------------
export async function createSitePhotoAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const projectId = String(formData.get("projectId") || "").trim();
  const siteIdRaw = String(formData.get("siteId") || "").trim();
  const siteReportIdRaw = String(formData.get("siteReportId") || "").trim();
  const category = String(formData.get("category") || "PROGRESS").trim();
  const title = String(formData.get("title") || "").trim();
  const locationTag = String(formData.get("locationTag") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const customImageUrl = String(formData.get("imageUrl") || "").trim();

  if (!projectId || !title || !locationTag) {
    return { error: "Project, Photo Title, and Location Tag are required." };
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    });
    if (!project) return { error: "Project not found." };

    const count = await prisma.sitePhoto.count({
      where: { organizationId: ctx.organization.id },
    });
    const photoCode = `PHO-2026-${String(count + 1).padStart(3, "0")}`;

    const imageUrl =
      customImageUrl ||
      generateSitePhotoSvg(project.code, category, title, locationTag);

    await prisma.sitePhoto.create({
      data: {
        organizationId: ctx.organization.id,
        projectId,
        siteId: siteIdRaw || null,
        siteReportId: siteReportIdRaw || null,
        photoCode,
        category,
        title,
        caption,
        locationTag,
        imageUrl,
        uploadedById: ctx.user.id,
      },
    });

    revalidatePath("/operations/site-reports");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("createSitePhotoAction error:", err);
    return { error: "Failed to save site photo." };
  }
}

// ----------------------------------------------------------------------------
// 4. CREATE PROJECT ISSUE / SNAG / RISK
// ----------------------------------------------------------------------------
export async function createProjectIssueAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const projectId = String(formData.get("projectId") || "").trim();
  const siteIdRaw = String(formData.get("siteId") || "").trim();
  const phaseIdRaw = String(formData.get("phaseId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const category = String(
    formData.get("category") || "QUALITY_DEFECT_SNAG"
  ).trim();
  const severity = String(formData.get("severity") || "MEDIUM").trim();
  const description = String(formData.get("description") || "").trim();
  const impactSummary =
    String(formData.get("impactSummary") || "").trim() || null;
  const resolutionPlan =
    String(formData.get("resolutionPlan") || "").trim() || null;
  const dueDateRaw = String(formData.get("dueDate") || "").trim();
  const assignedToIdRaw = String(formData.get("assignedToId") || "").trim();

  if (!projectId || !title || !description) {
    return { error: "Project, Issue Title, and Description are required." };
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    });
    if (!project) return { error: "Project not found." };

    const count = await prisma.projectIssue.count({
      where: { organizationId: ctx.organization.id },
    });
    const issueCode = `ISS-2026-${String(count + 1).padStart(3, "0")}`;

    await prisma.$transaction(async (tx) => {
      const created = await tx.projectIssue.create({
        data: {
          organizationId: ctx.organization.id,
          projectId,
          siteId: siteIdRaw || null,
          phaseId: phaseIdRaw || null,
          issueCode,
          title,
          category,
          severity,
          status: severity === "CRITICAL" ? "ESCALATED" : "OPEN",
          description,
          impactSummary,
          resolutionPlan,
          dueDate: dueDateRaw
            ? new Date(dueDateRaw)
            : new Date(Date.now() + 5 * 86400000),
          reportedById: ctx.user.id,
          assignedToId: assignedToIdRaw || ctx.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: "ISSUE_REPORTED",
          entity: "ProjectIssue",
          entityId: created.id,
          description: `Logged ${severity} issue ${issueCode} (${title}) on ${project.code}.`,
        },
      });

      await tx.notification.create({
        data: {
          organizationId: ctx.organization.id,
          title: `New ${severity} Issue ${issueCode} (${project.code})`,
          message: `${title} — ${impactSummary || description.slice(0, 90)}`,
          type:
            severity === "CRITICAL"
              ? "CRITICAL"
              : severity === "HIGH"
                ? "WARNING"
                : "INFO",
          category: "SITE",
          link: "/operations/issues",
        },
      });
    });

    revalidatePath("/operations/issues");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("createProjectIssueAction error:", err);
    return { error: "Failed to log project issue." };
  }
}

// ----------------------------------------------------------------------------
// 5. UPDATE PROJECT ISSUE STATUS & RESOLUTION
// ----------------------------------------------------------------------------
export async function updateProjectIssueStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const issueId = String(formData.get("issueId") || "").trim();
  const status = String(formData.get("status") || "IN_PROGRESS").trim();
  const severity = String(formData.get("severity") || "MEDIUM").trim();
  const resolutionPlan = String(formData.get("resolutionPlan") || "").trim();
  const assignedToIdRaw = String(formData.get("assignedToId") || "").trim();

  if (!issueId) return { error: "Issue ID is required." };

  try {
    const existing = await prisma.projectIssue.findFirst({
      where: { id: issueId, organizationId: ctx.organization.id },
    });
    if (!existing) return { error: "Issue not found." };

    const isResolved = status === "RESOLVED" || status === "CLOSED";

    await prisma.projectIssue.update({
      where: { id: existing.id },
      data: {
        status,
        severity,
        resolutionPlan: resolutionPlan || existing.resolutionPlan,
        assignedToId: assignedToIdRaw || existing.assignedToId,
        resolvedAt: isResolved ? new Date() : null,
      },
    });

    revalidatePath("/operations/issues");
    revalidatePath(`/projects/${existing.projectId}`);
    return { success: true };
  } catch (err) {
    console.error("updateProjectIssueStatusAction error:", err);
    return { error: "Failed to update issue status." };
  }
}

// ----------------------------------------------------------------------------
// 6. CREATE QUALITY INSPECTION OR SAFETY INCIDENT RECORD
// ----------------------------------------------------------------------------
export async function createQualitySafetyRecordAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const projectId = String(formData.get("projectId") || "").trim();
  const siteIdRaw = String(formData.get("siteId") || "").trim();
  const phaseIdRaw = String(formData.get("phaseId") || "").trim();
  const recordDomain = String(
    formData.get("recordDomain") || "QUALITY_INSPECTION"
  ).trim();
  const inspectionOrIncidentType = String(
    formData.get("inspectionOrIncidentType") || "REBAR_PRE_POUR_CHECK"
  ).trim();
  const title = String(formData.get("title") || "").trim();
  const locationArea = String(formData.get("locationArea") || "").trim();
  const inspectionDateRaw = String(formData.get("inspectionDate") || "").trim();
  const resultStatus = String(formData.get("resultStatus") || "PASSED").trim();
  const severity = String(formData.get("severity") || "NORMAL").trim();
  const findingsOrDefects = String(
    formData.get("findingsOrDefects") || ""
  ).trim();
  const correctiveAction =
    String(formData.get("correctiveAction") || "").trim() || null;
  const complianceScorePct =
    parseFloat(String(formData.get("complianceScorePct") || "95")) || 95;
  const responsiblePersonIdRaw = String(
    formData.get("responsiblePersonId") || ""
  ).trim();

  if (!projectId || !title || !locationArea || !findingsOrDefects) {
    return {
      error:
        "Project, Title, Location Area, and Findings/Observations are required.",
    };
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: ctx.organization.id },
    });
    if (!project) return { error: "Project not found." };

    const count = await prisma.qualitySafetyInspection.count({
      where: { organizationId: ctx.organization.id },
    });
    const prefix = recordDomain === "QUALITY_INSPECTION" ? "QSI" : "SAF";
    const recordNumber = `${prefix}-2026-${String(count + 1).padStart(3, "0")}`;

    const isClosed =
      resultStatus === "PASSED" || resultStatus === "INCIDENT_CONTAINED";

    await prisma.$transaction(async (tx) => {
      const created = await tx.qualitySafetyInspection.create({
        data: {
          organizationId: ctx.organization.id,
          projectId,
          siteId: siteIdRaw || null,
          phaseId: phaseIdRaw || null,
          recordNumber,
          recordDomain,
          inspectionOrIncidentType,
          title,
          locationArea,
          inspectionDate: inspectionDateRaw
            ? new Date(inspectionDateRaw)
            : new Date(),
          resultStatus,
          severity,
          findingsOrDefects,
          correctiveAction,
          complianceScorePct,
          inspectorOrReporterId: ctx.user.id,
          responsiblePersonId: responsiblePersonIdRaw || ctx.user.id,
          closedAt: isClosed ? new Date() : null,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: "QUALITY_SAFETY_RECORDED",
          entity: "QualitySafetyInspection",
          entityId: created.id,
          description: `Recorded ${recordDomain} ${recordNumber} (${title}) on ${project.code} — Status: ${resultStatus}.`,
        },
      });

      if (
        resultStatus === "FAILED_HOLD_POINT" ||
        resultStatus === "REQUIRES_CORRECTION" ||
        recordDomain === "SAFETY_INCIDENT"
      ) {
        await tx.notification.create({
          data: {
            organizationId: ctx.organization.id,
            title: `${recordNumber}: ${title} (${project.code})`,
            message: `${resultStatus.replace(/_/g, " ")} at ${locationArea}.`,
            type:
              resultStatus === "FAILED_HOLD_POINT" || severity === "CRITICAL"
                ? "CRITICAL"
                : "WARNING",
            category: "SITE",
            link: "/operations/inspections",
          },
        });
      }
    });

    revalidatePath("/operations/inspections");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    console.error("createQualitySafetyRecordAction error:", err);
    return { error: "Failed to save Quality/Safety record." };
  }
}

// ----------------------------------------------------------------------------
// 7. UPDATE QUALITY / SAFETY CORRECTIVE ACTION & SIGN-OFF
// ----------------------------------------------------------------------------
export async function updateQualitySafetyRecordAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const recordId = String(formData.get("recordId") || "").trim();
  const resultStatus = String(formData.get("resultStatus") || "PASSED").trim();
  const correctiveAction = String(
    formData.get("correctiveAction") || ""
  ).trim();
  const complianceScorePct =
    parseFloat(String(formData.get("complianceScorePct") || "95")) || 95;

  if (!recordId) return { error: "Record ID is required." };

  try {
    const existing = await prisma.qualitySafetyInspection.findFirst({
      where: { id: recordId, organizationId: ctx.organization.id },
    });
    if (!existing) return { error: "Record not found." };

    const isClosed =
      resultStatus === "PASSED" ||
      resultStatus === "PASSED_WITH_OBSERVATIONS" ||
      resultStatus === "INCIDENT_CONTAINED";

    await prisma.qualitySafetyInspection.update({
      where: { id: existing.id },
      data: {
        resultStatus,
        correctiveAction: correctiveAction || existing.correctiveAction,
        complianceScorePct,
        closedAt: isClosed ? new Date() : null,
      },
    });

    revalidatePath("/operations/inspections");
    revalidatePath(`/projects/${existing.projectId}`);
    return { success: true };
  } catch (err) {
    console.error("updateQualitySafetyRecordAction error:", err);
    return { error: "Failed to update Quality/Safety record." };
  }
}
