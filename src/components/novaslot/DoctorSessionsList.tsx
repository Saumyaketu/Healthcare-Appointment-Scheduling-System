"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AvailabilitySession, AuthSession, Appointment } from "@/lib/types";
import { Clock, AlertTriangle, CalendarX2 } from "lucide-react";
import { DoctorSideCalendar } from "./DoctorSideCalendar";

interface DoctorSessionsListProps {
  sessions: AvailabilitySession[];
  appointments?: Appointment[];
  selectedSessionId: string;
  currentUser?: AuthSession | null;
  onSelectSession: (session: AvailabilitySession | null) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export function DoctorSessionsList({
  sessions,
  appointments = [],
  selectedSessionId,
  currentUser,
  onSelectSession,
  selectedDate: externalDate,
  onDateChange,
}: DoctorSessionsListProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Internal date state if external not controlled
  const [internalDate, setInternalDate] = useState<string>(todayStr);
  const activeDate = externalDate !== undefined ? externalDate : internalDate;

  const handleDateSelect = (dateStr: string) => {
    if (onDateChange) {
      onDateChange(dateStr);
    } else {
      setInternalDate(dateStr);
    }
  };

  const [doctorFilter, setDoctorFilter] = useState<string>("ALL");

  // Base role-based filter
  const baseSessions = useMemo(() => {
    if (currentUser?.user.role === "DOCTOR" && currentUser.doctorProfile) {
      return sessions.filter((s) => s.doctorId === currentUser.doctorProfile?.id);
    }
    return sessions;
  }, [sessions, currentUser]);

  // Active doctor ID for calendar
  const activeDoctorId = useMemo(() => {
    if (currentUser?.user.role === "DOCTOR" && currentUser.doctorProfile) {
      return currentUser.doctorProfile.id;
    }
    return doctorFilter !== "ALL" ? doctorFilter : undefined;
  }, [currentUser, doctorFilter]);

  // Extract unique doctors for the dropdown
  const uniqueDoctors = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (!map.has(s.doctorId)) {
        map.set(s.doctorId, s.doctorName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // Filter by date & doctor
  const displayedSessions = useMemo(() => {
    return baseSessions.filter((s) => {
      if (activeDate !== "ALL" && s.sessionDate !== activeDate) {
        return false;
      }
      if (doctorFilter !== "ALL" && s.doctorId !== doctorFilter) {
        return false;
      }
      return true;
    });
  }, [baseSessions, activeDate, doctorFilter]);

  // Sync selected session when displayedSessions change
  useEffect(() => {
    if (displayedSessions.length > 0) {
      const alreadySelected = displayedSessions.some((s) => s.id === selectedSessionId);
      if (!alreadySelected) {
        onSelectSession(displayedSessions[0]);
      }
    } else {
      // If no schedule on this day, notify parent to show nothing for that day
      onSelectSession(null);
    }
  }, [displayedSessions, selectedSessionId, onSelectSession]);

  return (
    <div className="w-80 md:w-84 border-r border-border bg-card/40 flex flex-col shrink-0 overflow-y-auto">
      {/* Top Header */}
      <div className="p-3 border-b border-border bg-muted/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground">
            {currentUser?.user.role === "DOCTOR" ? "My OPD Schedule" : "Live Queue Sessions"}
          </h2>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {displayedSessions.length} session{displayedSessions.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Doctor Filter (Reception/Admin only) */}
        {currentUser?.user.role !== "DOCTOR" && uniqueDoctors.length > 1 && (
          <div>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">All Physicians ({uniqueDoctors.length})</option>
              {uniqueDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Side Calendar Widget */}
        <DoctorSideCalendar
          sessions={baseSessions}
          appointments={appointments}
          activeDoctorId={activeDoctorId}
          selectedDate={activeDate}
          onSelectDate={handleDateSelect}
        />
      </div>

      {/* Session list items for the chosen date */}
      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {displayedSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border mx-auto flex items-center justify-center">
              <CalendarX2 className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No Schedule for this Date</p>
            <p className="text-[11px] text-muted-foreground">
              {activeDate ? `No clinical sessions scheduled for ${activeDate}.` : "Select a date above."}
            </p>
            <button
              type="button"
              onClick={() => handleDateSelect(todayStr)}
              className="mt-2 text-primary font-semibold text-xs hover:underline block mx-auto"
            >
              View Today&apos;s Queue
            </button>
          </div>
        ) : (
          displayedSessions.map((session) => {
            const isSelected = session.id === selectedSessionId;
            const isToday = session.sessionDate === todayStr;

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

                  {/* Date Tag */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isToday
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {isToday ? "Today" : session.sessionDate}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-primary" />
                  {session.startTime} - {session.endTime}
                </div>

                {/* Session Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                    {session.sessionType}
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

                  <span className="text-[10px] font-bold text-primary">
                    {session.waitingCount} waiting
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
