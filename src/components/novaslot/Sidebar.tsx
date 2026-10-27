"use client";

import React from "react";
import {
  CalendarDays,
  Users,
  Clock,
  CreditCard,
  CalendarCheck,
  Stethoscope,
  PlusCircle,
} from "lucide-react";
import { Role } from "@/lib/types";

export type ActiveTab =
  | "reception"
  | "book"
  | "my-appointments"
  | "doctors"
  | "schedule"
  | "billing";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentRole: Role;
  onOpenBooking: () => void;
  onOpenWalkIn: () => void;
  waitingCount: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  currentRole,
  onOpenBooking,
  onOpenWalkIn,
  waitingCount,
}: SidebarProps) {
  const isDoctorOrAdmin = currentRole === "ADMIN" || currentRole === "DOCTOR";

  return (
    <aside className="w-56 border-r border-border bg-card/60 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none">
      {/* Quick Action Button */}
      <div className="p-3 border-b border-border space-y-2">
        <button
          onClick={onOpenBooking}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Book Slot
        </button>

        {isDoctorOrAdmin && (
          <button
            onClick={onOpenWalkIn}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            + Walk-in Patient
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="p-2 space-y-1 text-xs">
        {isDoctorOrAdmin && (
          <button
            onClick={() => onTabChange("reception")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
              activeTab === "reception"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4" />
              <span>OPD Desk</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-bold">
              {waitingCount}
            </span>
          </button>
        )}

        <button
          onClick={() => onTabChange("my-appointments")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "my-appointments"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-4 h-4" />
            <span>My Bookings</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange("doctors")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "doctors"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-4 h-4" />
            <span>Physician Directory</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange("schedule")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "schedule"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4" />
            <span>Timetable</span>
          </div>
        </button>

        <button
          onClick={() => onTabChange("billing")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
            activeTab === "billing"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4" />
            <span>Billing & Payments</span>
          </div>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="mt-auto p-3 border-t border-border text-[11px] text-muted-foreground">
        <div className="font-semibold text-foreground">MetroCare Central</div>
        <div>OPD Queue: Live</div>
        <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          NovaSlot Sync Online
        </div>
      </div>
    </aside>
  );
}
