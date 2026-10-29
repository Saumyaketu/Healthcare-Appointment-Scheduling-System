"use client";

import React, { useState } from "react";
import { Appointment, AvailabilitySession } from "@/lib/types";
import {
  Calendar,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  CalendarDays,
  Users,
} from "lucide-react";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  sessions: AvailabilitySession[];
  onSuccess: (updatedAppointment: Appointment) => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  sessions,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen || !appointment) return null;

  // Filter available sessions for this doctor (excluding current session)
  const availableSessions = sessions.filter(
    (s) => s.doctorId === appointment.doctorId && s.id !== appointment.availabilityId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setError("Please choose a target consultation session");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAvailabilityId: selectedSessionId,
          reason: reason.trim() || "Patient requested reschedule",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reschedule appointment");
      }

      setSuccessData(data.data);
      onSuccess(data.data.appointment);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setSelectedSessionId("");
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
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Reschedule Appointment</h2>
              <p className="text-[11px] text-muted-foreground">
                Move slot to an alternative date without losing your paid status
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

          {successData ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Reschedule Confirmed!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your new token number has been issued. An updated email confirmation has been sent.
                </p>
              </div>

              <div className="bg-muted/40 p-3.5 rounded-xl text-left border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Token Number:</span>
                  <span className="font-bold text-foreground text-sm">#{successData.appointment.tokenNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Session Date:</span>
                  <span className="font-semibold text-foreground">{successData.appointment.appointmentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-semibold text-foreground">{appointment.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Paid Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PRESERVED (Paid)</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Appointment Banner */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Current Booking</span>
                  <span className="font-mono font-bold text-foreground">Token #{appointment.tokenNumber}</span>
                </div>
                <div className="text-foreground font-semibold">
                  {appointment.doctorName} • {appointment.appointmentDate} ({appointment.estimatedTime || "Morning"})
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Patient: {appointment.patientName} ({appointment.patientCode})
                </div>
              </div>

              {/* Select Target Session */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5">
                  Choose New Consultation Session <span className="text-destructive">*</span>
                </label>

                {availableSessions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                    No alternative future sessions found for this doctor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableSessions.map((s) => {
                      const isFull = s.bookedCount >= s.maxCapacity;
                      const isSelected = selectedSessionId === s.id;

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (!isFull) setSelectedSessionId(s.id);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isFull
                              ? "opacity-50 bg-muted/30 border-border cursor-not-allowed"
                              : isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-border/80 hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-bold text-foreground">{s.sessionDate}</span>
                              <span className="text-muted-foreground font-medium">
                                ({s.startTime} - {s.endTime})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              {isFull ? (
                                <span className="text-destructive font-bold">FULL</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {s.maxCapacity - s.bookedCount} slots left
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reschedule Reason */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Reason for Rescheduling (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Work schedule conflict, feeling unwell"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSessionId}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Updating Slot...
                    </>
                  ) : (
                    "Confirm Reschedule"
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
