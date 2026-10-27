"use client";

import React from "react";
import { AvailabilitySession, Doctor } from "@/lib/types";
import { Clock, Users, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DoctorScheduleViewProps {
  sessions: AvailabilitySession[];
  doctors: Doctor[];
  onSelectSession: (session: AvailabilitySession) => void;
}

export function DoctorScheduleView({
  sessions,
  doctors,
  onSelectSession,
}: DoctorScheduleViewProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">
          Physician Availability & OPD Timetable
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Weekly consultation hours, slot capacities, and live progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((sess) => {
          const doctor = doctors.find((d) => d.id === sess.doctorId);

          return (
            <div
              key={sess.id}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {sess.doctorName}
                    </h3>
                    <p className="text-xs text-primary font-medium">
                      {sess.department}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                    {sess.sessionType}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Session Window:
                    </span>
                    <strong className="text-foreground">
                      {sess.startTime} - {sess.endTime}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Capacity:
                    </span>
                    <strong className="text-foreground">
                      {sess.bookedCount} / {sess.maxCapacity} Booked
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Walk-in Buffer:</span>
                    <strong className="text-foreground">
                      {sess.walkInUsed} / {sess.walkInCapacity}
                    </strong>
                  </div>
                </div>

                {sess.isRunningLate && sess.delayMinutes > 0 && (
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Running +{sess.delayMinutes} min behind</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Fee: {doctor ? formatCurrency(Number(doctor.consultationFee)) : "₹800"}
                </span>
                <button
                  onClick={() => onSelectSession(sess)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all"
                >
                  View Live Queue
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
