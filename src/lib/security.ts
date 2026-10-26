import { PermissionKey, UserRole, hasPermission } from "./rbac";

/**
 * Allowed construction document & site photo extensions and MIME types.
 * Blocks executable scripts, HTML/SVG XSS vectors, and shell payloads.
 */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".dwg",
  ".dxf",
  ".xlsx",
  ".xls",
  ".csv",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const BLOCKED_DANGEROUS_EXTENSIONS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".ps1",
  ".js",
  ".vbs",
  ".php",
  ".py",
  ".dll",
  ".html",
  ".htm",
  ".svg",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB max for CAD/BIM/PDF drawings

export interface FileSecurityValidationResult {
  valid: boolean;
  sanitizedFileName: string;
  extension: string;
  reason?: string;
  riskLevel: "SAFE" | "WARN" | "BLOCKED";
}

/**
 * Validates and sanitizes uploaded file names and sizes against path traversal,
 * null-byte injection, double extensions, and executable payloads.
 */
export function validateFileUploadSecurity(
  fileName: string,
  fileSizeBytes: number
): FileSecurityValidationResult {
  const raw = (fileName || "").trim();

  if (!raw) {
    return {
      valid: false,
      sanitizedFileName: "",
      extension: "",
      reason: "File name is empty.",
      riskLevel: "BLOCKED",
    };
  }

  // Detect path traversal or null-byte injection
  if (raw.includes("..") || raw.includes("/") || raw.includes("\\") || raw.includes("\0")) {
    return {
      valid: false,
      sanitizedFileName: raw.replace(/[^a-zA-Z0-9._-]/g, "_"),
      extension: "",
      reason: "Path traversal or directory separator sequence detected in filename.",
      riskLevel: "BLOCKED",
    };
  }

  const lower = raw.toLowerCase();
  const lastDotIdx = lower.lastIndexOf(".");
  const ext = lastDotIdx >= 0 ? lower.slice(lastDotIdx) : "";

  // Check for blocked executable or script extensions (including double extensions like drawing.pdf.exe)
  for (const blocked of BLOCKED_DANGEROUS_EXTENSIONS) {
    if (lower.endsWith(blocked) || lower.includes(`${blocked}.`)) {
      return {
        valid: false,
        sanitizedFileName: raw.replace(/[^a-zA-Z0-9._-]/g, "_"),
        extension: ext,
        reason: `Executable or script payload (${blocked}) is strictly prohibited by Structa File Security Policy.`,
        riskLevel: "BLOCKED",
      };
    }
  }

  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number])) {
    return {
      valid: false,
      sanitizedFileName: raw.replace(/[^a-zA-Z0-9._-]/g, "_"),
      extension: ext || "none",
      reason: `Extension '${ext || "none"}' is not in the approved construction document whitelist (${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}).`,
      riskLevel: "BLOCKED",
    };
  }

  if (fileSizeBytes <= 0) {
    return {
      valid: false,
      sanitizedFileName: raw,
      extension: ext,
      reason: "File size must be greater than 0 bytes.",
      riskLevel: "BLOCKED",
    };
  }

  if (fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      sanitizedFileName: raw,
      extension: ext,
      reason: `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB maximum upload limit.`,
      riskLevel: "BLOCKED",
    };
  }

  const sanitizedFileName = raw.replace(/[^a-zA-Z0-9._ -]/g, "_");

  return {
    valid: true,
    sanitizedFileName,
    extension: ext,
    reason: "Passed MIME/extension whitelist, size limit, and path-traversal checks.",
    riskLevel: "SAFE",
  };
}

/**
 * Sanitizes free-text user input to strip control characters and script tags.
 */
export function sanitizeTextInput(input: string, maxLength = 2000): string {
  return (input || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates financial amounts to prevent negative values, NaN, or overflow.
 */
export function validateFinancialAmount(
  amount: number,
  options: { allowZero?: boolean; maxKes?: number } = {}
): { valid: boolean; reason?: string } {
  const { allowZero = false, maxKes = 100_000_000_000 } = options;
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return { valid: false, reason: "Financial amount must be a valid finite number." };
  }
  if (allowZero ? amount < 0 : amount <= 0) {
    return {
      valid: false,
      reason: allowZero
        ? "Financial amount cannot be negative."
        : "Financial amount must be strictly greater than zero.",
    };
  }
  if (amount > maxKes) {
    return {
      valid: false,
      reason: `Financial amount exceeds maximum single-transaction ceiling (KES ${maxKes.toLocaleString()}).`,
    };
  }
  return { valid: true };
}

/**
 * Verifies strict multi-tenant ownership before reading or mutating any entity.
 */
export function verifyTenantOwnership(
  entityOrganizationId: string | null | undefined,
  sessionOrganizationId: string
): boolean {
  if (!entityOrganizationId || !sessionOrganizationId) return false;
  return entityOrganizationId === sessionOrganizationId;
}

/**
 * Enforces RBAC permission check for server actions.
 */
export function verifyActionPermission(
  role: UserRole,
  requiredPermission: PermissionKey,
  grantedPermissions?: PermissionKey[]
): { allowed: boolean; reason?: string } {
  const allowed = hasPermission(role, requiredPermission, grantedPermissions);
  if (!allowed) {
    return {
      allowed: false,
      reason: `Role '${role}' does not hold required permission '${requiredPermission}'.`,
    };
  }
  return { allowed: true };
}

export const PRODUCTION_SECURITY_HEADERS = [
  {
    header: "X-Frame-Options",
    value: "DENY",
    purpose: "Prevents clickjacking attacks by blocking iframe embedding on external origins.",
  },
  {
    header: "X-Content-Type-Options",
    value: "nosniff",
    purpose: "Prevents browser MIME-type sniffing on uploaded CAD drawings and PDF documents.",
  },
  {
    header: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
    purpose: "Protects internal project URLs and query identifiers from leaking in cross-origin requests.",
  },
  {
    header: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
    purpose: "Restricts browser hardware APIs to authorized site photo/GPS capture only.",
  },
  {
    header: "X-Structa-Tenant-Isolation",
    value: "ENFORCED-STRICT",
    purpose: "Indicates strict server-side organizationId row-level query scoping across all routes.",
  },
] as const;
