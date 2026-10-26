"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { computeBudgetLineStatus } from "@/lib/utils";

function revalidatePhase7Paths(projectId?: string | null) {
  revalidatePath("/people/workforce");
  revalidatePath("/people/contractors");
  revalidatePath("/equipment");
  revalidatePath("/finance/budgets");
  revalidatePath("/projects");
  revalidatePath("/");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function createSiteWorkerAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("workforce:manage") ||
    ctx.can("projects:manage") ||
    ctx.can("site_reports:submit");

  if (!canManage) {
    return {
      error: "You do not have permission to enroll workforce members.",
    };
  }

  const workerCode = String(formData.get("workerCode") || "")
    .trim()
    .toUpperCase();
  const fullName = String(formData.get("fullName") || "").trim();
  const nationalId = String(formData.get("nationalId") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim();
  const workerCategory = String(
    formData.get("workerCategory") || "SKILLED_ARTISAN"
  ).trim();
  const tradeRole = String(formData.get("tradeRole") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim();
  const siteId = String(formData.get("siteId") || "").trim() || null;
  const dailyRate = Math.max(0, Number(formData.get("dailyRate") || 0));
  const overtimeHourlyRate = Math.max(
    0,
    Number(formData.get("overtimeHourlyRate") || 0)
  );
  const notes = String(formData.get("notes") || "").trim() || null;

  if (
    !workerCode ||
    !fullName ||
    !phone ||
    !tradeRole ||
    !projectId ||
    dailyRate <= 0
  ) {
    return {
      error:
        "Worker code, full name, M-Pesa phone, trade role, project, and daily rate are required.",
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organization.id },
  });

  if (!project) {
    return { error: "Selected project was not found." };
  }

  const existing = await prisma.siteWorker.findUnique({
    where: {
      organizationId_workerCode: {
        organizationId: ctx.organization.id,
        workerCode,
      },
    },
  });

  if (existing) {
    return { error: `Worker code '${workerCode}' already exists.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.siteWorker.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        siteId,
        workerCode,
        fullName,
        nationalId,
        phone,
        workerCategory,
        tradeRole,
        dailyRate,
        overtimeHourlyRate,
        daysWorked: 0,
        overtimeHours: 0,
        totalEarned: 0,
        totalPaid: 0,
        unpaidBalance: 0,
        paymentStatus: "PAID",
        status: "ACTIVE",
        notes,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SITE_WORKER_ENROLLED",
        entity: "SiteWorker",
        entityId: workerCode,
        details: `Enrolled ${fullName} (${workerCode} — ${tradeRole}) on ${project.name} @ ${ctx.organization.currency} ${dailyRate}/day.`,
      },
    });
  });

  revalidatePhase7Paths(project.id);
  return { success: true };
}

export async function recordWorkerAttendanceAndPaymentAction(
  formData: FormData
) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("workforce:manage") ||
    ctx.can("payments:manage") ||
    ctx.can("projects:manage") ||
    ctx.can("site_reports:submit");

  if (!canManage) {
    return {
      error:
        "You do not have permission to log muster attendance or wage payments.",
    };
  }

  const workerId = String(formData.get("workerId") || "").trim();
  const daysCredited = Math.max(0, Number(formData.get("daysCredited") || 0));
  const overtimeHours = Math.max(0, Number(formData.get("overtimeHours") || 0));
  const wagePaymentAmount = Math.max(
    0,
    Number(formData.get("wagePaymentAmount") || 0)
  );
  const workAreaOrActivity = String(
    formData.get("workAreaOrActivity") || "Daily Site Muster Shift"
  ).trim();
  const attendanceDateRaw = String(
    formData.get("attendanceDate") || ""
  ).trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (daysCredited <= 0 && overtimeHours <= 0 && wagePaymentAmount <= 0) {
    return {
      error:
        "Please enter days worked, overtime hours, or a muster wage payment amount.",
    };
  }

  const worker = await prisma.siteWorker.findFirst({
    where: { id: workerId, organizationId: ctx.organization.id },
    include: { project: true },
  });

  if (!worker) {
    return { error: "Worker record not found." };
  }

  const shiftWage =
    Math.round(
      (daysCredited * worker.dailyRate +
        overtimeHours * worker.overtimeHourlyRate) *
        100
    ) / 100;

  const nextDaysWorked =
    Math.round((worker.daysWorked + daysCredited) * 100) / 100;
  const nextOvertimeHours =
    Math.round((worker.overtimeHours + overtimeHours) * 100) / 100;
  const nextTotalEarned =
    Math.round((worker.totalEarned + shiftWage) * 100) / 100;
  const nextTotalPaid = Math.min(
    nextTotalEarned,
    Math.round((worker.totalPaid + wagePaymentAmount) * 100) / 100
  );
  const nextUnpaidBalance = Math.max(
    0,
    Math.round((nextTotalEarned - nextTotalPaid) * 100) / 100
  );

  const nextPaymentStatus =
    nextUnpaidBalance <= 0
      ? "PAID"
      : nextUnpaidBalance > worker.dailyRate * 6
        ? "UNPAID_MUSTER"
        : "PARTIALLY_PAID";

  await prisma.$transaction(async (tx) => {
    if (daysCredited > 0 || overtimeHours > 0) {
      await tx.workerAttendanceLog.create({
        data: {
          organizationId: ctx.organization.id,
          workerId: worker.id,
          projectId: worker.projectId,
          siteId: worker.siteId,
          attendanceDate: attendanceDateRaw
            ? new Date(attendanceDateRaw)
            : new Date(),
          daysCredited,
          overtimeHours,
          dailyWageAmount: shiftWage,
          workAreaOrActivity,
          notes,
          recordedById: ctx.user.id,
        },
      });
    }

    await tx.siteWorker.update({
      where: { id: worker.id },
      data: {
        daysWorked: nextDaysWorked,
        overtimeHours: nextOvertimeHours,
        totalEarned: nextTotalEarned,
        totalPaid: nextTotalPaid,
        unpaidBalance: nextUnpaidBalance,
        paymentStatus: nextPaymentStatus,
      },
    });

    // Sync newly accrued labour cost to Project LABOUR BudgetLine & Project actualCost
    if (shiftWage > 0) {
      const labourBudget = await tx.projectBudgetLine.findFirst({
        where: {
          projectId: worker.projectId,
          category: "LABOUR",
        },
      });

      if (labourBudget) {
        const nextCommitted = labourBudget.committedCost + shiftWage;
        const nextActual = labourBudget.actualCost + shiftWage;
        await tx.projectBudgetLine.update({
          where: { id: labourBudget.id },
          data: {
            committedCost: nextCommitted,
            actualCost: nextActual,
            status: computeBudgetLineStatus(
              labourBudget.allocatedBudget,
              nextCommitted,
              nextActual,
              labourBudget.alertThresholdPct
            ),
            updatedById: ctx.user.id,
          },
        });
      }

      await tx.project.update({
        where: { id: worker.projectId },
        data: {
          committedCost: worker.project.committedCost + shiftWage,
          actualCost: worker.project.actualCost + shiftWage,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "WORKER_MUSTER_UPDATED",
        entity: "SiteWorker",
        entityId: worker.workerCode,
        details: `Updated muster roll for ${worker.fullName}: +${daysCredited}d, +${overtimeHours}h OT (Shift Wage: ${ctx.organization.currency} ${shiftWage.toLocaleString()}, Paid: ${ctx.organization.currency} ${wagePaymentAmount.toLocaleString()}).`,
      },
    });
  });

  revalidatePhase7Paths(worker.projectId);
  return { success: true };
}

export async function createSubcontractorAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("contractors:manage") ||
    ctx.can("procurement:manage") ||
    ctx.can("projects:manage");

  if (!canManage) {
    return {
      error: "You do not have permission to register subcontractors.",
    };
  }

  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const companyName = String(formData.get("companyName") || "").trim();
  const specialization = String(
    formData.get("specialization") || "ELECTRICAL_SOLAR"
  ).trim();
  const contactPerson = String(formData.get("contactPerson") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const ncaCategory = String(formData.get("ncaCategory") || "").trim() || null;
  const projectId = String(formData.get("projectId") || "").trim();
  const siteId = String(formData.get("siteId") || "").trim() || null;
  const scopeOfWorks = String(formData.get("scopeOfWorks") || "").trim();
  const contractValue = Math.max(0, Number(formData.get("contractValue") || 0));
  const retentionPct = Math.max(0, Number(formData.get("retentionPct") ?? 10));
  const startDateRaw = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const paymentTerms = String(
    formData.get("paymentTerms") ||
      "Monthly Interim Valuation (Less 10% Retention)"
  ).trim();

  if (
    !code ||
    !companyName ||
    !contactPerson ||
    !phone ||
    !projectId ||
    !scopeOfWorks ||
    contractValue <= 0
  ) {
    return {
      error:
        "Subcontractor code, company name, contact, project, scope of works, and contract value are required.",
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: ctx.organization.id },
  });

  if (!project) {
    return { error: "Selected project was not found." };
  }

  const existing = await prisma.subcontractor.findUnique({
    where: {
      organizationId_code: {
        organizationId: ctx.organization.id,
        code,
      },
    },
  });

  if (existing) {
    return { error: `Subcontractor code '${code}' already exists.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.subcontractor.create({
      data: {
        organizationId: ctx.organization.id,
        projectId: project.id,
        siteId,
        code,
        companyName,
        specialization,
        contactPerson,
        phone,
        email: email || "contracts@subcontractor.co.ke",
        ncaCategory,
        scopeOfWorks,
        contractValue,
        certifiedAmount: 0,
        paidAmount: 0,
        retentionPct,
        outstandingBalance: 0,
        startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
        endDate: endDateRaw
          ? new Date(endDateRaw)
          : new Date(Date.now() + 180 * 86400000),
        paymentTerms,
        performanceRating: 4.8,
        progressPct: 0,
        status: "ACTIVE_ON_SITE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SUBCONTRACTOR_AWARDED",
        entity: "Subcontractor",
        entityId: code,
        details: `Awarded subcontract ${code} (${companyName}) on ${project.name} valued at ${ctx.organization.currency} ${contractValue.toLocaleString()}.`,
      },
    });
  });

  revalidatePhase7Paths(project.id);
  return { success: true };
}

export async function updateSubcontractorValuationAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("contractors:manage") ||
    ctx.can("boq:manage") ||
    ctx.can("payments:manage") ||
    ctx.can("projects:manage");

  if (!canManage) {
    return {
      error: "You do not have permission to update subcontractor valuations.",
    };
  }

  const subcontractorId = String(formData.get("subcontractorId") || "").trim();
  const certifiedAmount = Math.max(
    0,
    Number(formData.get("certifiedAmount") || 0)
  );
  const paidAmount = Math.max(0, Number(formData.get("paidAmount") || 0));
  const progressPct = Math.min(
    100,
    Math.max(0, Number(formData.get("progressPct") || 0))
  );
  const performanceRating = Math.min(
    5,
    Math.max(1, Number(formData.get("performanceRating") || 4.8))
  );
  const status = String(formData.get("status") || "ACTIVE_ON_SITE").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  const sub = await prisma.subcontractor.findFirst({
    where: { id: subcontractorId, organizationId: ctx.organization.id },
  });

  if (!sub) {
    return { error: "Subcontractor record not found." };
  }

  const outstandingBalance = Math.max(0, certifiedAmount - paidAmount);

  await prisma.$transaction(async (tx) => {
    await tx.subcontractor.update({
      where: { id: sub.id },
      data: {
        certifiedAmount,
        paidAmount,
        outstandingBalance,
        progressPct,
        performanceRating,
        status: progressPct >= 100 ? "COMPLETED" : status,
        notes,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SUBCONTRACTOR_VALUATION_UPDATED",
        entity: "Subcontractor",
        entityId: sub.code,
        details: `Updated ${sub.companyName} (${sub.code}): Certified ${ctx.organization.currency} ${certifiedAmount.toLocaleString()}, Paid ${ctx.organization.currency} ${paidAmount.toLocaleString()} (${progressPct}% complete).`,
      },
    });
  });

  revalidatePhase7Paths(sub.projectId);
  return { success: true };
}

export async function createEquipmentAssetAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("projects:manage") ||
    ctx.can("procurement:manage") ||
    ctx.can("site_reports:submit");

  if (!canManage) {
    return {
      error: "You do not have permission to register plant & equipment.",
    };
  }

  const assetCode = String(formData.get("assetCode") || "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") || "").trim();
  const category = String(
    formData.get("category") || "TOWER_MOBILE_CRANE"
  ).trim();
  const ownershipType = String(
    formData.get("ownershipType") || "OWNED"
  ).trim();
  const vendorOrLessor =
    String(formData.get("vendorOrLessor") || "").trim() || null;
  const registrationOrSerial = String(
    formData.get("registrationOrSerial") || ""
  ).trim();
  const projectId = String(formData.get("projectId") || "").trim() || null;
  const operatorName =
    String(formData.get("operatorName") || "").trim() || null;
  const operatorPhone =
    String(formData.get("operatorPhone") || "").trim() || null;
  const dailyRate = Math.max(0, Number(formData.get("dailyRate") || 0));
  const availabilityStatus = projectId ? "DEPLOYED_ACTIVE" : "AVAILABLE_YARD";
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!assetCode || !name || !registrationOrSerial) {
    return {
      error:
        "Asset code, equipment name, and registration/serial number are required.",
    };
  }

  const existing = await prisma.equipmentAsset.findUnique({
    where: {
      organizationId_assetCode: {
        organizationId: ctx.organization.id,
        assetCode,
      },
    },
  });

  if (existing) {
    return { error: `Equipment asset code '${assetCode}' already exists.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.equipmentAsset.create({
      data: {
        organizationId: ctx.organization.id,
        projectId,
        assetCode,
        name,
        category,
        ownershipType,
        vendorOrLessor,
        registrationOrSerial,
        operatorName,
        operatorPhone,
        availabilityStatus,
        dailyRate,
        totalHoursLogged: 0,
        fuelLitresLogged: 0,
        totalOperatingCost: 0,
        nextServiceDueDate: new Date(Date.now() + 45 * 86400000),
        notes,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "EQUIPMENT_ASSET_REGISTERED",
        entity: "EquipmentAsset",
        entityId: assetCode,
        details: `Registered ${name} (${assetCode} • ${registrationOrSerial}).`,
      },
    });
  });

  revalidatePhase7Paths(projectId);
  return { success: true };
}

export async function recordEquipmentMaintenanceOrUsageAction(
  formData: FormData
) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized" };

  const canManage =
    ctx.can("projects:manage") ||
    ctx.can("procurement:manage") ||
    ctx.can("site_reports:submit");

  if (!canManage) {
    return {
      error: "You do not have permission to log plant maintenance or usage.",
    };
  }

  const equipmentId = String(formData.get("equipmentId") || "").trim();
  const mode = String(formData.get("mode") || "MAINTENANCE").trim(); // MAINTENANCE or DEPLOYMENT_USAGE

  const equipment = await prisma.equipmentAsset.findFirst({
    where: { id: equipmentId, organizationId: ctx.organization.id },
  });

  if (!equipment) {
    return { error: "Equipment asset not found." };
  }

  if (mode === "DEPLOYMENT_USAGE") {
    const projectId = String(formData.get("projectId") || "").trim() || null;
    const availabilityStatus = String(
      formData.get("availabilityStatus") || equipment.availabilityStatus
    ).trim();
    const additionalHours = Math.max(
      0,
      Number(formData.get("additionalHours") || 0)
    );
    const additionalFuelLitres = Math.max(
      0,
      Number(formData.get("additionalFuelLitres") || 0)
    );
    const additionalCost = Math.max(
      0,
      Number(formData.get("additionalCost") || 0)
    );
    const operatorName =
      String(formData.get("operatorName") || "").trim() ||
      equipment.operatorName;

    await prisma.$transaction(async (tx) => {
      await tx.equipmentAsset.update({
        where: { id: equipment.id },
        data: {
          projectId,
          availabilityStatus,
          operatorName,
          totalHoursLogged: equipment.totalHoursLogged + additionalHours,
          fuelLitresLogged: equipment.fuelLitresLogged + additionalFuelLitres,
          totalOperatingCost: equipment.totalOperatingCost + additionalCost,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          action: "EQUIPMENT_USAGE_LOGGED",
          entity: "EquipmentAsset",
          entityId: equipment.assetCode,
          details: `Updated ${equipment.assetCode} (${equipment.name}): +${additionalHours}h, +${additionalFuelLitres}L fuel, Status: ${availabilityStatus}.`,
        },
      });
    });

    revalidatePhase7Paths(projectId || equipment.projectId);
    return { success: true };
  }

  // Otherwise: Log Maintenance / DOSHS Inspection
  const logNumber = String(formData.get("logNumber") || "")
    .trim()
    .toUpperCase();
  const maintenanceType = String(
    formData.get("maintenanceType") || "PREVENTIVE_SERVICE"
  ).trim();
  const title = String(formData.get("title") || "").trim();
  const technicianOrWorkshop = String(
    formData.get("technicianOrWorkshop") || ""
  ).trim();
  const costAmount = Math.max(0, Number(formData.get("costAmount") || 0));
  const status = String(formData.get("status") || "COMPLETED").trim();
  const nextDueHoursOrDate =
    String(formData.get("nextDueHoursOrDate") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!logNumber || !title || !technicianOrWorkshop) {
    return {
      error:
        "Maintenance log number, service title, and workshop/technician are required.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.equipmentMaintenanceLog.create({
      data: {
        organizationId: ctx.organization.id,
        equipmentId: equipment.id,
        projectId: equipment.projectId,
        logNumber,
        maintenanceType,
        title,
        serviceDate: new Date(),
        nextDueHoursOrDate,
        costAmount,
        technicianOrWorkshop,
        status,
        notes,
        recordedById: ctx.user.id,
      },
    });

    await tx.equipmentAsset.update({
      where: { id: equipment.id },
      data: {
        totalOperatingCost: equipment.totalOperatingCost + costAmount,
        availabilityStatus:
          status === "IN_WORKSHOP"
            ? "UNDER_MAINTENANCE"
            : equipment.availabilityStatus === "UNDER_MAINTENANCE" &&
                status === "COMPLETED"
              ? equipment.projectId
                ? "DEPLOYED_ACTIVE"
                : "AVAILABLE_YARD"
              : equipment.availabilityStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "EQUIPMENT_MAINTENANCE_LOGGED",
        entity: "EquipmentMaintenanceLog",
        entityId: logNumber,
        details: `Logged ${logNumber} for ${equipment.assetCode} (${title}) — Cost: ${ctx.organization.currency} ${costAmount.toLocaleString()}.`,
      },
    });
  });

  revalidatePhase7Paths(equipment.projectId);
  return { success: true };
}
