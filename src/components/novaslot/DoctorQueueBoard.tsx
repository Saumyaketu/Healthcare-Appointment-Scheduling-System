"use client";

import React, { useState } from "react";
import {
  AvailabilitySession,
  Appointment,
  AppointmentStatus,
} from "@/lib/types";
import {
  Clock,
  AlertTriangle,
  Play,
  CheckCircle,
  Plus,
  RefreshCw,
  XCircle,
  Phone,
  AlertCircle,
  Receipt,
  CalendarX2,
} from "lucide-react";

interface DoctorQueueBoardProps {
  session: AvailabilitySession | null;
  selectedDate?: string;
  doctorName?: string;
  appointments: Appointment[];
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onToggleFee: (appointmentId: string) => void;
  onOpenWalkIn: () => void;
  onUpdateDelay: (sessionId: string, minutes: number, isLate: boolean) => void;
  onRefresh: () => void;
}

export function DoctorQueueBoard({
  session,
  selectedDate,
  doctorName,
  appointments,
  onUpdateStatus,
  onToggleFee,
  onOpenWalkIn,
  onUpdateDelay,
  onRefresh,
}: DoctorQueueBoardProps) {
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayInput, setDelayInput] = useState<number>(session?.delayMinutes || 15);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-background">
        <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mb-3">
          <CalendarX2 className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {doctorName ? `No Schedule for ${doctorName}` : "No Schedule for this Date"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {selectedDate
            ? `There are no clinical consultation sessions or appointments scheduled on ${selectedDate}.`
            : "Select a date with an active session from the side calendar to view the live queue."}
        </p>
      </div>
    );
  }

  // Filter appointments for this session
  const sessionQueue = appointments.filter((a) => a.availabilityId === session.id);

  // Group into Active/Waiting vs Completed/Cancelled
  const activeQueue = sessionQueue.filter(
    (a) => a.status === "IN_CONSULT" || a.status === "CONFIRMED" || a.status === "PENDING"
  );
  const completedQueue = sessionQueue.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED"
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      {/* Top Header of the Queue */}
      <div className="p-4 border-b border-border bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Queue — {session.doctorName}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{session.department}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {session.startTime} – {session.endTime}
            </span>
            <span>•</span>
            <span>
              Booked <strong>{session.bookedCount}/{session.maxCapacity}</strong>
            </span>
            <span>•</span>
            <span>
              Walk-in <strong>{session.walkInUsed}/{session.walkInCapacity}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWalkIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            + Walk-in Admit
          </button>

          <button
            onClick={() => setShowDelayModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {session.isRunningLate ? `Delay: +${session.delayMinutes}m` : "Flag Delay"}
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delay Notice Banner if Running Late */}
      {session.isRunningLate && session.delayMinutes > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>{session.doctorName}</strong> is running {session.delayMinutes} minutes behind schedule. Patient estimated consultation times have been recalculated.
            </span>
          </div>

          <button
            onClick={() => onUpdateDelay(session.id, 0, false)}
            className="text-[11px] underline font-medium hover:text-amber-700 dark:hover:text-amber-100 shrink-0"
          >
            Reset Delay
          </button>
        </div>
      )}

      {/* Main Queue List */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
          <div className="font-bold text-foreground text-sm flex items-center gap-2">
            <span>In Consultation & Waiting</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {activeQueue.length}
            </span>
          </div>
          <span className="text-[11px]">Sorted by Token Order</span>
        </div>

        {activeQueue.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
            No patients currently queued in this session.
          </div>
        ) : (
          <div className="space-y-3">
            {activeQueue.map((apt) => {
              const isInConsult = apt.status === "IN_CONSULT";
              const isEmergency = apt.priority === "EMERGENCY";

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isInConsult
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-primary shadow-sm"
                      : isEmergency
                      ? "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                      : "bg-card border-border hover:border-border/80 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Token & Patient Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                          isInConsult
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : isEmergency
                            ? "bg-red-600 text-white"
                            : "bg-muted text-foreground border border-border"
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-tighter opacity-80 leading-none">
                          Token
                        </span>
                        <span className="text-lg leading-tight">{apt.tokenNumber}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground">
                            {apt.patientName}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            {apt.patientAge} {apt.patientGender}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {apt.patientCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.patientPhone}
                          </span>
                        </div>

                        {/* Badges Bar */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {/* Status Badge */}
                          {isInConsult ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              In Consultation
                            </span>
                          ) : apt.status === "CONFIRMED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Waiting
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Pending Confirmation
                            </span>
                          )}

                          {/* Emergency Tag */}
                          {isEmergency && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent Care
                            </span>
                          )}

                          {/* Walk-in Tag */}
                          {apt.isWalkIn && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border">
                              Walk-in
                            </span>
                          )}

                          {/* Fee Status Toggle */}
                          <button
                            onClick={() => onToggleFee(apt.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                              apt.feeStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100"
                            }`}
                            title="Click to toggle payment reconciliation"
                          >
                            <Receipt className="w-3 h-3" />
                            {apt.feeStatus === "PAID" ? "Fee Paid" : "Fee Due"}
                          </button>
                        </div>

                        {/* Consultation Notes */}
                        {apt.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 bg-muted/30 p-2 rounded-lg border border-border/50">
                            <strong className="text-foreground">Clinical Purpose:</strong> {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Time & Doctor Consultation Action Buttons */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {apt.estimatedTime || "Scheduled Today"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, "CONFIRMED")}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
                          >
                            Confirm
                          </button>
                        )}

                        {!isInConsult && apt.status === "CONFIRMED" && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, "IN_CONSULT")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Call Patient
                          </button>
                        )}

                        {isInConsult && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, "COMPLETED")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Finish Consult
                          </button>
                        )}

                        <button
                          onClick={() => onUpdateStatus(apt.id, "CANCELLED")}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Cancel appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed section */}
        {completedQueue.length > 0 && (
          <div className="mt-8 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              Concluded in this Session ({completedQueue.length})
            </h4>

            <div className="space-y-2 opacity-75">
              {completedQueue.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">Token #{apt.tokenNumber}</span>
                    <span className="font-medium text-foreground">{apt.patientName}</span>
                    <span className="text-muted-foreground font-mono">{apt.patientCode}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        apt.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delay Adjustment Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Session Delay Broadcast
              </h3>
              <button
                onClick={() => setShowDelayModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Notify patients and reception desk if the physician is running behind schedule.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Delay Duration (minutes):
              </label>
              <div className="flex items-center gap-2">
                {[10, 15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDelayInput(mins)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                      delayInput === mins
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={delayInput}
                onChange={(e) => setDelayInput(Number(e.target.value))}
                min="0"
                max="180"
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Custom minutes"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateDelay(session.id, 0, false);
                  setShowDelayModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
              >
                Clear (On Time)
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateDelay(session.id, delayInput, delayInput > 0);
                  setShowDelayModal(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Broadcast Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
