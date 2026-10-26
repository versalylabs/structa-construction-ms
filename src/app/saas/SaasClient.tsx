"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CreditCard,
  Building2,
  Users,
  FolderKanban,
  HardDrive,
  CheckCircle2,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Printer,
  ShieldCheck,
  Rocket,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import {
  STRUCTA_SAAS_PLANS,
  getSaasPlanDefinition,
  type SaasPlanKey,
} from "@/lib/saas-plans";
import {
  changeOrganizationSubscriptionPlanAction,
  recordSaasSubscriptionPaymentAction,
  onboardNewConstructionOrganizationAction,
} from "@/app/actions/saas";
import { quickSwitchUserAction } from "@/app/actions/foundation";
import { formatCurrency } from "@/lib/utils";

interface TenantDirectoryRow {
  id: string;
  name: string;
  code: string;
  city: string;
  ncaRegistration: string;
  plan: string;
  status: string;
  projectsCount: number;
  usersCount: number;
  primaryOwnerId: string | null;
  primaryOwnerName: string;
  createdAt: string;
}

interface SaasBillingLogRow {
  id: string;
  action: string;
  invoiceRef: string;
  description: string;
  stateDelta: string;
  createdAt: string;
  operatorName: string;
}

interface SaasClientProps {
  organization: {
    id: string;
    name: string;
    code: string;
    plan: string;
    status: string;
    taxPin: string | null;
    ncaRegistration: string | null;
    city: string | null;
  };
  usageMetrics: {
    activeProjectsCount: number;
    teamUsersCount: number;
    documentsCount: number;
    estimatedStorageGb: number;
    monthlyTransactionsCount: number;
  };
  billingLogs: SaasBillingLogRow[];
  tenantDirectory: TenantDirectoryRow[];
}

export function SaasClient({
  organization,
  usageMetrics,
  billingLogs,
  tenantDirectory,
}: SaasClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "PLANS_AND_QUOTAS" | "BILLING_INVOICES" | "ONBOARDING_WIZARD" | "TENANT_DIRECTORY"
  >("PLANS_AND_QUOTAS");

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);
  const [isChangingPlan, startPlanTransition] = useTransition();

  // Checkout State
  const activePlanDef = getSaasPlanDefinition(organization.plan);
  const [checkoutPlanKey, setCheckoutPlanKey] = useState<SaasPlanKey>(
    activePlanDef.key === "TRIAL_ENTERPRISE" ? "PROFESSIONAL" : activePlanDef.key
  );
  const [paymentMethod, setPaymentMethod] = useState("MPESA_PAYBILL_4082210");
  const [transactionRef, setTransactionRef] = useState("SAAS-QKL948210M");
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [isPaying, startPaymentTransition] = useTransition();

  // Onboarding Wizard State
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [ncaRegistration, setNcaRegistration] = useState(
    "NCA1 — Building & Civil Engineering"
  );
  const [taxPin, setTaxPin] = useState("P052109482M");
  const [city, setCity] = useState("Nairobi");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("+254 722 650 100");
  const [initialPlan, setInitialPlan] = useState<SaasPlanKey>("TRIAL_ENTERPRISE");
  const [flagshipProjectName, setFlagshipProjectName] = useState(
    "Upper Hill Mixed-Use Commercial Plaza"
  );
  const [flagshipContractValue, setFlagshipContractValue] = useState("240000000");
  const [switchImmediately, setSwitchImmediately] = useState(true);
  const [onboardResult, setOnboardResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isOnboarding, startOnboardTransition] = useTransition();

  const [isSwitchingTenant, startSwitchTransition] = useTransition();

  const handleSelectPlan = (planKey: SaasPlanKey) => {
    const fd = new FormData();
    fd.set("planKey", planKey);
    startPlanTransition(async () => {
      const res = await changeOrganizationSubscriptionPlanAction(fd);
      if (res.ok) {
        setPlanFeedback(
          `Organization plan updated to ${res.planName}. Usage quotas refreshed.`
        );
        router.refresh();
        setTimeout(() => setPlanFeedback(null), 4000);
      }
    });
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("planKey", checkoutPlanKey);
    fd.set("billingCycle", billingCycle);
    fd.set("paymentMethod", paymentMethod);
    fd.set("transactionRef", transactionRef);

    startPaymentTransition(async () => {
      const res = await recordSaasSubscriptionPaymentAction(fd);
      if (res.ok) {
        setCheckoutSuccess(
          `Tax Invoice & Receipt ${res.invoiceNumber} issued for KES ${res.totalAmount?.toLocaleString()} (incl. 16% VAT).`
        );
        router.refresh();
      }
    });
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardResult(null);
    const fd = new FormData();
    fd.set("companyName", companyName);
    fd.set("companyCode", companyCode);
    fd.set("ncaRegistration", ncaRegistration);
    fd.set("taxPin", taxPin);
    fd.set("city", city);
    fd.set("ownerName", ownerName);
    fd.set("ownerEmail", ownerEmail);
    fd.set("ownerPhone", ownerPhone);
    fd.set("initialPlan", initialPlan);
    fd.set("flagshipProjectName", flagshipProjectName);
    fd.set("flagshipContractValue", flagshipContractValue);
    fd.set("switchImmediately", switchImmediately ? "true" : "false");

    startOnboardTransition(async () => {
      const res = await onboardNewConstructionOrganizationAction(fd);
      if (!res.ok) {
        setOnboardResult({
          ok: false,
          message: res.error || "Failed to provision organization.",
        });
      } else {
        setOnboardResult({
          ok: true,
          message: `Provisioned ${res.organizationName} (${res.organizationCode}) with owner ${res.ownerEmail}!`,
        });
        setCompanyName("");
        setCompanyCode("");
        setOwnerName("");
        setOwnerEmail("");
        router.refresh();
      }
    });
  };

  const handleSwitchTenant = (ownerUserId: string | null) => {
    if (!ownerUserId) return;
    startSwitchTransition(async () => {
      await quickSwitchUserAction(ownerUserId);
      router.refresh();
    });
  };

  const checkoutPlan = STRUCTA_SAAS_PLANS[checkoutPlanKey];
  const baseCheckoutKes =
    billingCycle === "ANNUAL"
      ? checkoutPlan.annualPriceKes
      : checkoutPlan.monthlyPriceKes;
  const vatCheckoutKes = Math.round(baseCheckoutKes * 0.16);
  const totalCheckoutKes = baseCheckoutKes + vatCheckoutKes;

  const projectPct = Math.min(
    100,
    Math.round(
      (usageMetrics.activeProjectsCount / activePlanDef.maxActiveProjects) * 100
    )
  );
  const seatsPct = Math.min(
    100,
    Math.round((usageMetrics.teamUsersCount / activePlanDef.maxTeamUsers) * 100)
  );
  const storagePct = Math.min(
    100,
    Math.round(
      (usageMetrics.estimatedStorageGb / activePlanDef.maxStorageGb) * 100
    )
  );
  const txPct = Math.min(
    100,
    Math.round(
      (usageMetrics.monthlyTransactionsCount /
        activePlanDef.maxMonthlyLposAndInvoices) *
        100
    )
  );

  return (
    <div className="space-y-6">
      {/* Top SaaS & Commercialization Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  SaaS Subscriptions, Quotas & Tenant Onboarding
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  Phase 15 • Versaly Commercial Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Organization:{" "}
                <strong className="text-slate-200">
                  {organization.name} ({organization.code})
                </strong>{" "}
                • Current Tier:{" "}
                <span className="text-brand-300 font-semibold">
                  {activePlanDef.name}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("ONBOARDING_WIZARD")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold px-3.5 py-2 text-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Onboard New Construction Company</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium px-3 py-2 text-xs transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print Subscription Summary</span>
          </button>
        </div>
      </div>

      {/* Live Usage & Quota Metering Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Projects Quota</span>
            <FolderKanban className="h-4 w-4 text-brand-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white">
              {usageMetrics.activeProjectsCount} /{" "}
              {activePlanDef.maxActiveProjects === 999
                ? "Unlimited"
                : activePlanDef.maxActiveProjects}
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {projectPct}% Used
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${Math.max(6, projectPct)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Team User Seats</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white">
              {usageMetrics.teamUsersCount} / {activePlanDef.maxTeamUsers} Seats
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {seatsPct}% Used
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${Math.max(6, seatsPct)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Document & CAD Vault</span>
            <HardDrive className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white">
              {usageMetrics.estimatedStorageGb.toFixed(1)} /{" "}
              {activePlanDef.maxStorageGb} GB
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {usageMetrics.documentsCount} Controlled Files
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.max(5, storagePct)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly LPOs & IPCs</span>
            <Receipt className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-white">
              {usageMetrics.monthlyTransactionsCount} /{" "}
              {activePlanDef.maxMonthlyLposAndInvoices}
            </span>
            <span className="text-[11px] font-mono text-purple-400">
              {txPct}% Quota
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${Math.max(6, txPct)}%` }}
            />
          </div>
        </div>
      </div>

      {planFeedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{planFeedback}</span>
        </div>
      )}

      {/* Responsive Tab Bar */}
      <div className="flex overflow-x-auto pb-2 sm:pb-3 gap-2 border-b border-slate-800">
        {[
          {
            id: "PLANS_AND_QUOTAS",
            label: "1. Subscription Tiers & Quotas",
            icon: Layers,
          },
          {
            id: "BILLING_INVOICES",
            label: "2. SaaS Billing, M-Pesa Checkout & Tax Invoices",
            icon: CreditCard,
          },
          {
            id: "ONBOARDING_WIZARD",
            label: "3. Organization Onboarding Wizard",
            icon: Rocket,
          },
          {
            id: "TENANT_DIRECTORY",
            label: `4. Multi-Tenant SaaS Directory (${tenantDirectory.length})`,
            icon: Building2,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? "bg-brand-500 text-slate-950"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Subscription Tiers & Quotas */}
      {activeTab === "PLANS_AND_QUOTAS" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Structa Commercial Construction Subscription Plans (by Versaly)
              </h2>
              <p className="text-xs text-slate-400">
                Switch plans at any time to test quota enforcement across projects, team seats, and storage.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1 self-start">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  billingCycle === "MONTHLY"
                    ? "bg-brand-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("ANNUAL")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  billingCycle === "ANNUAL"
                    ? "bg-brand-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Annual (2 Months Free)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.values(STRUCTA_SAAS_PLANS).map((plan) => {
              const isCurrent = activePlanDef.key === plan.key;
              const priceKes =
                billingCycle === "ANNUAL"
                  ? plan.annualPriceKes
                  : plan.monthlyPriceKes;
              return (
                <div
                  key={plan.key}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-5 ${
                    isCurrent
                      ? "border-brand-500 bg-brand-500/10 shadow-xl shadow-brand-500/5"
                      : plan.highlighted
                        ? "border-slate-700 bg-slate-900/90"
                        : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${plan.badge}`}
                      >
                        {plan.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ACTIVE TIER
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-bold font-mono text-white">
                        {priceKes === 0
                          ? "KES 0"
                          : formatCurrency(priceKes, "KSh")}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {priceKes === 0
                          ? "14-Day Full Evaluation"
                          : `per ${billingCycle === "ANNUAL" ? "year" : "month"} (+16% VAT) • ~$${plan.monthlyPriceUsd}/mo`}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {plan.tagline}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      {plan.features.map((feat) => (
                        <div
                          key={feat}
                          className="flex items-start gap-2 text-xs text-slate-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-mono text-slate-400">
                      SLA: {plan.supportSla}
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || isChangingPlan}
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`w-full rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-slate-800 text-slate-400 cursor-default"
                          : "bg-brand-500 hover:bg-brand-400 text-slate-950"
                      }`}
                    >
                      {isCurrent
                        ? "Current Active Plan"
                        : `Activate ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SaaS Billing, M-Pesa Checkout & Tax Invoices */}
      {activeTab === "BILLING_INVOICES" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-400" />
                <span>SaaS Subscription Checkout (M-Pesa / Bank / Card)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Process a subscription renewal or tier upgrade for{" "}
                <strong className="text-slate-200">{organization.name}</strong>{" "}
                and generate a KRA-compliant Versaly Tax Invoice.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={checkoutPlanKey}
                  onChange={(e) =>
                    setCheckoutPlanKey(e.target.value as SaasPlanKey)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="STARTER_BUILDER">
                    Starter Contractor (KES 24,500/mo)
                  </option>
                  <option value="PROFESSIONAL">
                    Professional Growth (KES 58,000/mo)
                  </option>
                  <option value="ENTERPRISE">
                    Enterprise NCA1 & Civil (KES 145,000/mo)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) =>
                    setBillingCycle(e.target.value as "MONTHLY" | "ANNUAL")
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="MONTHLY">Monthly Subscription</option>
                  <option value="ANNUAL">
                    Annual Subscription (Save 2 Months)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Payment Channel
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="MPESA_PAYBILL_4082210">
                    M-Pesa Paybill 4082210 (Versaly Enterprise)
                  </option>
                  <option value="BANK_RTGS_KCB">
                    KCB / Equity Corporate RTGS Transfer
                  </option>
                  <option value="CORPORATE_VISA_CARD">
                    Corporate Visa / Mastercard
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  M-Pesa / Bank Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({checkoutPlan.name}):</span>
                  <span>{formatCurrency(baseCheckoutKes, "KSh")}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>KRA VAT (16%):</span>
                  <span>{formatCurrency(vatCheckoutKes, "KSh")}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                  <span>Total Payable:</span>
                  <span className="text-brand-400">
                    {formatCurrency(totalCheckoutKes, "KSh")}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPaying}
                className="w-full rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer"
              >
                {isPaying
                  ? "Recording SaaS Payment & Generating Tax Invoice..."
                  : `Confirm Payment (${formatCurrency(totalCheckoutKes, "KSh")})`}
              </button>

              {checkoutSuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{checkoutSuccess}</span>
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Versaly SaaS Subscription Invoices & Billing Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Official subscription changes, M-Pesa/Bank receipts, and KRA tax invoice records for{" "}
                  {organization.name}.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                PIN: {organization.taxPin || "P051882910K"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice / Event</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Reference & Amount</th>
                    <th className="py-3 px-4">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {billingLogs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                          {b.action}
                        </span>
                        <div className="font-mono text-[11px] text-slate-400 mt-1">
                          {b.invoiceRef}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200 max-w-md">
                        {b.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                        {b.stateDelta}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {b.operatorName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Self-Service Organization Onboarding Wizard */}
      {activeTab === "ONBOARDING_WIZARD" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Rocket className="h-5 w-5 text-brand-400" />
                <span>
                  Self-Service Construction Company Onboarding Wizard
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Provision a brand-new, strictly isolated construction company on Structa with its own Organization Owner, flagship project, 4 standard construction phases, and automated budget watchdog rule.
              </p>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Construction Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Rift Valley Infrastructure & Builders Ltd."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Tenant Code (Auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    placeholder="e.g., ORG-RIFT-003"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    NCA Registration Category
                  </label>
                  <input
                    type="text"
                    value={ncaRegistration}
                    onChange={(e) => setNcaRegistration(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    KRA Tax PIN & Headquarters City
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={taxPin}
                      onChange={(e) => setTaxPin(e.target.value)}
                      placeholder="KRA PIN"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Organization Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g., Eng. David Kiprop"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Owner Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g., d.kiprop@riftbuilders.co.ke"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Initial Flagship Project Name
                  </label>
                  <input
                    type="text"
                    value={flagshipProjectName}
                    onChange={(e) => setFlagshipProjectName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Contract Value (KES) & Initial Plan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={flagshipContractValue}
                      onChange={(e) => setFlagshipContractValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                    <select
                      value={initialPlan}
                      onChange={(e) =>
                        setInitialPlan(e.target.value as SaasPlanKey)
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white"
                    >
                      <option value="TRIAL_ENTERPRISE">14-Day Free Trial</option>
                      <option value="STARTER_BUILDER">Starter</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={switchImmediately}
                  onChange={(e) => setSwitchImmediately(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 accent-amber-500"
                />
                <span>
                  Automatically switch my session into this newly provisioned organization upon creation
                </span>
              </label>

              <button
                type="submit"
                disabled={isOnboarding}
                className="rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold px-5 py-2.5 text-xs transition-colors cursor-pointer"
              >
                {isOnboarding
                  ? "Provisioning Tenant Workspace & Flagship Project..."
                  : "Provision New Construction Organization on Structa"}
              </button>

              {onboardResult && (
                <div
                  className={`rounded-xl border p-3.5 text-xs flex items-center gap-2 ${
                    onboardResult.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{onboardResult.message}</span>
                </div>
              )}
            </form>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Automated Zero-Touch Tenant Provisioning</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every organization onboarded via this wizard receives an isolated multi-tenant environment with:
            </p>
            <div className="space-y-2.5 text-xs">
              {[
                "Dedicated Organization ID & Row-Level Prisma Query Isolation",
                "Organization Owner Executive Account (Full 34 Permissions)",
                "Default Corporate Client Profile & Flagship Project Command Center",
                "Main Works Site & 4 Pre-Scheduled Construction Phases",
                "Pre-Armed 85% Budget Overrun Watchdog Automation Rule",
                "Instant Compatibility with the Header Role/Tenant Switcher",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 flex items-start gap-2 text-slate-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Multi-Tenant SaaS Platform Directory */}
      {activeTab === "TENANT_DIRECTORY" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">
                Versaly Global Multi-Tenant Directory ({tenantDirectory.length} Construction Companies)
              </h2>
              <p className="text-xs text-slate-400">
                View all onboarded construction companies and switch into any tenant workspace to verify isolation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Organization & Code</th>
                  <th className="py-3 px-4">NCA Category & City</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Projects & Team</th>
                  <th className="py-3 px-4">Primary Owner</th>
                  <th className="py-3 px-4 text-right">Tenant Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {tenantDirectory.map((t) => {
                  const isCurrentOrg = t.id === organization.id;
                  const planMeta = getSaasPlanDefinition(t.plan);
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{t.name}</span>
                          {isCurrentOrg && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-brand-400">
                          {t.code}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{t.ncaRegistration}</div>
                        <div className="text-[11px] text-slate-500">{t.city}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${planMeta.badge}`}
                        >
                          {planMeta.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {t.projectsCount} Projects • {t.usersCount} Users
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.primaryOwnerName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCurrentOrg ? (
                          <span className="text-[11px] font-mono text-emerald-400">
                            Active Session
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!t.primaryOwnerId || isSwitchingTenant}
                            onClick={() => handleSwitchTenant(t.primaryOwnerId)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 text-xs font-semibold text-brand-300 transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>Switch to Tenant</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
