"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  getSessionContext,
  setSessionCookie,
} from "@/lib/auth";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  PermissionKey,
  ROLES,
  UserRole,
} from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit";
import { ensureSeedData } from "../../../prisma/seed";

export async function initializeDemoDataIfNeeded() {
  await ensureSeedData();
}

export async function loginAction(formData: FormData) {
  await ensureSeedData();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Please provide both email address and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user) {
    return { error: "Invalid email credentials or account not found." };
  }

  if (user.status !== "ACTIVE") {
    return { error: `Account status is ${user.status}. Please contact your Organization Administrator.` };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email credentials or password." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await recordAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    description: `${user.name} (${user.role}) signed in to ${user.organization.name}.`,
  });

  await setSessionCookie({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role as UserRole,
    email: user.email,
    name: user.name,
  });

  redirect("/");
}

export async function quickSwitchUserAction(userId: string) {
  await ensureSeedData();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Selected demo account is not active." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await recordAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "SESSION_SWITCHED",
    entity: "User",
    entityId: user.id,
    description: `Switched active operator session to ${user.name} (${ROLES[user.role as UserRole]?.label || user.role}).`,
  });

  await setSessionCookie({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role as UserRole,
    email: user.email,
    name: user.name,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logoutAction() {
  const ctx = await getSessionContext();
  if (ctx) {
    await recordAuditLog({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: ctx.user.id,
      description: `${ctx.user.name} signed out of Structa.`,
    });
  }
  await clearSessionCookie();
  redirect("/login");
}

const registerOrgSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  code: z.string().min(2, "Company code is required").max(12),
  ncaRegistration: z.string().optional(),
  taxPin: z.string().optional(),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(6, "Phone number is required"),
  ownerName: z.string().min(2, "Owner full name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerOrganizationAction(formData: FormData) {
  const parsed = registerOrgSchema.safeParse({
    companyName: formData.get("companyName"),
    code: formData.get("code"),
    ncaRegistration: formData.get("ncaRegistration") || "NCA-1 Building & Civil Works",
    taxPin: formData.get("taxPin") || "",
    city: formData.get("city") || "Nairobi",
    phone: formData.get("phone"),
    ownerName: formData.get("ownerName"),
    ownerEmail: String(formData.get("ownerEmail") || "").trim().toLowerCase(),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const data = parsed.data;
  const existingUser = await prisma.user.findUnique({
    where: { email: data.ownerEmail },
  });
  if (existingUser) {
    return { error: "An account with this email address already exists." };
  }

  const slugBase = data.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${Math.floor(100 + Math.random() * 900)}`;
  const passwordHash = await bcrypt.hash(data.password, 10);
  const cleanCode = data.code.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.companyName,
        slug,
        code: cleanCode,
        city: data.city,
        country: "Kenya",
        phone: data.phone,
        email: data.ownerEmail,
        taxPin: data.taxPin || null,
        ncaRegistration: data.ncaRegistration || null,
        currency: "KSh",
        timezone: "Africa/Nairobi",
        projectPrefix: `${cleanCode}-PRJ-`,
        invoicePrefix: `${cleanCode}-INV-`,
        poPrefix: `${cleanCode}-PO-`,
        mrPrefix: `${cleanCode}-MR-`,
        plan: "PROFESSIONAL",
        status: "ACTIVE",
      },
    });

    const roleEntries = Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][];
    for (const [role, perms] of roleEntries) {
      await tx.rolePermission.create({
        data: {
          organizationId: org.id,
          role,
          permissionsJson: JSON.stringify(perms),
        },
      });
    }

    const owner = await tx.user.create({
      data: {
        organizationId: org.id,
        name: data.ownerName,
        email: data.ownerEmail,
        passwordHash,
        phone: data.phone,
        jobTitle: "Managing Director & Organization Owner",
        department: "Executive Management",
        employeeCode: `${cleanCode}-001`,
        role: "ORGANIZATION_OWNER",
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        userId: owner.id,
        action: "ORGANIZATION_REGISTERED",
        entity: "Organization",
        entityId: org.id,
        description: `Registered new construction tenant organization: ${org.name} (${org.code}).`,
        newValue: JSON.stringify({ name: org.name, code: org.code, owner: owner.email }),
      },
    });

    await tx.notification.create({
      data: {
        organizationId: org.id,
        userId: owner.id,
        title: `Welcome to Structa — ${org.name}`,
        message: "Your isolated construction organization workspace and RBAC roles are configured.",
        type: "SUCCESS",
        category: "SYSTEM",
        link: "/settings",
        isRead: "FALSE",
      },
    });

    return { org, owner };
  });

  await setSessionCookie({
    userId: result.owner.id,
    organizationId: result.org.id,
    role: "ORGANIZATION_OWNER",
    email: result.owner.email,
    name: result.owner.name,
  });

  redirect("/");
}

const createUserSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  jobTitle: z.string().min(2, "Job title / designation is required"),
  department: z.string().min(2, "Department is required"),
  employeeCode: z.string().optional(),
  role: z.string(),
  password: z.string().min(6, "Initial password must be at least 6 characters"),
});

export async function createUserAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("users:manage")) {
    return { error: "Insufficient permissions: 'Manage Users & Roles' is required." };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: formData.get("phone") || "",
    jobTitle: formData.get("jobTitle"),
    department: formData.get("department"),
    employeeCode: formData.get("employeeCode") || "",
    role: formData.get("role"),
    password: formData.get("password") || "Structa@2026",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input fields." };
  }

  const data = parsed.data;
  if (!(data.role in ROLES)) {
    return { error: "Invalid construction role selected." };
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    return { error: "A user with that email address already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        organizationId: ctx.organization.id,
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone || null,
        jobTitle: data.jobTitle,
        department: data.department,
        employeeCode:
          data.employeeCode ||
          `${ctx.organization.code}-${Math.floor(100 + Math.random() * 899)}`,
        role: data.role,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "USER_CREATED",
        entity: "User",
        entityId: newUser.id,
        description: `${ctx.user.name} provisioned user ${newUser.name} as ${ROLES[newUser.role as UserRole]?.label || newUser.role}.`,
        newValue: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
        }),
      },
    });

    await tx.notification.create({
      data: {
        organizationId: ctx.organization.id,
        userId: null,
        title: `New Team Member Provisioned: ${newUser.name}`,
        message: `${newUser.name} was assigned the ${ROLES[newUser.role as UserRole]?.label} role in ${newUser.department}.`,
        type: "INFO",
        category: "SYSTEM",
        link: "/users",
        isRead: "FALSE",
      },
    });

    return newUser;
  });

  revalidatePath("/users");
  revalidatePath("/audit-logs");
  revalidatePath("/");
  return { success: true, user: created };
}

export async function updateUserRoleAndStatusAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("users:manage")) {
    return { error: "Insufficient permissions to modify user roles." };
  }

  const targetUserId = String(formData.get("userId") || "");
  const newRole = String(formData.get("role") || "") as UserRole;
  const newStatus = String(formData.get("status") || "ACTIVE");

  // Enforce strict tenant isolation on lookup
  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      organizationId: ctx.organization.id,
    },
  });

  if (!targetUser) {
    return { error: "Target user not found in your organization." };
  }

  if (targetUser.id === ctx.user.id && newStatus !== "ACTIVE") {
    return { error: "You cannot deactivate your own active operator account." };
  }

  const prevSnapshot = {
    role: targetUser.role,
    status: targetUser.status,
  };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUser.id },
      data: {
        role: newRole,
        status: newStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "USER_ROLE_STATUS_UPDATED",
        entity: "User",
        entityId: targetUser.id,
        description: `${ctx.user.name} updated ${targetUser.name}'s access (${prevSnapshot.role} → ${newRole}, ${prevSnapshot.status} → ${newStatus}).`,
        previousValue: JSON.stringify(prevSnapshot),
        newValue: JSON.stringify({ role: newRole, status: newStatus }),
      },
    });
  });

  revalidatePath("/users");
  revalidatePath("/audit-logs");
  revalidatePath("/");
  return { success: true };
}

export async function updateRolePermissionsAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("users:manage") && !ctx.can("settings:manage")) {
    return { error: "Insufficient permissions to configure role permissions." };
  }

  const role = String(formData.get("role") || "") as UserRole;
  if (!role || !(role in ROLES)) {
    return { error: "Invalid role specified." };
  }

  if (role === "SUPER_ADMIN" || role === "ORGANIZATION_OWNER") {
    return { error: "Owner and Super Admin roles retain full platform permissions by policy." };
  }

  const validKeys = new Set(PERMISSION_DEFINITIONS.map((p) => p.key));
  const selectedPermissions = formData
    .getAll("permissions")
    .map((p) => String(p) as PermissionKey)
    .filter((k) => validKeys.has(k));

  const existing = await prisma.rolePermission.findUnique({
    where: {
      organizationId_role: {
        organizationId: ctx.organization.id,
        role,
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.upsert({
      where: {
        organizationId_role: {
          organizationId: ctx.organization.id,
          role,
        },
      },
      create: {
        organizationId: ctx.organization.id,
        role,
        permissionsJson: JSON.stringify(selectedPermissions),
      },
      update: {
        permissionsJson: JSON.stringify(selectedPermissions),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "ROLE_PERMISSIONS_UPDATED",
        entity: "RolePermission",
        entityId: role,
        description: `${ctx.user.name} updated permission matrix for ${ROLES[role].label} (${selectedPermissions.length} capabilities granted).`,
        previousValue: existing?.permissionsJson ?? null,
        newValue: JSON.stringify(selectedPermissions),
      },
    });
  });

  revalidatePath("/roles");
  revalidatePath("/audit-logs");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateOrganizationSettingsAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Unauthorized session." };
  if (!ctx.can("settings:manage")) {
    return { error: "Insufficient permissions: 'Manage Organization Settings' is required." };
  }

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const taxPin = String(formData.get("taxPin") || "").trim();
  const ncaRegistration = String(formData.get("ncaRegistration") || "").trim();
  const vatRate = parseFloat(String(formData.get("vatRate") || "16")) || 16.0;
  const currency = String(formData.get("currency") || "KSh").trim();
  const timezone = String(formData.get("timezone") || "Africa/Nairobi").trim();

  const projectPrefix = String(formData.get("projectPrefix") || "PRJ-").trim();
  const defaultProjectStatus = String(formData.get("defaultProjectStatus") || "PLANNING").trim();
  const progressCalcMethod = String(formData.get("progressCalcMethod") || "PHASE_WEIGHTED").trim();

  const invoicePrefix = String(formData.get("invoicePrefix") || "INV-").trim();
  const poPrefix = String(formData.get("poPrefix") || "PO-").trim();
  const mrPrefix = String(formData.get("mrPrefix") || "MR-").trim();
  const defaultPaymentTerms = String(formData.get("defaultPaymentTerms") || "Net 30 Days").trim();
  const documentHeaderNote = String(formData.get("documentHeaderNote") || "").trim();
  const documentFooterNote = String(formData.get("documentFooterNote") || "").trim();

  if (!name || !code) {
    return { error: "Company Name and Company Code are required." };
  }

  const previousSnapshot = {
    name: ctx.organization.name,
    code: ctx.organization.code,
    taxPin: ctx.organization.taxPin,
    ncaRegistration: ctx.organization.ncaRegistration,
    vatRate: ctx.organization.vatRate,
    currency: ctx.organization.currency,
    projectPrefix: ctx.organization.projectPrefix,
    poPrefix: ctx.organization.poPrefix,
    invoicePrefix: ctx.organization.invoicePrefix,
  };

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: ctx.organization.id },
      data: {
        name,
        code,
        address,
        city,
        phone,
        email,
        website,
        taxPin,
        ncaRegistration,
        vatRate,
        currency,
        timezone,
        projectPrefix,
        defaultProjectStatus,
        progressCalcMethod,
        invoicePrefix,
        poPrefix,
        mrPrefix,
        defaultPaymentTerms,
        documentHeaderNote,
        documentFooterNote,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        action: "ORGANIZATION_SETTINGS_UPDATED",
        entity: "Organization",
        entityId: ctx.organization.id,
        description: `${ctx.user.name} updated organization business, project, and financial settings.`,
        previousValue: JSON.stringify(previousSnapshot),
        newValue: JSON.stringify({
          name,
          code,
          taxPin,
          ncaRegistration,
          vatRate,
          currency,
          projectPrefix,
          poPrefix,
          invoicePrefix,
        }),
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/audit-logs");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const ctx = await getSessionContext();
  if (!ctx) return;

  await prisma.notification.updateMany({
    where: {
      organizationId: ctx.organization.id,
      isRead: "FALSE",
    },
    data: {
      isRead: "TRUE",
    },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
