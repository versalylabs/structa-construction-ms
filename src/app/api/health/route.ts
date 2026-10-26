import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  try {
    const [organizationsCount, projectsCount, usersCount, auditLogsCount] =
      await Promise.all([
        prisma.organization.count(),
        prisma.project.count(),
        prisma.user.count(),
        prisma.auditLog.count(),
      ]);
    const latencyMs = Math.max(1, Math.round(performance.now() - start));

    return NextResponse.json(
      {
        status: "HEALTHY",
        service: "Structa Construction Management OS (by Versaly)",
        version: "1.14.0-prod",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          connected: true,
          latencyMs,
          provider: "Prisma ORM (SQLite / PostgreSQL Ready)",
          metrics: {
            organizationsCount,
            projectsCount,
            usersCount,
            auditLogsCount,
          },
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "development",
          timezone: "Africa/Nairobi (EAT / UTC+3)",
          defaultCurrency: "KES",
          tenantIsolation: "ENFORCED-STRICT",
          securityHeaders: "ACTIVE",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Database check failed",
      },
      { status: 503 }
    );
  }
}
