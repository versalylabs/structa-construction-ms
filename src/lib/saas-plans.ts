export type SaasPlanKey =
  | "TRIAL_ENTERPRISE"
  | "STARTER_BUILDER"
  | "PROFESSIONAL"
  | "ENTERPRISE";

export interface SaasPlanDefinition {
  key: SaasPlanKey;
  name: string;
  tagline: string;
  badge: string;
  monthlyPriceKes: number;
  annualPriceKes: number;
  monthlyPriceUsd: number;
  maxActiveProjects: number;
  maxTeamUsers: number;
  maxStorageGb: number;
  maxMonthlyLposAndInvoices: number;
  supportSla: string;
  features: string[];
  highlighted?: boolean;
}

export const STRUCTA_SAAS_PLANS: Record<SaasPlanKey, SaasPlanDefinition> = {
  TRIAL_ENTERPRISE: {
    key: "TRIAL_ENTERPRISE",
    name: "14-Day Enterprise Trial",
    tagline: "Full-featured evaluation for construction companies onboarding onto Structa.",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    monthlyPriceKes: 0,
    annualPriceKes: 0,
    monthlyPriceUsd: 0,
    maxActiveProjects: 5,
    maxTeamUsers: 15,
    maxStorageGb: 50,
    maxMonthlyLposAndInvoices: 100,
    supportSla: "Onboarding Concierge Support (14 Days)",
    features: [
      "Up to 5 Active Construction Projects during trial",
      "15 Team Seats across all 10 Construction Roles",
      "Full BOQ, Budget, LPO/GRN & M-Pesa Finance Suite",
      "Client Portal, Document Vault & Watchdog Alerts",
      "Instant conversion to Starter, Professional, or Enterprise",
    ],
  },
  STARTER_BUILDER: {
    key: "STARTER_BUILDER",
    name: "Starter Contractor",
    tagline: "Essential project, BOQ, and site control for emerging residential & building contractors.",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    monthlyPriceKes: 24500,
    annualPriceKes: 245000,
    monthlyPriceUsd: 190,
    maxActiveProjects: 3,
    maxTeamUsers: 10,
    maxStorageGb: 25,
    maxMonthlyLposAndInvoices: 50,
    supportSla: "Standard Business Hours Support (EAT)",
    features: [
      "Up to 3 Active Construction Projects",
      "Up to 10 Team User Seats",
      "25 GB Document & Drawing Vault",
      "Projects, Tasks, BOQ & Category Budgets",
      "Daily Site Reports & Workforce Attendance",
      "Standard CSV Exports & Audit Trail",
    ],
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    name: "Professional Growth",
    tagline: "Complete operational & financial control for growing NCA2–NCA4 construction firms.",
    badge: "bg-brand-500/15 text-brand-300 border-brand-500/30",
    monthlyPriceKes: 58000,
    annualPriceKes: 580000,
    monthlyPriceUsd: 450,
    maxActiveProjects: 12,
    maxTeamUsers: 35,
    maxStorageGb: 150,
    maxMonthlyLposAndInvoices: 500,
    supportSla: "Priority Engineering & Finance Support (< 4h SLA)",
    highlighted: true,
    features: [
      "Up to 12 Active Construction Projects",
      "Up to 35 Team User Seats + Client Portal Logins",
      "150 GB CAD, BIM, PDF & Site Photo Vault",
      "Full Procurement Workflow (MR → LPO → GRN)",
      "Subcontractor IPCs, Equipment Fleet & Maintenance",
      "M-Pesa, Bank EFT & Variation Order Accounting",
      "Automated Watchdog Rules & Executive P&L Analytics",
    ],
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    name: "Enterprise NCA1 & Civil",
    tagline: "Unlimited scale, multi-branch governance, and dedicated SLA for Tier-1 contractors & developers.",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    monthlyPriceKes: 145000,
    annualPriceKes: 1450000,
    monthlyPriceUsd: 1120,
    maxActiveProjects: 999,
    maxTeamUsers: 500,
    maxStorageGb: 1000,
    maxMonthlyLposAndInvoices: 10000,
    supportSla: "24/7 Dedicated Account Engineer & 99.98% Uptime SLA",
    features: [
      "Unlimited Active Projects & Multi-Site Command Centers",
      "Up to 500 Team Seats with Custom Role Permission Matrices",
      "1 TB (1,000 GB) High-Speed CAD/BIM Document Vault",
      "Automated Point-in-Time S3 Disaster Recovery Backups",
      "Custom M-Pesa Daraja & ERP Webhook Integrations",
      "Dedicated Onboarding & NCA/ISO Compliance Sign-Offs",
    ],
  },
};

export function getSaasPlanDefinition(planRaw?: string | null): SaasPlanDefinition {
  const normalized = (planRaw || "PROFESSIONAL").toUpperCase();
  if (normalized in STRUCTA_SAAS_PLANS) {
    return STRUCTA_SAAS_PLANS[normalized as SaasPlanKey];
  }
  if (normalized.includes("ENT")) return STRUCTA_SAAS_PLANS.ENTERPRISE;
  if (normalized.includes("START")) return STRUCTA_SAAS_PLANS.STARTER_BUILDER;
  if (normalized.includes("TRIAL")) return STRUCTA_SAAS_PLANS.TRIAL_ENTERPRISE;
  return STRUCTA_SAAS_PLANS.PROFESSIONAL;
}
