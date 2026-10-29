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
import { Role, AuthSession } from "@/lib/types";

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
  currentUser: AuthSession | null;
  onOpenBooking: () => void;
  onOpenWalkIn: () => void;
  onOpenAuth: () => void;
  waitingCount: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  currentRole,
  currentUser,
  onOpenBooking,
  onOpenWalkIn,
  onOpenAuth,
  waitingCount,
}: SidebarProps) {
  const isDoctor = currentRole === "DOCTOR";
  const isAdmin = currentRole === "ADMIN";
  const isPatient = currentRole === "PATIENT";
  const isGuest = !currentUser;

  return (
    <aside className="w-56 border-r border-border bg-card/60 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none">
      {/* Quick Action Button Based on Role */}
      <div className="p-3 border-b border-border space-y-2">
        {/* Patient & Guest Quick Action: Book Slot */}
        {(isPatient || isGuest || isAdmin) && (
          <button
            onClick={() => {
              if (isGuest) {
                onOpenAuth();
              } else {
                onOpenBooking();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {isGuest ? "Sign In to Book" : "Book OPD Slot"}
          </button>
        )}

        {/* Doctor & Admin Quick Action: Walk-in Patient */}
        {(isDoctor || isAdmin) && (
          <button
            onClick={onOpenWalkIn}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            + Walk-in Admit
          </button>
        )}
      </div>

      {/* Main Navigation with Strict Least Privilege */}
      <nav className="p-2 space-y-1 text-xs">
        {/* DOCTOR & ADMIN ONLY: Live Queue / OPD Desk */}
        {(isDoctor || isAdmin) && (
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
              <span>{isDoctor ? "My OPD Queue" : "OPD Desk"}</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-bold">
              {waitingCount}
            </span>
          </button>
        )}

        {/* PATIENT ONLY: My Bookings & Tokens */}
        {(isPatient || isAdmin) && (
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
        )}

        {/* PATIENT, GUEST & ADMIN: Physician Directory */}
        {(isPatient || isGuest || isAdmin) && (
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
              <span>Physicians</span>
            </div>
          </button>
        )}

        {/* ALL: Doctor Timetables */}
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
            <span>{isDoctor ? "My Timetable" : "Timetables"}</span>
          </div>
        </button>

        {/* ADMIN ONLY: Billing & Financial Ledger */}
        {isAdmin && (
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
              <span>Billing & Finance</span>
            </div>
          </button>
        )}
      </nav>

      {/* Footer Hospital Status */}
      <div className="mt-auto p-3 border-t border-border text-[11px] text-muted-foreground">
        <div className="font-semibold text-foreground">MetroCare Medical Center</div>
        <div>OPD Queue: Live Sync</div>
        <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Server Online
        </div>
      </div>
    </aside>
  );
}
