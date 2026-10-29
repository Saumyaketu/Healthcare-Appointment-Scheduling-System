"use client";

import React, { useState, useMemo } from "react";
import { AvailabilitySession, Doctor, Appointment } from "@/lib/types";
import {
  Clock,
  Users,
  AlertTriangle,
  Calendar,
  Filter,
  Stethoscope,
  ChevronRight,
  CalendarX2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DoctorSideCalendar } from "./DoctorSideCalendar";

interface DoctorScheduleViewProps {
  sessions: AvailabilitySession[];
  doctors: Doctor[];
  appointments?: Appointment[];
  onSelectSession: (session: AvailabilitySession) => void;
}

export function DoctorScheduleView({
  sessions,
  doctors,
  appointments = [],
  onSelectSession,
}: DoctorScheduleViewProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const dayAfter = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  // Filters state
  const [dateFilter, setDateFilter] = useState<string>(todayStr); // Defaults to Today!
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set);
  }, [doctors]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      // Date filter
      if (dateFilter !== "ALL" && sess.sessionDate !== dateFilter) {
        return false;
      }
      // Doctor filter
      if (selectedDoctorId !== "ALL" && sess.doctorId !== selectedDoctorId) {
        return false;
      }
      // Department filter
      if (selectedDepartment !== "ALL" && sess.department !== selectedDepartment) {
        return false;
      }
      return true;
    });
  }, [sessions, dateFilter, selectedDoctorId, selectedDepartment]);

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    if (dateStr === dayAfter) return "Day After";
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const selectedDoctorObj = useMemo(() => {
    if (selectedDoctorId === "ALL") return null;
    return doctors.find((d) => d.id === selectedDoctorId) || null;
  }, [doctors, selectedDoctorId]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Side Calendar & Filter Sidebar */}
      <div className="w-80 md:w-84 border-r border-border bg-card/40 p-4 space-y-4 shrink-0 overflow-y-auto">
        <div>
          <h2 className="text-xs font-bold text-foreground">
            Schedule Calendar
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Click any date to inspect session capacity &amp; bookings
          </p>
        </div>

        {/* Doctor Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-primary" /> Physician:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            <option value="ALL">All Physicians ({doctors.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.department})
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        {departments.length > 0 && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-primary" /> Department:
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Side Calendar Widget */}
        <DoctorSideCalendar
          sessions={sessions}
          appointments={appointments}
          activeDoctorId={selectedDoctorId !== "ALL" ? selectedDoctorId : undefined}
          selectedDate={dateFilter}
          onSelectDate={(newDate) => setDateFilter(newDate)}
        />
      </div>

      {/* Main Sessions Stage */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* Stage Header */}
        <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Physician Timetable &amp; Schedules
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dateFilter === "ALL"
                ? "Showing all consultation shifts"
                : `Viewing shifts for ${formatDateDisplay(dateFilter)} (${dateFilter})`}
              {selectedDoctorObj ? ` • ${selectedDoctorObj.fullName}` : ""}
            </p>
          </div>

          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setDateFilter(todayStr)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateFilter === todayStr
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter(tomorrow)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateFilter === tomorrow
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDateFilter(dayAfter)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateFilter === dayAfter
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Day After
              </button>
              <button
                type="button"
                onClick={() => setDateFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  dateFilter === "ALL"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All Days
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Grid or Clean Empty State */}
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mb-3">
              <CalendarX2 className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              No Schedule for this Date
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {dateFilter !== "ALL"
                ? `There are no clinical sessions or OPD shifts scheduled on ${dateFilter}.`
                : "No sessions matched your filter criteria."}
            </p>
            <button
              type="button"
              onClick={() => setDateFilter(todayStr)}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
            >
              View Today&apos;s Sessions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSessions.map((sess) => {
              const doctor = doctors.find((d) => d.id === sess.doctorId);
              const isFull = sess.bookedCount >= sess.maxCapacity;
              const occupancyPct = Math.round((sess.bookedCount / sess.maxCapacity) * 100);

              return (
                <div
                  key={sess.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Doctor & Date Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {sess.doctorName}
                        </h3>
                        <p className="text-xs text-primary font-medium mt-0.5">
                          {sess.department}
                        </p>
                      </div>

                      {/* Date Badge */}
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 block">
                          {formatDateDisplay(sess.sessionDate)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                          {sess.sessionDate}
                        </span>
                      </div>
                    </div>

                    {/* Shift & Capacity Details */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Operating Hours:
                        </span>
                        <strong className="text-foreground">
                          {sess.startTime} - {sess.endTime}
                        </strong>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary" /> Slot Capacity:
                          </span>
                          <span className="font-semibold text-foreground">
                            {sess.bookedCount} / {sess.maxCapacity} Booked
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull
                                ? "bg-destructive"
                                : occupancyPct > 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, occupancyPct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/50">
                        <span>Walk-in Buffer:</span>
                        <strong className="text-foreground">
                          {sess.walkInUsed} / {sess.walkInCapacity} admitted
                        </strong>
                      </div>
                    </div>

                    {/* Delay Alert if any */}
                    {sess.isRunningLate && sess.delayMinutes > 0 && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Running +{sess.delayMinutes} min behind</span>
                      </div>
                    )}
                  </div>

                  {/* Footer with Fee & Action */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                        Consultation Fee
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {doctor ? formatCurrency(Number(doctor.consultationFee)) : "₹700"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectSession(sess)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <span>View Queue</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
