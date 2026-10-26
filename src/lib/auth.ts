import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { UserRole, PermissionKey, DEFAULT_ROLE_PERMISSIONS, hasPermission } from "./rbac";

const SESSION_COOKIE_NAME = "structa_session";
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "structa-versaly-enterprise-construction-secret-key-2026"
);

export interface SessionPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Verify user and tenant still exist and are active
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      organizationId: payload.organizationId,
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  });

  if (!user || user.organization.status === "SUSPENDED") {
    return null;
  }

  // Load any custom role permissions configured for this organization
  const customRolePerm = await prisma.rolePermission.findUnique({
    where: {
      organizationId_role: {
        organizationId: user.organizationId,
        role: user.role,
      },
    },
  });

  let permissions: PermissionKey[] =
    DEFAULT_ROLE_PERMISSIONS[user.role as UserRole] ?? [];

  if (customRolePerm) {
    try {
      permissions = JSON.parse(customRolePerm.permissionsJson) as PermissionKey[];
    } catch {
      // Fallback to default permissions
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      jobTitle: user.jobTitle,
      department: user.department,
      employeeCode: user.employeeCode,
      role: user.role as UserRole,
      status: user.status,
      organizationId: user.organizationId,
    },
    organization: user.organization,
    permissions,
    can: (perm: PermissionKey) =>
      hasPermission(user.role as UserRole, perm, permissions),
  };
}
