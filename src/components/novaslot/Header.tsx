"use client";

import React from "react";
import { Building2, Search, Zap, LogIn, LogOut, Bell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Role, AuthSession } from "@/lib/types";

interface HeaderProps {
  currentRole: Role;
  activeDoctorId?: string;
  currentUser?: AuthSession | null;
  onRoleChange?: (role: Role, doctorId?: string) => void;
  onSearchClick?: () => void;
  onOpenNotifications?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Header({
  currentUser,
  onSearchClick,
  onOpenNotifications,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4 transition-colors">
      {/* Brand & Healthcare Facility */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground flex items-center">
            Nova<span className="text-primary">Slot</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground font-medium">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-foreground font-semibold">MetroCare Medical Center</span>
          <span>• Main OPD Tower</span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-sm items-center">
        <div
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground text-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search patient or physician...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono shadow-xs">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Controls & User Session */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notification Activity Center Button */}
        {currentUser && (
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted relative transition-colors"
            title="Notification & Reminders Activity"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </button>
        )}

        {/* User Account / Auth Section */}
        {currentUser ? (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="font-bold text-foreground leading-tight">
                {currentUser.user.fullName}
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    currentUser.user.role === "DOCTOR"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : currentUser.user.role === "ADMIN"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {currentUser.user.role}
                </span>
              </div>
            </div>

            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
              {currentUser.user.fullName.slice(0, 2).toUpperCase()}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-[11px] font-medium">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
