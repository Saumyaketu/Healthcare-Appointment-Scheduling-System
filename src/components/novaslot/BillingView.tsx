"use client";

import React, { useState } from "react";
import { Appointment, Doctor, Role } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  Receipt,
  RotateCcw,
  ShieldAlert,
  CreditCard,
  Building,
  RefreshCw,
  Search,
  Printer,
  AlertCircle,
} from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";

interface BillingViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onToggleFee: (appointmentId: string) => void;
  onRefresh?: () => void;
}

export function BillingView({
  appointments,
  doctors,
  onToggleFee,
  onRefresh,
}: BillingViewProps) {
  const [filter, setFilter] = useState<"ALL" | "PAID_ONLINE" | "PAID_CASH" | "DUE" | "REFUNDED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // Manual Refund Modal state
  const [refundModalApt, setRefundModalApt] = useState<Appointment | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  // Metrics calculation
  const paidAppointments = appointments.filter((a) => a.feeStatus === "PAID");
  const dueAppointments = appointments.filter((a) => a.feeStatus === "DUE");
  const refundedAppointments = appointments.filter((a) => a.refundStatus === "PROCESSED");

  const totalCollected = paidAppointments.reduce(
    (sum, a) => sum + (a.consultationFee || 700),
    0
  );
  const totalPending = dueAppointments.reduce(
    (sum, a) => sum + (a.consultationFee || 700),
    0
  );
  const totalRefunded = refundedAppointments.reduce(
    (sum, a) => sum + (a.consultationFee || 700),
    0
  );

  const filteredAppointments = appointments.filter((apt) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = apt.patientName.toLowerCase().includes(q);
      const matchCode = apt.patientCode.toLowerCase().includes(q);
      const matchDoc = apt.doctorName.toLowerCase().includes(q);
      const matchToken = `t-${apt.tokenNumber}`.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDoc && !matchToken) return false;
    }

    if (filter === "PAID_ONLINE") {
      return apt.feeStatus === "PAID" && apt.paymentId;
    }
    if (filter === "PAID_CASH") {
      return apt.feeStatus === "PAID" && !apt.paymentId;
    }
    if (filter === "DUE") {
      return apt.feeStatus === "DUE";
    }
    if (filter === "REFUNDED") {
      return apt.refundStatus === "PROCESSED" || apt.refundStatus === "PENDING";
    }
    return true;
  });

  const handleOpenRefundModal = (apt: Appointment) => {
    const fee = apt.consultationFee || 700;
    setRefundModalApt(apt);
    setRefundAmount(fee);
    setRefundReason("Front desk administrative refund approval");
    setRefundError(null);
  };

  const handleExecuteManualRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalApt) return;
    if (!refundAmount || Number(refundAmount) <= 0) {
      setRefundError("Please enter a valid refund amount");
      return;
    }

    setIsProcessingRefund(true);
    setRefundError(null);

    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: refundModalApt.id,
          amount: Number(refundAmount),
          reason: refundReason.trim() || "Front desk refund",
          adminRole: "ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process refund");
      }

      setRefundModalApt(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setRefundError(err.message || "An unexpected error occurred during refund");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* View Header */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            OPD Billing & Payment Reconciliation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Razorpay online gateway audit, counter cash reconciliation &amp; refund disbursements
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient, token, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Collected Fees</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {paidAppointments.length} patient accounts settled
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Pending Front Desk Fees</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {dueAppointments.length} counter collections pending
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Refunded to Patients</span>
            <RotateCcw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(totalRefunded)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {refundedAppointments.length} processed cancellations
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Consultation Volume</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {appointments.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Total registered OPD sessions
          </div>
        </div>
      </div>

      {/* Ledger with Filters */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "ALL" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All Records ({appointments.length})
            </button>
            <button
              onClick={() => setFilter("PAID_ONLINE")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "PAID_ONLINE" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Online Razorpay
            </button>
            <button
              onClick={() => setFilter("PAID_CASH")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "PAID_CASH" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Counter Cash
            </button>
            <button
              onClick={() => setFilter("DUE")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "DUE" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Pending Collection
            </button>
            <button
              onClick={() => setFilter("REFUNDED")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === "REFUNDED" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Refunds
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Click status pill to toggle fee settlement
          </span>
        </div>

        {/* Ledger Rows */}
        <div className="divide-y divide-border text-xs">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No financial records matching current filter
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const fee = apt.consultationFee || 700;
              const isPaid = apt.feeStatus === "PAID";
              const isRefunded = apt.refundStatus === "PROCESSED";
              const isCancelled = apt.status === "CANCELLED";

              return (
                <div
                  key={apt.id}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground w-16 text-center py-1 rounded bg-muted/60 border border-border">
                      T-{apt.tokenNumber}
                    </span>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{apt.patientName}</span>
                        <span className="text-[11px] font-mono text-muted-foreground font-normal">
                          ({apt.patientCode})
                        </span>
                        {apt.paymentId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> Razorpay
                          </span>
                        )}
                        {isRefunded && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Refund Processed
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {apt.doctorName} • {apt.appointmentDate} • Status:{" "}
                        <span className="font-semibold text-foreground">{apt.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <span className="font-bold text-foreground text-sm w-20 text-right">
                      {formatCurrency(fee)}
                    </span>

                    {/* Reconcile Fee Toggle Button */}
                    <button
                      onClick={() => onToggleFee(apt.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {isPaid ? "Settled" : "Collect at Counter"}
                    </button>

                    {/* Manual Issue Refund Action */}
                    {isPaid && !isRefunded && (
                      <button
                        onClick={() => handleOpenRefundModal(apt)}
                        className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                        title="Process full or partial refund"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Refund
                      </button>
                    )}

                    {/* View Receipt */}
                    <button
                      onClick={() => setSelectedReceiptApt(apt)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="View digital invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Refund Modal */}
      {refundModalApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Issue Patient Consultation Refund</h3>
              </div>
              <button
                onClick={() => setRefundModalApt(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {refundError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{refundError}</div>
              </div>
            )}

            <form onSubmit={handleExecuteManualRefund} className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <div className="font-semibold text-foreground">{refundModalApt.patientName}</div>
                <div className="text-muted-foreground">
                  Token #{refundModalApt.tokenNumber} • Doctor: {refundModalApt.doctorName}
                </div>
                <div className="text-muted-foreground">
                  Original Settled Amount:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(refundModalApt.consultationFee || 700)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Refund Amount (₹) <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={refundModalApt.consultationFee || 700}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : "")}
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setRefundAmount(refundModalApt.consultationFee || 700)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-xs font-semibold hover:bg-muted"
                  >
                    Full 100%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRefundAmount(
                        Math.round(((refundModalApt.consultationFee || 700) * 0.7))
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-xs font-semibold hover:bg-muted"
                  >
                    70%
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Refund Reason <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Doctor unavailable, patient request, administrative waiver"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRefundModalApt(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingRefund ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Disbursing...
                    </>
                  ) : (
                    "Authorize & Issue Refund"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptApt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceiptApt)}
          onClose={() => setSelectedReceiptApt(null)}
          appointment={selectedReceiptApt}
        />
      )}
    </div>
  );
}
