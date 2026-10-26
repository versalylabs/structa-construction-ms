"use client";

import React, { useState, useTransition } from "react";
import {
  Settings,
  Building2,
  Landmark,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { updateOrganizationSettingsAction } from "@/app/actions/foundation";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    code: string;
    address: string | null;
    city: string | null;
    country: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    taxPin: string | null;
    ncaRegistration: string | null;
    vatRate: number;
    currency: string;
    timezone: string;
    projectPrefix: string;
    defaultProjectStatus: string;
    progressCalcMethod: string;
    invoicePrefix: string;
    poPrefix: string;
    mrPrefix: string;
    defaultPaymentTerms: string;
    documentHeaderNote: string | null;
    documentFooterNote: string | null;
    plan: string;
  };
  canManageSettings: boolean;
}

export function SettingsClient({
  organization,
  canManageSettings,
}: SettingsClientProps) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateOrganizationSettingsAction(formData);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message:
            "Organization settings saved to database and recorded in the security audit trail.",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">
              Organization & Construction Operational Settings
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure business profile, Kenya KRA/NCA compliance, KSh currency & VAT defaults, and document numbering for{" "}
            <strong className="text-slate-200">{organization.name}</strong>.
          </p>
        </div>

        {canManageSettings ? (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? "Saving Changes..." : "Save All Settings"}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-mono text-amber-400">
            <Lock className="h-3.5 w-3.5" />
            Read-only for your role
          </span>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-lg border p-3.5 flex items-center gap-2.5 text-xs",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Business Profile & NCA Registration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white">
              Business & Corporate Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Registered Company Name
              </label>
              <input
                name="name"
                defaultValue={organization.name}
                disabled={!canManageSettings}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Code
              </label>
              <input
                name="code"
                defaultValue={organization.code}
                disabled={!canManageSettings}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                NCA Registration & Category
              </label>
              <input
                name="ncaRegistration"
                defaultValue={organization.ncaRegistration || ""}
                disabled={!canManageSettings}
                placeholder="NCA-1 (Building, Civil & Structural Works)"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                KRA Tax PIN
              </label>
              <input
                name="taxPin"
                defaultValue={organization.taxPin || ""}
                disabled={!canManageSettings}
                placeholder="P051..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Physical Office Address
            </label>
            <input
              name="address"
              defaultValue={organization.address || ""}
              disabled={!canManageSettings}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                City
              </label>
              <input
                name="city"
                defaultValue={organization.city || "Nairobi"}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                defaultValue={organization.phone || ""}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={organization.email || ""}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Company Website
            </label>
            <input
              name="website"
              defaultValue={organization.website || ""}
              disabled={!canManageSettings}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Financial, Currency & Tax Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Landmark className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">
              Financial, Tax & Regional Settings (Kenya-First)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operating Currency
              </label>
              <select
                name="currency"
                defaultValue={organization.currency}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="KSh">KSh (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="UGX">UGX (Ugandan Shilling)</option>
                <option value="TZS">TZS (Tanzanian Shilling)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default VAT / Tax Rate (%)
              </label>
              <input
                name="vatRate"
                type="number"
                step="0.1"
                defaultValue={organization.vatRate}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Timezone
              </label>
              <select
                name="timezone"
                defaultValue={organization.timezone}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="Africa/Nairobi">Africa/Nairobi (EAT +03:00)</option>
                <option value="Africa/Kampala">Africa/Kampala (EAT +03:00)</option>
                <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT +03:00)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Supplier & Client Payment Terms
            </label>
            <select
              name="defaultPaymentTerms"
              defaultValue={organization.defaultPaymentTerms}
              disabled={!canManageSettings}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 14 Days">Net 14 Days</option>
              <option value="50% Advance / 50% On Delivery">50% Advance / 50% On Delivery</option>
              <option value="Upon Valuation Certificate">Upon Interim Valuation Certificate</option>
              <option value="Cash / M-Pesa on Delivery">Cash / M-Pesa on Delivery</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 pb-3">
              <FileText className="h-4 w-4 text-brand-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Project, Procurement & Document Numbering
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Project Prefix
                </label>
                <input
                  name="projectPrefix"
                  defaultValue={organization.projectPrefix}
                  disabled={!canManageSettings}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Purchase Order Prefix
                </label>
                <input
                  name="poPrefix"
                  defaultValue={organization.poPrefix}
                  disabled={!canManageSettings}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Invoice Prefix
                </label>
                <input
                  name="invoicePrefix"
                  defaultValue={organization.invoicePrefix}
                  disabled={!canManageSettings}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Material Req Prefix
                </label>
                <input
                  name="mrPrefix"
                  defaultValue={organization.mrPrefix}
                  disabled={!canManageSettings}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default New Project Status
              </label>
              <select
                name="defaultProjectStatus"
                defaultValue={organization.defaultProjectStatus}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Progress Rollup Method
              </label>
              <select
                name="progressCalcMethod"
                defaultValue={organization.progressCalcMethod}
                disabled={!canManageSettings}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="PHASE_WEIGHTED">Budget-Weighted Phase Progress</option>
                <option value="TASK_COMPLETION">Task Completion Ratio</option>
                <option value="QS_VALUATION">QS Certified Valuation %</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Document Header Accreditation Note
            </label>
            <input
              name="documentHeaderNote"
              defaultValue={organization.documentHeaderNote || ""}
              disabled={!canManageSettings}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Official PO / Invoice Footer Compliance Note
            </label>
            <input
              name="documentFooterNote"
              defaultValue={organization.documentFooterNote || ""}
              disabled={!canManageSettings}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
