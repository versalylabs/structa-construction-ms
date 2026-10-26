"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Star,
  ArrowUpRight,
  X,
  Edit3,
  CreditCard,
  Package,
} from "lucide-react";
import {
  createSupplierAction,
  updateSupplierLedgerAction,
} from "@/app/actions/materials-suppliers";
import {
  SUPPLIER_CATEGORY_STYLES,
  cn,
  formatCurrency,
} from "@/lib/utils";

interface SupplierRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  taxPin: string | null;
  paymentTerms: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  mpesaPaybill: string | null;
  suppliedMaterials: string;
  rating: number;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
  status: string;
  notes: string | null;
  preferredMaterials: {
    id: string;
    code: string;
    name: string;
    unit: string;
    standardUnitCost: number;
    projectStocks: {
      id: string;
      receivedQuantity: number;
      totalCost: number;
      project: { id: string; code: string; name: string };
    }[];
  }[];
}

interface SuppliersClientProps {
  suppliers: SupplierRecord[];
  currency: string;
  canManageSuppliers: boolean;
  initialCategoryFilter: string;
  initialStatusFilter: string;
}

export function SuppliersClient({
  suppliers,
  currency,
  canManageSuppliers,
  initialCategoryFilter,
  initialStatusFilter,
}: SuppliersClientProps) {
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierRecord | null>(null);
  const [editPurchased, setEditPurchased] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesCat =
      categoryFilter === "ALL" || s.category === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.suppliedMaterials.toLowerCase().includes(q) ||
      (s.taxPin?.toLowerCase().includes(q) ?? false);
    return matchesCat && matchesStatus && matchesSearch;
  });

  // Portfolio Payables & Purchasing Metrics (Section 17)
  const totalPurchasedVolume = filteredSuppliers.reduce(
    (s, sup) => s + sup.totalPurchased,
    0
  );
  const totalPaidAmount = filteredSuppliers.reduce(
    (s, sup) => s + sup.totalPaid,
    0
  );
  const totalOutstandingPayables = filteredSuppliers.reduce(
    (s, sup) => s + sup.outstandingBalance,
    0
  );

  function openProfileModal(supplier: SupplierRecord) {
    setSelectedSupplier(supplier);
    setEditPurchased(supplier.totalPurchased);
    setEditPaid(supplier.totalPaid);
  }

  function handleCreateSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSupplierAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: "Registered new construction supplier in organization directory.",
        });
        setShowAddModal(false);
      }
    });
  }

  function handleUpdateLedger(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSupplier) return;
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    fd.set("supplierId", selectedSupplier.id);
    startTransition(async () => {
      const res = await updateSupplierLedgerAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: `Updated supplier account ledger & payables balance for ${selectedSupplier.name}.`,
        });
        setSelectedSupplier(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-400 mb-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Phase 5 • Supply Chain, Vendors & Payables Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Construction Suppliers Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Approved material vendors, KRA tax compliance, bank/M-Pesa payment channels, supplied catalog items, and supplier payables balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/materials"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Materials Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/materials/stock"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Site Stock Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {canManageSuppliers && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Supplier Payables & Purchasing KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Approved Suppliers
            </span>
            <Truck className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {filteredSuppliers.length} Vendors
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            KRA PIN & KEBS verified construction suppliers
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Purchase Volume
            </span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2 font-mono">
            {formatCurrency(totalPurchasedVolume, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cumulative material orders across portfolio
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Settled Payments
            </span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2 font-mono">
            {formatCurrency(totalPaidAmount, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Paid via RTGS Bank Transfer & M-Pesa Paybill
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Outstanding Supplier Payables
            </span>
            <Landmark className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300 mt-2 font-mono">
            {formatCurrency(totalOutstandingPayables, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Current balance owed to material suppliers
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier name, code, KRA PIN, contact, or supplied materials..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="ALL">All Supplier Categories</option>
            {Object.entries(SUPPLIER_CATEGORY_STYLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-semibold">{filteredSuppliers.length}</span> of{" "}
          {suppliers.length} suppliers
        </div>
      </div>

      {/* Suppliers Cards Grid (Section 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSuppliers.map((sup) => {
          const catBadge =
            SUPPLIER_CATEGORY_STYLES[sup.category] ||
            SUPPLIER_CATEGORY_STYLES.GENERAL_HARDWARE;
          const paidPct =
            sup.totalPurchased > 0
              ? Math.min(
                  100,
                  Math.round((sup.totalPaid / sup.totalPurchased) * 100)
                )
              : 100;

          return (
            <div
              key={sup.id}
              className="bg-slate-900/75 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-400">
                        {sup.code}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border",
                          catBadge.badge
                        )}
                      >
                        {catBadge.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {sup.rating.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {sup.name}
                    </h3>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-semibold border",
                      sup.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    )}
                  >
                    {sup.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                  <strong className="text-slate-400">Supplied Materials:</strong>{" "}
                  {sup.suppliedMaterials}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span>
                      {sup.contactPerson} •{" "}
                      <strong className="text-slate-200">{sup.phone}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {sup.address || sup.city || "Nairobi"} • PIN:{" "}
                      <span className="font-mono text-slate-300">
                        {sup.taxPin || "Verified"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {sup.mpesaPaybill || sup.paymentTerms}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary Footer inside Supplier Card */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/70">
                    <span className="text-[10px] uppercase text-slate-400 block">
                      Total Purchased
                    </span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(sup.totalPurchased, currency)}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/70">
                    <span className="text-[10px] uppercase text-slate-400 block">
                      Paid ({paidPct}%)
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {formatCurrency(sup.totalPaid, currency)}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/70">
                    <span className="text-[10px] uppercase text-slate-400 block">
                      Balance Owed
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        sup.outstandingBalance > 0
                          ? "text-amber-300"
                          : "text-slate-400"
                      )}
                    >
                      {formatCurrency(sup.outstandingBalance, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Terms: <strong className="text-slate-200">{sup.paymentTerms}</strong> •{" "}
                    {sup.preferredMaterials.length} Catalog Item(s)
                  </span>

                  <button
                    type="button"
                    onClick={() => openProfileModal(sup)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Profile & Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Supplier Profile, Supplied Materials & Financial Ledger (Section 17) */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <span className="text-xs font-mono text-brand-400">
                  {selectedSupplier.code} • KRA PIN:{" "}
                  {selectedSupplier.taxPin || "Verified"}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedSupplier.name} — Commercial Profile & Payables Ledger
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Bank & M-Pesa Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div>
                  <span className="text-slate-400 block">Bank Settlement Details:</span>
                  <span className="font-semibold text-white">
                    {selectedSupplier.bankName || "Standard Corporate Bank"}
                  </span>
                  <span className="font-mono text-slate-300 block">
                    Acc: {selectedSupplier.bankAccountNumber || "On File"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">M-Pesa B2B / Paybill:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {selectedSupplier.mpesaPaybill || "Paybill on Invoice"}
                  </span>
                  <span className="text-slate-400 block">
                    Terms: {selectedSupplier.paymentTerms}
                  </span>
                </div>
              </div>

              {/* Linked Catalog Materials & Site Deliveries */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Linked Catalog Materials & Site Delivery History (
                  {selectedSupplier.preferredMaterials.length})
                </h4>
                {selectedSupplier.preferredMaterials.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No catalog items explicitly linked as primary yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedSupplier.preferredMaterials.map((pm) => {
                      const deliveredValue = pm.projectStocks.reduce(
                        (s, ps) => s + ps.totalCost,
                        0
                      );
                      return (
                        <div
                          key={pm.id}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-brand-400 mr-2">
                              {pm.code}
                            </span>
                            <span className="font-medium text-white">
                              {pm.name}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Standard Rate:{" "}
                              {formatCurrency(pm.standardUnitCost, currency)}/
                              {pm.unit} • Active on {pm.projectStocks.length}{" "}
                              project site(s)
                            </p>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-emerald-400 font-bold block">
                              {formatCurrency(deliveredValue, currency)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Delivered Value
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Update Supplier Ledger Form */}
              {canManageSuppliers && (
                <form
                  onSubmit={handleUpdateLedger}
                  className="space-y-4 pt-4 border-t border-slate-800"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Supplier Status
                      </label>
                      <select
                        name="status"
                        defaultValue={selectedSupplier.status}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      >
                        <option value="ACTIVE">Active (Approved Vendor)</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="BLACKLISTED">Blacklisted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Payment Terms
                      </label>
                      <input
                        name="paymentTerms"
                        defaultValue={selectedSupplier.paymentTerms}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Total Purchased ({currency})
                      </label>
                      <input
                        type="number"
                        name="totalPurchased"
                        value={editPurchased}
                        onChange={(e) =>
                          setEditPurchased(Number(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-emerald-300 mb-1">
                        Total Paid ({currency})
                      </label>
                      <input
                        type="number"
                        name="totalPaid"
                        value={editPaid}
                        onChange={(e) =>
                          setEditPaid(Number(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-amber-300 mb-1">
                        Calculated Balance
                      </label>
                      <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-300">
                        {formatCurrency(
                          Math.max(0, editPurchased - editPaid),
                          currency
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Commercial & Quality Notes
                    </label>
                    <input
                      name="notes"
                      defaultValue={selectedSupplier.notes || ""}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier(null)}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950"
                    >
                      {isPending ? "Saving..." : "Update Supplier Ledger"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register New Construction Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Register Construction Supplier
                </h3>
                <p className="text-xs text-slate-400">
                  Add approved material vendor with KRA tax PIN and Bank/M-Pesa payment details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Tononoka Steels Ltd. or Savannah Cement"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Trade Category *
                  </label>
                  <select
                    name="category"
                    defaultValue="STEEL_METALS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {Object.entries(SUPPLIER_CATEGORY_STYLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <input
                    name="contactPerson"
                    required
                    placeholder="e.g. Daniel Kipkorir"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="+254 722 ..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="sales@vendor.co.ke"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    KRA Tax PIN
                  </label>
                  <input
                    name="taxPin"
                    placeholder="P051..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    name="paymentTerms"
                    defaultValue="Net 30 Days"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City / Location
                  </label>
                  <input
                    name="city"
                    defaultValue="Nairobi"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    name="bankName"
                    placeholder="e.g. KCB Bank Kenya"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bank Account #
                  </label>
                  <input
                    name="bankAccountNumber"
                    placeholder="110..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    M-Pesa Paybill / Till
                  </label>
                  <input
                    name="mpesaPaybill"
                    placeholder="Paybill 522522 • Acc: ..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplied Construction Materials *
                </label>
                <input
                  name="suppliedMaterials"
                  required
                  placeholder="e.g. Structural Steel Sections, Hollow Sections, Binding Wire & Nails"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950"
                >
                  {isPending ? "Saving..." : "Register Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
