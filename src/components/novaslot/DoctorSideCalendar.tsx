"use client";

import React, { useState, useMemo } from "react";
import { AvailabilitySession, Appointment } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
} from "lucide-react";

interface DoctorSideCalendarProps {
  sessions: AvailabilitySession[];
  appointments?: Appointment[];
  activeDoctorId?: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  className?: string;
}

export function DoctorSideCalendar({
  sessions,
  appointments,
  activeDoctorId,
  selectedDate,
  onSelectDate,
  className = "",
}: DoctorSideCalendarProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Initialize view date to current month or selected date
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate && selectedDate !== "ALL") {
      const d = new Date(`${selectedDate}T00:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-11

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(now);
    onSelectDate(todayStr);
  };

  // Month name display
  const monthName = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [viewDate]);

  // Days in month calculation
  const { paddingDays, daysInMonth } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    return {
      paddingDays: firstDay,
      daysInMonth: totalDays,
    };
  }, [currentYear, currentMonth]);

  // Calculate day statuses for the entire month
  const dayStatsMap = useMemo(() => {
    const stats: Record<
      string,
      {
        hasSchedule: boolean;
        totalCapacity: number;
        bookedCount: number;
        status: "no-schedule" | "full" | "has-appointments" | "none";
      }
    > = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Filter sessions for this doctor on this day
      const daySessions = sessions.filter((s) => {
        if (s.sessionDate !== dateStr) return false;
        if (activeDoctorId && activeDoctorId !== "ALL" && s.doctorId !== activeDoctorId) {
          return false;
        }
        return true;
      });

      const hasSchedule = daySessions.length > 0;
      const totalCapacity = daySessions.reduce((acc, s) => acc + s.maxCapacity, 0);

      let bookedCount = 0;
      if (appointments && appointments.length > 0) {
        const dayApts = appointments.filter((a) => {
          if (a.status === "CANCELLED") return false;
          if (activeDoctorId && activeDoctorId !== "ALL" && a.doctorId !== activeDoctorId) {
            return false;
          }
          if (a.appointmentDate) return a.appointmentDate === dateStr;
          return daySessions.some((s) => s.id === a.availabilityId);
        });
        bookedCount = dayApts.length;
      } else {
        bookedCount = daySessions.reduce((acc, s) => acc + s.bookedCount, 0);
      }

      let status: "no-schedule" | "full" | "has-appointments" | "none" = "no-schedule";
      if (!hasSchedule) {
        status = "no-schedule";
      } else if (totalCapacity > 0 && bookedCount >= totalCapacity) {
        status = "full"; // RED
      } else if (bookedCount > 0) {
        status = "has-appointments"; // GREEN
      } else {
        status = "none"; // GRAY
      }

      stats[dateStr] = {
        hasSchedule,
        totalCapacity,
        bookedCount,
        status,
      };
    }

    return stats;
  }, [currentYear, currentMonth, daysInMonth, sessions, appointments, activeDoctorId]);

  // Aggregate monthly counts for badge counters
  const monthlySummary = useMemo(() => {
    let greenDays = 0;
    let redDays = 0;
    let grayDays = 0;

    Object.values(dayStatsMap).forEach((st) => {
      if (st.status === "has-appointments") greenDays++;
      else if (st.status === "full") redDays++;
      else if (st.status === "none") grayDays++;
    });

    return { greenDays, redDays, grayDays };
  }, [dayStatsMap]);

  return (
    <div className={`bg-card/90 border border-border rounded-xl p-3 shadow-xs select-none ${className}`}>
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground tracking-tight">
            {monthName}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleJumpToToday}
            title="Jump to Today"
            className="px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:bg-muted rounded transition-all flex items-center gap-0.5"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Previous month"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            title="Next month"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (Sun - Sat) */}
      <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName, idx) => (
          <span
            key={dayName}
            className={`text-[10px] font-semibold ${
              idx === 0 || idx === 6 ? "text-muted-foreground/60" : "text-muted-foreground"
            }`}
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Calendar Grid of Day Cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading blank padding days */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="h-8" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const dayInfo = dayStatsMap[dateStr] || {
            hasSchedule: false,
            totalCapacity: 0,
            bookedCount: 0,
            status: "no-schedule",
          };

          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          // Compute cell style based on user requirements:
          // - Green if has appointments
          // - Gray if none (0 appointments)
          // - Red if totally full
          // - Muted / transparent if no schedule
          let cellStyle = "text-muted-foreground/35 hover:bg-muted/20 border-transparent";
          let badgeDot = null;

          if (dayInfo.status === "full") {
            // RED: Totally full
            cellStyle =
              "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/25 font-bold shadow-xs";
            badgeDot = <span className="w-1 h-1 rounded-full bg-rose-500" />;
          } else if (dayInfo.status === "has-appointments") {
            // GREEN: Has appointments
            cellStyle =
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25 font-bold shadow-xs";
            badgeDot = <span className="w-1 h-1 rounded-full bg-emerald-500" />;
          } else if (dayInfo.status === "none") {
            // GRAY: Has schedule but none (0 appointments)
            cellStyle =
              "bg-muted/50 text-muted-foreground border-border hover:bg-muted font-normal";
            badgeDot = <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />;
          } else {
            // No schedule
            cellStyle =
              "text-muted-foreground/30 hover:bg-muted/20 border-transparent hover:text-muted-foreground";
          }

          const tooltip = !dayInfo.hasSchedule
            ? `${dateStr}: No schedule`
            : dayInfo.status === "full"
            ? `${dateStr}: Full (${dayInfo.bookedCount}/${dayInfo.totalCapacity} booked)`
            : dayInfo.status === "has-appointments"
            ? `${dateStr}: ${dayInfo.bookedCount}/${dayInfo.totalCapacity} booked`
            : `${dateStr}: 0 bookings (${dayInfo.totalCapacity} open slots)`;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              title={tooltip}
              className={`h-8 rounded-lg border text-xs flex flex-col items-center justify-center relative transition-all cursor-pointer ${cellStyle} ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background font-extrabold z-10 scale-[1.05]"
                  : ""
              }`}
            >
              <span className="leading-none text-[11px]">{dayNum}</span>
              {badgeDot && (
                <span className="absolute bottom-1 flex items-center justify-center">
                  {badgeDot}
                </span>
              )}
              {isToday && (
                <span className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly Counters */}
      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium">Month Overview:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold" title="Days with appointments">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {monthlySummary.greenDays} active
          </span>
          <span className="flex items-center gap-1 text-rose-500 font-semibold" title="Days fully booked">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {monthlySummary.redDays} full
          </span>
          <span className="flex items-center gap-1 text-muted-foreground" title="Days with 0 bookings">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            {monthlySummary.grayDays} open
          </span>
        </div>
      </div>

      {/* Color Legend */}
      <div className="mt-1.5 pt-1.5 border-t border-border/50 grid grid-cols-3 gap-1 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
          <span>Full</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-muted/60 border border-border inline-block" />
          <span>None</span>
        </div>
      </div>
    </div>
  );
}
