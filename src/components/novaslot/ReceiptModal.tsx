"use client";

import React from "react";
import { Appointment, PaymentRecord, RefundRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  Printer,
  X,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  FileText,
} from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  payment?: PaymentRecord | null;
  refund?: RefundRecord | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  appointment,
  payment,
  refund,
}: ReceiptModalProps) {
  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = appointment.feeStatus === "PAID" || payment?.status === "PAID";
  const feeAmount = payment?.amount || appointment.consultationFee || 700;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="font-bold text-xs text-foreground">OPD Billing Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-foreground bg-white dark:bg-zinc-950 font-sans print:p-0 print:border-none">
          {/* Clinic Header */}
          <div className="border-b border-border pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-base font-black tracking-tight text-foreground flex items-center gap-1.5">
                <Building className="w-4 h-4 text-primary" /> NovaSlot Healthcare Clinic
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Outpatient Department Services & Diagnostics
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Reg: NABH-2026-MED-9941 • GSTIN: 27AAAAA0000A1Z5
              </p>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Official Receipt
              </span>
              <div className="font-mono text-xs font-bold text-foreground mt-1">
                {payment?.receiptNumber || `REC-${appointment.tokenNumber}-${appointment.patientCode}`}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Date: {appointment.appointmentDate}
              </div>
            </div>
          </div>

          {/* Token & Patient Strip */}
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Patient Information
              </span>
              <div className="font-bold text-foreground text-sm mt-0.5">{appointment.patientName}</div>
              <div className="text-[11px] text-muted-foreground">
                File ID: <span className="font-mono text-foreground font-semibold">{appointment.patientCode}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Demographics: {appointment.patientAge} Yrs / {appointment.patientGender}
              </div>
              <div className="text-[11px] text-muted-foreground">Phone: {appointment.patientPhone}</div>
            </div>

            <div className="border-l border-border pl-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                OPD Queue Assignment
              </span>
              <div className="text-xl font-black text-primary mt-0.5">Token #{appointment.tokenNumber}</div>
              <div className="text-[11px] font-semibold text-foreground">{appointment.doctorName}</div>
              <div className="text-[11px] text-muted-foreground">
                Estimated Slot: {appointment.estimatedTime || "Morning Session"}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
              Consultation Charges
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground">
                  <th className="py-1.5 font-semibold">Service Description</th>
                  <th className="py-1.5 font-semibold text-center">Department</th>
                  <th className="py-1.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2.5">
                    <span className="font-semibold text-foreground">Physician Consultation Fee</span>
                    <div className="text-[10px] text-muted-foreground">Standard OPD token appointment slot</div>
                  </td>
                  <td className="py-2.5 text-center text-muted-foreground">Clinical OPD</td>
                  <td className="py-2.5 text-right font-bold text-foreground">{formatCurrency(feeAmount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-bold text-foreground">
                  <td colSpan={2} className="py-2 text-right">Total Net Fee:</td>
                  <td className="py-2 text-right text-sm text-primary">{formatCurrency(feeAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment & Gateway Verification */}
          <div className="border rounded-xl p-3 bg-muted/20 border-border space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isPaid ? "PAID & SETTLED" : "PAYMENT DUE AT DESK"}
              </span>
            </div>

            {payment && (
              <>
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground font-sans">Gateway Provider:</span>
                  <span className="text-foreground font-semibold">Razorpay Secure</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground font-sans">Gateway Payment ID:</span>
                  <span className="text-foreground">{payment.gatewayPaymentId || "Mock Verified"}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground font-sans">Gateway Order ID:</span>
                  <span className="text-foreground">{payment.gatewayOrderId}</span>
                </div>
              </>
            )}

            {/* Refund Record if applicable */}
            {refund && (
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Refund Issued:</span>
                  <span>{formatCurrency(refund.refundAmount)} ({refund.refundPercentage}%)</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Refund Reference:</span>
                  <span>{refund.gatewayRefundId || "Pending Gateway Settle"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-muted-foreground text-center border-t border-border pt-3">
            Computer generated digital invoice. No signature required.
          </div>
        </div>
      </div>
    </div>
  );
}
