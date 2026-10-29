"use client";

import React, { useState, useEffect } from "react";
import { Appointment, RefundPolicyEstimate } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: (updatedAppointment: Appointment) => void;
}

export function CancellationModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: CancellationModalProps) {
  const [reason, setReason] = useState("");
  const [estimate, setEstimate] = useState<RefundPolicyEstimate | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && appointment) {
      setReason("");
      setResultData(null);
      setError(null);
      fetchEstimate();
    }
  }, [isOpen, appointment]);

  const fetchEstimate = async () => {
    if (!appointment) return;
    setIsLoadingEstimate(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/refund-estimate`);
      const data = await res.json();
      if (data.success) {
        setEstimate(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch refund estimate", err);
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError("Please provide a reason for cancellation (at least 3 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          cancelledByRole: "PATIENT",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel appointment");
      }

      setResultData(data.data);
      onSuccess(data.data.appointment);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during cancellation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResultData(null);
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Cancel Appointment</h2>
              <p className="text-[11px] text-muted-foreground">
                Review refund eligibility before releasing your queue token
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {resultData ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Appointment Cancelled</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your token has been released. A cancellation receipt has been sent to your email.
                </p>
              </div>

              <div className="bg-muted/40 p-3.5 rounded-xl text-left border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-destructive">CANCELLED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {resultData.appointment.refundStatus === "PROCESSED"
                      ? "Refund Initiated (3-5 business days)"
                      : resultData.appointment.refundStatus === "PENDING"
                      ? "Refund Processing"
                      : "Non-refundable"}
                  </span>
                </div>
                {resultData.refundRecord && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refund Amount:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(resultData.refundRecord.refundAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground font-sans">Refund Ref:</span>
                      <span className="text-foreground">{resultData.refundRecord.gatewayRefundId || "Pending"}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Appointment summary */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Slot Details</span>
                  <span className="font-mono font-bold text-foreground">Token #{appointment.tokenNumber}</span>
                </div>
                <div className="text-foreground font-semibold">
                  {appointment.doctorName} • {appointment.appointmentDate}
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Patient: {appointment.patientName} ({appointment.patientCode})
                </div>
              </div>

              {/* Real-time Refund Policy Breakdown */}
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-primary" /> Refund Policy Calculation
                  </span>
                  {isLoadingEstimate && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>

                {estimate && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Original Fee:</span>
                      <span className="text-foreground font-semibold">{formatCurrency(estimate.originalFee)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Applicable Refund Tier:</span>
                      <span className="font-bold text-foreground">{estimate.refundPercentage}% Refund</span>
                    </div>
                    {estimate.deductionAmount > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400">
                        <span>Clinic Cancellation Fee:</span>
                        <span>- {formatCurrency(estimate.deductionAmount)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between font-bold">
                      <span className="text-foreground">Estimated Refund to Source:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(estimate.refundAmount)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                      <strong>Policy Note:</strong> {estimate.policyNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Cancellation Reason */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Reason for Cancellation <span className="text-destructive">*</span>
                </label>
                <select
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs mb-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="">Select a common reason...</option>
                  <option value="Personal schedule conflict">Personal schedule conflict</option>
                  <option value="Symptoms resolved / feeling better">Symptoms resolved / feeling better</option>
                  <option value="Consulting alternative specialist">Consulting alternative specialist</option>
                  <option value="Medical emergency / Hospitalization">Medical emergency / Hospitalization</option>
                  <option value="Travel or transport issue">Travel or transport issue</option>
                </select>

                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Or enter specific details here..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Please note: Slot cancellation is instantaneous. Bank refunds take 3 to 5 working days to settle.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
