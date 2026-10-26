"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeTextInput } from "@/lib/security";
import { getSaasPlanDefinition, type SaasPlanKey } from "@/lib/saas-plans";

/**
 * Switches or upgrades the active organization's SaaS subscription plan
 * (STARTER_BUILDER, PROFESSIONAL, ENTERPRISE, or TRIAL_ENTERPRISE).
 */
export async function changeOrganizationSubscriptionPlanAction(
  formData: FormData
) {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Unauthenticated." };

  const targetPlan = String(
    formData.get("planKey") || "PROFESSIONAL"
  ).toUpperCase() as SaasPlanKey;
  const planDef = getSaasPlanDefinition(targetPlan);
  const previousPlan = ctx.organization.plan;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: ctx.organization.id },
      data: {
        plan: planDef.key,
        status: "ACTIVE",
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SAAS_PLAN_CHANGED",
        entity: "OrganizationSubscription",
        entityId: ctx.organization.id,
        description: `Updated Structa SaaS subscription plan for ${ctx.organization.name} from ${previousPlan} to ${planDef.name} (${planDef.key}).`,
        previousValue: previousPlan,
        newValue: planDef.key,
      },
    }),
    prisma.notification.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        title: `Subscription Plan Updated: ${planDef.name}`,
        message: `${ctx.organization.name} is now running on the Structa ${planDef.name} tier (${planDef.maxActiveProjects} active project quota, ${planDef.maxTeamUsers} team seats).`,
        type: "SUCCESS",
        category: "SYSTEM",
        link: "/saas",
      },
    }),
  ]);

  revalidatePath("/saas");
  revalidatePath("/settings");
  revalidatePath("/");

  return { ok: true, planName: planDef.name };
}

/**
 * Records a SaaS subscription invoice payment (M-Pesa Paybill 4082210, Corporate Card, or Bank Wire)
 * and activates the selected commercial plan.
 */
export async function recordSaasSubscriptionPaymentAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { ok: false, error: "Unauthenticated." };

  const planKey = String(
    formData.get("planKey") || ctx.organization.plan
  ).toUpperCase() as SaasPlanKey;
  const billingCycle = String(formData.get("billingCycle") || "MONTHLY");
  const paymentMethod = sanitizeTextInput(
    String(formData.get("paymentMethod") || "MPESA_PAYBILL"),
    60
  );
  const transactionRef = sanitizeTextInput(
    String(
      formData.get("transactionRef") ||
        `SAAS-QKL${Math.floor(100000 + Math.random() * 900000)}`
    ),
    80
  );

  const planDef = getSaasPlanDefinition(planKey);
  const baseAmount =
    billingCycle === "ANNUAL"
      ? planDef.annualPriceKes
      : planDef.monthlyPriceKes;
  const vatAmount = Math.round(baseAmount * 0.16);
  const totalAmount = baseAmount + vatAmount;

  const invoiceNumber = `VSL-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: ctx.organization.id },
      data: {
        plan: planDef.key,
        status: "ACTIVE",
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "SAAS_SUBSCRIPTION_PAYMENT",
        entity: "SaasBillingInvoice",
        entityId: invoiceNumber,
        description: `Paid KES ${totalAmount.toLocaleString()} (incl. 16% VAT) for Structa ${planDef.name} [${billingCycle}] via ${paymentMethod} (Ref: ${transactionRef}).`,
        previousValue: ctx.organization.plan,
        newValue: `${planDef.key} | ${invoiceNumber} | Ref: ${transactionRef} | KES ${totalAmount.toLocaleString()}`,
      },
    }),
    prisma.notification.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        title: `SaaS Receipt ${invoiceNumber} Confirmed`,
        message: `Versaly Billing confirmed KES ${totalAmount.toLocaleString()} via ${paymentMethod} (Ref: ${transactionRef}) for ${planDef.name} (${billingCycle}).`,
        type: "SUCCESS",
        category: "FINANCE",
        link: "/saas",
      },
    }),
  ]);

  revalidatePath("/saas");
  revalidatePath("/audit-logs");
  revalidatePath("/");

  return {
    ok: true,
    invoiceNumber,
    totalAmount,
  };
}

/**
 * Self-Service Multi-Tenant Organization Onboarding Wizard Action.
 * Provisions a brand-new construction company on Structa with its own isolated tenant ID,
 * Organization Owner user, initial client, flagship project & 4 phases, watchdog rule,
 * and optional immediate session switch.
 */
export async function onboardNewConstructionOrganizationAction(
  formData: FormData
) {
  const companyName = sanitizeTextInput(
    String(formData.get("companyName") || ""),
    140
  );
  const rawCode = sanitizeTextInput(
    String(formData.get("companyCode") || ""),
    30
  ).toUpperCase();
  const ncaRegistration = sanitizeTextInput(
    String(formData.get("ncaRegistration") || "NCA1 — Building & Civil Works"),
    100
  );
  const taxPin = sanitizeTextInput(
    String(formData.get("taxPin") || "P051998821K"),
    40
  );
  const city = sanitizeTextInput(
    String(formData.get("city") || "Nairobi"),
    60
  );
  const ownerName = sanitizeTextInput(
    String(formData.get("ownerName") || ""),
    100
  );
  const ownerEmail = sanitizeTextInput(
    String(formData.get("ownerEmail") || ""),
    120
  ).toLowerCase();
  const ownerPhone = sanitizeTextInput(
    String(formData.get("ownerPhone") || "+254 722 800 900"),
    40
  );
  const initialPlan = String(
    formData.get("initialPlan") || "TRIAL_ENTERPRISE"
  ).toUpperCase() as SaasPlanKey;
  const flagshipProjectName = sanitizeTextInput(
    String(formData.get("flagshipProjectName") || "Headquarters Commercial Tower"),
    140
  );
  const flagshipContractValue =
    Number(formData.get("flagshipContractValue") || 185000000) || 185000000;
  const switchImmediately = formData.get("switchImmediately") === "true";

  if (!companyName || !ownerName || !ownerEmail) {
    return {
      ok: false,
      error: "Company name, owner full name, and owner email are required.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });
  if (existingUser) {
    return {
      ok: false,
      error: `Email '${ownerEmail}' is already registered on Structa. Please use a unique email address.`,
    };
  }

  const slugBase = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSuffix = Math.floor(100 + Math.random() * 900);
  const slug = `${slugBase}-${uniqueSuffix}`;
  const code =
    rawCode ||
    `ORG-${slugBase.slice(0, 6).toUpperCase()}-${uniqueSuffix}`;

  const now = new Date();
  const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const projectBudget = Math.round(flagshipContractValue * 0.84);

  const created = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: companyName,
        slug,
        code,
        city,
        country: "Kenya",
        taxPin,
        ncaRegistration,
        currency: "KSh",
        plan: initialPlan,
        status: "ACTIVE",
      },
    });

    const owner = await tx.user.create({
      data: {
        organizationId: org.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash: "demo123",
        phone: ownerPhone,
        jobTitle: "Managing Director & Founder",
        department: "Executive Directorate",
        employeeCode: "EMP-001",
        role: "ORGANIZATION_OWNER",
        status: "ACTIVE",
      },
    });

    const client = await tx.client.create({
      data: {
        organizationId: org.id,
        name: `${city} Premier Developments Ltd.`,
        code: "CLI-001",
        clientType: "PRIVATE_DEVELOPER",
        contactPerson: "Board Project Director",
        phone: "+254 711 400 200",
        email: `projects@${slugBase}.co.ke`,
        city,
      },
    });

    const project = await tx.project.create({
      data: {
        organizationId: org.id,
        code: "PRJ-2026-001",
        name: flagshipProjectName,
        projectType: "COMMERCIAL",
        location: `${city} CBD Construction Zone`,
        county: city,
        description: `Flagship construction project provisioned during Structa SaaS onboarding for ${companyName}.`,
        clientId: client.id,
        projectManagerId: owner.id,
        siteManagerId: owner.id,
        quantitySurveyorId: owner.id,
        startDate: now,
        expectedCompletionDate: sixMonthsLater,
        contractValue: flagshipContractValue,
        budget: projectBudget,
        committedCost: Math.round(projectBudget * 0.15),
        actualCost: Math.round(projectBudget * 0.08),
        status: "ACTIVE",
        plannedProgress: 12,
        progress: 10,
      },
    });

    await tx.site.create({
      data: {
        organizationId: org.id,
        projectId: project.id,
        code: "SITE-001",
        name: `${flagshipProjectName} — Main Works Site`,
        location: `${city}, Kenya`,
        county: city,
        siteManagerId: owner.id,
        status: "ACTIVE",
      },
    });

    await tx.projectPhase.createMany({
      data: [
        {
          organizationId: org.id,
          projectId: project.id,
          sequenceOrder: 1,
          name: "Site Mobilization & Earthworks",
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 86400000),
          budget: Math.round(projectBudget * 0.15),
          actualCost: Math.round(projectBudget * 0.08),
          plannedProgress: 60,
          progress: 55,
          status: "IN_PROGRESS",
          leadUserId: owner.id,
        },
        {
          organizationId: org.id,
          projectId: project.id,
          sequenceOrder: 2,
          name: "Substructure & RC Foundations",
          startDate: new Date(now.getTime() + 31 * 86400000),
          endDate: new Date(now.getTime() + 90 * 86400000),
          budget: Math.round(projectBudget * 0.35),
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: owner.id,
        },
        {
          organizationId: org.id,
          projectId: project.id,
          sequenceOrder: 3,
          name: "Superstructure Frame & Slabs",
          startDate: new Date(now.getTime() + 91 * 86400000),
          endDate: new Date(now.getTime() + 150 * 86400000),
          budget: Math.round(projectBudget * 0.35),
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: owner.id,
        },
        {
          organizationId: org.id,
          projectId: project.id,
          sequenceOrder: 4,
          name: "MEP Installations & Finishes",
          startDate: new Date(now.getTime() + 151 * 86400000),
          endDate: sixMonthsLater,
          budget: Math.round(projectBudget * 0.15),
          actualCost: 0,
          plannedProgress: 0,
          progress: 0,
          status: "NOT_STARTED",
          leadUserId: owner.id,
        },
      ],
    });

    await tx.automationWatchdogRule.create({
      data: {
        organizationId: org.id,
        ruleCode: "AUTO-RULE-001",
        ruleType: "BUDGET_THRESHOLD_EXCEEDED",
        name: "Category Budget Overrun Watchdog (85%)",
        description: "Alerts leadership when committed + actual spend reaches 85% of allocated budget.",
        thresholdCondition: "Exposure >= 85%",
        severity: "CRITICAL",
        isEnabled: true,
      },
    });

    await tx.notification.create({
      data: {
        organizationId: org.id,
        userId: owner.id,
        title: `Welcome to Structa Construction OS — ${companyName}`,
        message: `Your isolated multi-tenant workspace (${code}) and flagship project "${flagshipProjectName}" have been provisioned on the ${initialPlan} plan.`,
        type: "SUCCESS",
        category: "SYSTEM",
        link: "/projects",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        userId: owner.id,
        action: "TENANT_ORGANIZATION_ONBOARDED",
        entity: "Organization",
        entityId: org.id,
        description: `Provisioned new construction organization "${companyName}" (${code}) on plan ${initialPlan} with flagship project "${flagshipProjectName}".`,
        previousValue: "NEW_TENANT_PROVISIONING",
        newValue: `${code} | ${initialPlan} | Owner: ${ownerEmail}`,
      },
    });

    return { org, owner };
  });

  if (switchImmediately) {
    await setSessionCookie({
      userId: created.owner.id,
      organizationId: created.org.id,
      role: "ORGANIZATION_OWNER",
      email: created.owner.email,
      name: created.owner.name,
    });
  }

  revalidatePath("/saas");
  revalidatePath("/projects");
  revalidatePath("/");

  return {
    ok: true,
    organizationName: created.org.name,
    organizationCode: created.org.code,
    ownerEmail: created.owner.email,
    switched: switchImmediately,
  };
}
