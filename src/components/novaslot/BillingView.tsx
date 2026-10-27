"use client";

import React from "react";
import { Appointment, Doctor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, Clock, Receipt } from "lucide-react";

interface BillingViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onToggleFee: (appointmentId: string) => void;
}

export function BillingView({
  appointments,
  doctors,
  onToggleFee,
}: BillingViewProps) {
  const paidCount = appointments.filter((a) => a.feeStatus === "PAID").length;
  const dueCount = appointments.filter((a) => a.feeStatus === "DUE").length;

  const totalCollected = paidCount * 800;
  const totalPending = dueCount * 800;

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          OPD Billing & Payment Reconciliation
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time payment audit and collection records for patient consultations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Collected Consultations</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {paidCount} accounts settled
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
            {dueCount} collections pending
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Registered Patients</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {appointments.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Active session records
          </div>
        </div>
      </div>

      {/* Billing Ledger */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
            Patient Consultation Fee Ledger
          </h3>
          <span className="text-xs text-muted-foreground">
            Click status button to reconcile
          </span>
        </div>

        <div className="divide-y divide-border text-xs">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-foreground w-16">
                  T-{apt.tokenNumber}
                </span>
                <div>
                  <div className="font-bold text-foreground">{apt.patientName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {apt.patientCode} • {apt.doctorName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">₹800</span>

                <button
                  onClick={() => onToggleFee(apt.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    apt.feeStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  }`}
                >
                  {apt.feeStatus === "PAID" ? "Settled" : "Collect at Counter"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
