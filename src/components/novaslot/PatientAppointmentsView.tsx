"use client";

import React, { useState } from "react";
import { Appointment, AuthSession, AvailabilitySession, PaymentRecord, RefundRecord } from "@/lib/types";
import {
  CalendarCheck,
  Clock,
  User,
  Receipt,
  FileText,
  ShieldAlert,
  CalendarDays,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RescheduleModal } from "./RescheduleModal";
import { CancellationModal } from "./CancellationModal";
import { ReceiptModal } from "./ReceiptModal";

interface PatientAppointmentsViewProps {
  appointments: Appointment[];
  sessions?: AvailabilitySession[];
  currentUser?: AuthSession | null;
  onCancelAppointment?: (id: string) => void;
  onOpenBooking: () => void;
  onRefresh?: () => void;
}

export function PatientAppointmentsView({
  appointments,
  sessions = [],
  currentUser,
  onOpenBooking,
  onRefresh,
}: PatientAppointmentsViewProps) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Modals state
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancellationAppointment, setCancellationAppointment] = useState<Appointment | null>(null);
  const [receiptAppointment, setReceiptAppointment] = useState<Appointment | null>(null);

  // Strict Least Privilege:
  // If logged in as patient, only display appointments belonging to this patient!
  const userAppointments = React.useMemo(() => {
    if (currentUser?.user.role === "PATIENT") {
      const patientPhone = currentUser.user.phone.replace(/[^0-9]/g, "");
      const patientName = currentUser.user.fullName.toLowerCase().trim();

      return appointments.filter((apt) => {
        const aptPhone = apt.patientPhone.replace(/[^0-9]/g, "");
        const aptName = apt.patientName.toLowerCase().trim();
        return (
          apt.patientId === currentUser.patientProfile?.id ||
          (patientPhone && aptPhone && (aptPhone.endsWith(patientPhone) || patientPhone.endsWith(aptPhone))) ||
          aptName === patientName
        );
      });
    }
    return appointments;
  }, [appointments, currentUser]);

  const filteredAppointments = userAppointments.filter((apt) => {
    if (filter === "ACTIVE") {
      return apt.status === "CONFIRMED" || apt.status === "IN_CONSULT" || apt.status === "PENDING";
    }
    if (filter === "COMPLETED") {
      return apt.status === "COMPLETED" || apt.status === "CANCELLED";
    }
    return true;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            My Appointments & Live OPD Tokens
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentUser?.user.role === "PATIENT"
              ? `Personal appointments, digital tokens, and payment receipts for ${currentUser.user.fullName}`
              : "Monitor real-time physician queue progress, issued tokens, and consult notes"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "ALL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All ({userAppointments.length})
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "ACTIVE" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Active Queue
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "COMPLETED" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Concluded
            </button>
          </div>

          <button
            onClick={onOpenBooking}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-bold text-foreground">No bookings found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {currentUser?.user.role === "PATIENT"
              ? "You do not have any appointments under this account."
              : "No appointments matching this filter."}
          </p>
          <button
            onClick={onOpenBooking}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
          >
            Book a Slot Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isInConsult = apt.status === "IN_CONSULT";
            const isConfirmed = apt.status === "CONFIRMED";
            const isCompleted = apt.status === "COMPLETED";
            const isCancelled = apt.status === "CANCELLED";
            const isRefundProcessed = apt.refundStatus === "PROCESSED";
            const isRefundPending = apt.refundStatus === "PENDING";

            return (
              <div
                key={apt.id}
                className={`bg-card border rounded-2xl p-5 shadow-xs transition-all ${
                  isInConsult
                    ? "border-primary bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-primary/40"
                    : isCancelled
                    ? "border-border/60 opacity-85"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Token & Doctor Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                        isInConsult
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : isCompleted
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : isCancelled
                          ? "bg-muted text-muted-foreground border border-border"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider opacity-80">
                        Token
                      </span>
                      <span className="text-xl leading-none">{apt.tokenNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">
                          {apt.doctorName}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {apt.patientCode}
                        </span>
                        {apt.rescheduledAt && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Rescheduled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {apt.patientName} ({apt.patientAge} {apt.patientGender})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          {apt.appointmentDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Est: {apt.estimatedTime || "Morning"}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        {isInConsult ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            Physician is seeing you right now
                          </span>
                        ) : isConfirmed ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Confirmed • In Waiting Queue
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Consultation Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Pending Payment Confirmation
                          </span>
                        )}

                        {/* Fee Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                            apt.feeStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300/40"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300/40"
                          }`}
                        >
                          <Receipt className="w-3 h-3" />
                          {apt.feeStatus === "PAID" ? "Fee Paid (Online)" : "Fee Due at Desk"}
                        </span>

                        {/* Refund Status Pill if cancelled */}
                        {isCancelled && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                              isRefundProcessed
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isRefundPending
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            {isRefundProcessed
                              ? "Refund Initiated to Source"
                              : isRefundPending
                              ? "Refund Processing"
                              : "Non-Refundable Window"}
                          </span>
                        )}
                      </div>

                      {apt.cancellationReason && (
                        <p className="text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                          <strong>Cancellation Reason:</strong> {apt.cancellationReason}
                        </p>
                      )}

                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          <strong className="text-foreground">Clinical Purpose:</strong> {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                    {/* Reschedule Button */}
                    {(isConfirmed || apt.status === "PENDING") && (
                      <button
                        onClick={() => setRescheduleAppointment(apt)}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        Reschedule Slot
                      </button>
                    )}

                    {/* Cancel Button */}
                    {(isConfirmed || apt.status === "PENDING") && (
                      <button
                        onClick={() => setCancellationAppointment(apt)}
                        className="px-3 py-1.5 rounded-xl border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Cancel Slot
                      </button>
                    )}

                    {/* View Invoice / Receipt Button */}
                    <button
                      onClick={() => setReceiptAppointment(apt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5 text-primary" />
                      View Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <RescheduleModal
          isOpen={Boolean(rescheduleAppointment)}
          onClose={() => setRescheduleAppointment(null)}
          appointment={rescheduleAppointment}
          sessions={sessions}
          onSuccess={() => {
            setRescheduleAppointment(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Cancellation Modal with Refund Breakdown */}
      {cancellationAppointment && (
        <CancellationModal
          isOpen={Boolean(cancellationAppointment)}
          onClose={() => setCancellationAppointment(null)}
          appointment={cancellationAppointment}
          onSuccess={() => {
            setCancellationAppointment(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {receiptAppointment && (
        <ReceiptModal
          isOpen={Boolean(receiptAppointment)}
          onClose={() => setReceiptAppointment(null)}
          appointment={receiptAppointment}
        />
      )}
    </div>
  );
}
