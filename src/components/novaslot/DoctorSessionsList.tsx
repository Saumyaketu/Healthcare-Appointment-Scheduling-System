"use client";

import React from "react";
import { AvailabilitySession } from "@/lib/types";
import { Clock, AlertTriangle, Users } from "lucide-react";

interface DoctorSessionsListProps {
  sessions: AvailabilitySession[];
  selectedSessionId: string;
  onSelectSession: (session: AvailabilitySession) => void;
}

export function DoctorSessionsList({
  sessions,
  selectedSessionId,
  onSelectSession,
}: DoctorSessionsListProps) {
  return (
    <div className="w-80 border-r border-border bg-card/40 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-border bg-muted/20">
        <h2 className="text-sm font-bold text-foreground flex items-center justify-between">
          <span>Active OPD Sessions</span>
          <span className="text-xs font-normal text-muted-foreground">
            {sessions.length} active
          </span>
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Select a physician session to monitor the live token queue
        </p>
      </div>

      <div className="divide-y divide-border">
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`p-3.5 cursor-pointer transition-all ${
                isSelected
                  ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary shadow-xs"
                  : "hover:bg-muted/50"
              }`}
            >
              {/* Doctor Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {session.doctorName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {session.department}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {session.startTime} - {session.endTime}
                </div>
              </div>

              {/* Session Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  {session.sessionType}
                </span>

                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  Token Queue
                </span>

                {session.isRunningLate && session.delayMinutes > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    +{session.delayMinutes}m delay
                  </span>
                )}
              </div>

              {/* Booking & Capacity Counts */}
              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                <div className="text-muted-foreground">
                  Booked{" "}
                  <strong className="text-foreground font-semibold">
                    {session.bookedCount}/{session.maxCapacity}
                  </strong>{" "}
                  • Walk-in{" "}
                  <strong className="text-foreground font-semibold">
                    {session.walkInUsed}/{session.walkInCapacity}
                  </strong>
                </div>

                <div className="flex items-center gap-1 text-primary font-semibold text-[11px]">
                  <Users className="w-3 h-3" />
                  <span>{session.waitingCount} waiting</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
