import { prisma } from "./db";

export interface CreateAuditLogInput {
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  previousValue?: unknown;
  newValue?: unknown;
}

export async function recordAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      description: input.description,
      previousValue:
        input.previousValue !== undefined
          ? JSON.stringify(input.previousValue)
          : null,
      newValue:
        input.newValue !== undefined ? JSON.stringify(input.newValue) : null,
    },
  });
}
