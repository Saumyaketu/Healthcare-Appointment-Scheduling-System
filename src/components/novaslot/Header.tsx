"use client";

import React from "react";
import { Building2, Search, Zap } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { RoleSwitcher } from "./RoleSwitcher";
import { Role } from "@/lib/types";

interface HeaderProps {
  currentRole: Role;
  activeDoctorId?: string;
  onRoleChange: (role: Role, doctorId?: string) => void;
  onSearchClick?: () => void;
}

export function Header({
  currentRole,
  activeDoctorId,
  onRoleChange,
  onSearchClick,
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
      <div className="hidden lg:flex flex-1 max-w-md items-center">
        <div
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground text-xs cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Quick find patient, token #, or physician...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono shadow-xs">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Role Switcher & Controls */}
      <div className="flex items-center gap-3">
        <RoleSwitcher
          currentRole={currentRole}
          activeDoctorId={activeDoctorId}
          onRoleChange={onRoleChange}
        />

        <div className="h-5 w-[1px] bg-border mx-0.5" />

        <ThemeToggle />

        {/* User profile icon */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
          NS
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>
      </div>
    </header>
  );
}
