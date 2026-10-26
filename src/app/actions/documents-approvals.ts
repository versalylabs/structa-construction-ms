"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { sanitizeTextInput, validateFileUploadSecurity } from "@/lib/security";

export async function registerDocumentOrRevisionAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim() || null;
  const clientId = String(formData.get("clientId") || "").trim() || null;
  const title = sanitizeTextInput(String(formData.get("title") || ""), 200);
  const documentNumberRaw = sanitizeTextInput(String(formData.get("documentNumber") || ""), 60);
  const category = String(formData.get("category") || "CONTRACT").trim();
  const version = sanitizeTextInput(String(formData.get("version") || "v1.0"), 30);
  const rawFileName = String(formData.get("fileName") || "").trim();
  const fileSizeLabel = sanitizeTextInput(String(formData.get("fileSizeLabel") || "4.8 MB"), 30);
  const status = String(formData.get("status") || "APPROVED").trim();
  const notes = sanitizeTextInput(String(formData.get("notes") || ""), 1000) || null;
  const supersedePrior = formData.get("supersedePrior") === "true";

  if (!title || !rawFileName) return;

  const fileValidation = validateFileUploadSecurity(rawFileName, 4_800_000);
  if (!fileValidation.valid) {
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "FILE_UPLOAD_BLOCKED",
        entity: "ProjectDocument",
        entityId: organization.id,
        description: `Blocked unsafe document upload "${rawFileName}": ${fileValidation.reason}`,
      },
    });
    return;
  }
  const fileName = fileValidation.sanitizedFileName;

  const docCount = await prisma.projectDocument.count({
    where: { organizationId: organization.id },
  });
  const documentNumber =
    documentNumberRaw || `DOC-2026-${String(docCount + 1).padStart(3, "0")}`;

  let resolvedClientId = clientId;
  if (!resolvedClientId && projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    resolvedClientId = project?.clientId || null;
  }

  await prisma.$transaction(async (tx) => {
    if (supersedePrior && documentNumberRaw) {
      await tx.projectDocument.updateMany({
        where: {
          organizationId: organization.id,
          documentNumber: documentNumberRaw,
          ...(projectId ? { projectId } : {}),
          status: { not: "SUPERSEDED" },
        },
        data: {
          status: "SUPERSEDED",
        },
      });
    }

    await tx.projectDocument.create({
      data: {
        organizationId: organization.id,
        projectId,
        clientId: resolvedClientId,
        title,
        documentNumber,
        category,
        version,
        fileName,
        fileSizeLabel,
        status,
        notes,
        uploadedById: currentUser.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "DOCUMENT_REGISTERED",
        entity: "ProjectDocument",
        entityId: documentNumber,
        description: `Registered document ${documentNumber} (${version}) — "${title}" [${status}]`,
      },
    });
  });

  revalidatePath("/documents");
  revalidatePath("/documents/approvals");
  revalidatePath("/documents/client-portal");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function updateDocumentStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const documentId = String(formData.get("documentId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!documentId || !status) return;

  const existing = await prisma.projectDocument.findFirst({
    where: { id: documentId, organizationId: organization.id },
  });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.projectDocument.update({
      where: { id: documentId },
      data: {
        status,
        ...(notes ? { notes } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "DOCUMENT_STATUS_UPDATED",
        entity: "ProjectDocument",
        entityId: existing.documentNumber,
        description: `Updated document ${existing.documentNumber} (${existing.version}) status to ${status}`,
      },
    });
  });

  revalidatePath("/documents");
  revalidatePath("/documents/approvals");
}

export async function createApprovalWorkflowAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const phaseId = String(formData.get("phaseId") || "").trim() || null;
  const documentId = String(formData.get("documentId") || "").trim() || null;
  const approvalType = String(
    formData.get("approvalType") || "DRAWING_REVISION"
  ).trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const submittedToRole = String(
    formData.get("submittedToRole") || "Project Director & Lead Consultant"
  ).trim();
  const priority = String(formData.get("priority") || "HIGH").trim();
  const financialImpactAmount = Number(
    formData.get("financialImpactAmount") || 0
  );
  const dueDateRaw = String(formData.get("dueDate") || "").trim();

  if (!projectId || !title) return;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });

  const count = await prisma.approvalWorkflowItem.count({
    where: { organizationId: organization.id },
  });
  const approvalCode = `APR-2026-${String(count + 1).padStart(3, "0")}`;
  const dueDate = dueDateRaw
    ? new Date(dueDateRaw)
    : new Date(Date.now() + 3 * 86400000);

  await prisma.$transaction(async (tx) => {
    await tx.approvalWorkflowItem.create({
      data: {
        organizationId: organization.id,
        projectId,
        phaseId,
        documentId,
        clientId: project?.clientId || null,
        approvalCode,
        approvalType,
        title,
        description,
        submittedToRole,
        priority,
        financialImpactAmount,
        dueDate,
        status: "PENDING",
        requestedById: currentUser.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "APPROVAL_SUBMITTED",
        entity: "ApprovalWorkflowItem",
        entityId: approvalCode,
        description: `Submitted ${approvalCode} (${approvalType}) — "${title}" to ${submittedToRole}`,
      },
    });
  });

  revalidatePath("/documents/approvals");
  revalidatePath("/documents");
}

export async function decideApprovalWorkflowAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const approvalId = String(formData.get("approvalId") || "").trim();
  const status = String(formData.get("status") || "APPROVED").trim();
  const decisionNotes =
    String(formData.get("decisionNotes") || "").trim() || null;

  if (!approvalId || !status) return;

  const existing = await prisma.approvalWorkflowItem.findFirst({
    where: { id: approvalId, organizationId: organization.id },
  });
  if (!existing) return;

  const signatureStamp = `SIG-${currentUser.name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8)}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  await prisma.$transaction(async (tx) => {
    await tx.approvalWorkflowItem.update({
      where: { id: approvalId },
      data: {
        status,
        decisionNotes:
          decisionNotes ||
          (status === "APPROVED"
            ? "Verified and stamped Approved for Construction / Execution."
            : existing.decisionNotes),
        digitalSignatureRef:
          status === "APPROVED" || status === "CHANGES_REQUESTED"
            ? signatureStamp
            : existing.digitalSignatureRef,
        decidedById: currentUser.id,
        decidedAt: new Date(),
      },
    });

    if (existing.documentId && status === "APPROVED") {
      await tx.projectDocument.update({
        where: { id: existing.documentId },
        data: { status: "APPROVED" },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: `APPROVAL_${status}`,
        entity: "ApprovalWorkflowItem",
        entityId: existing.approvalCode,
        description: `Marked ${existing.approvalCode} as ${status} (${signatureStamp})`,
      },
    });
  });

  revalidatePath("/documents/approvals");
  revalidatePath("/documents");
}

export async function createClientPortalUpdateAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const projectId = String(formData.get("projectId") || "").trim();
  const updateCategory = String(
    formData.get("updateCategory") || "EXECUTIVE_PROGRESS_BRIEF"
  ).trim();
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const completionSnapshotPct = Math.min(
    100,
    Math.max(0, Number(formData.get("completionSnapshotPct") || 0))
  );
  const certifiedToDateAmount = Math.max(
    0,
    Number(formData.get("certifiedToDateAmount") || 0)
  );
  const attachmentRefLabel =
    String(formData.get("attachmentRefLabel") || "").trim() || null;

  if (!projectId || !title || !summary) return;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true, progress: true, invoicedAmount: true },
  });

  const count = await prisma.clientPortalUpdate.count({
    where: { organizationId: organization.id },
  });
  const portalCode = `CPU-2026-${String(count + 1).padStart(3, "0")}`;

  await prisma.$transaction(async (tx) => {
    await tx.clientPortalUpdate.create({
      data: {
        organizationId: organization.id,
        projectId,
        clientId: project?.clientId || null,
        portalCode,
        updateCategory,
        title,
        summary,
        completionSnapshotPct:
          completionSnapshotPct || project?.progress || 0,
        certifiedToDateAmount:
          certifiedToDateAmount || project?.invoicedAmount || 0,
        attachmentRefLabel,
        clientSignOffStatus: "AWAITING_CLIENT_REVIEW",
        publishedById: currentUser.id,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "CLIENT_PORTAL_PUBLISHED",
        entity: "ClientPortalUpdate",
        entityId: portalCode,
        description: `Published Client Portal dispatch ${portalCode} — "${title}"`,
      },
    });
  });

  revalidatePath("/documents/client-portal");
}

export async function submitClientPortalFeedbackAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return;
  const { organization, user: currentUser } = ctx;

  const updateId = String(formData.get("updateId") || "").trim();
  const clientSignOffStatus = String(
    formData.get("clientSignOffStatus") || "ACKNOWLEDGED"
  ).trim();
  const clientFeedbackNotes =
    String(formData.get("clientFeedbackNotes") || "").trim() || null;

  if (!updateId || !clientSignOffStatus) return;

  const existing = await prisma.clientPortalUpdate.findFirst({
    where: { id: updateId, organizationId: organization.id },
  });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.clientPortalUpdate.update({
      where: { id: updateId },
      data: {
        clientSignOffStatus,
        clientFeedbackNotes:
          clientFeedbackNotes ||
          (clientSignOffStatus === "ACKNOWLEDGED"
            ? "Client acknowledged and signed off on the executive progress pack."
            : existing.clientFeedbackNotes),
        acknowledgedAt:
          clientSignOffStatus === "ACKNOWLEDGED"
            ? new Date()
            : existing.acknowledgedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: currentUser.id,
        action: "CLIENT_PORTAL_SIGNOFF",
        entity: "ClientPortalUpdate",
        entityId: existing.portalCode,
        description: `Recorded client response on ${existing.portalCode}: ${clientSignOffStatus}`,
      },
    });
  });

  revalidatePath("/documents/client-portal");
}
