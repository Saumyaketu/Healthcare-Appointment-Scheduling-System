"use client";

import React from "react";
import { User, Stethoscope, ShieldCheck } from "lucide-react";
import { Role } from "@/lib/types";

interface RoleSwitcherProps {
  currentRole: Role;
  activeDoctorId?: string;
  onRoleChange: (role: Role, doctorId?: string) => void;
}

export function RoleSwitcher({
  currentRole,
  activeDoctorId,
  onRoleChange,
}: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/30 border border-border rounded-lg p-1 text-xs">
      <span className="text-muted-foreground px-2 font-medium flex items-center gap-1">
        Role:
      </span>

      <button
        onClick={() => onRoleChange("ADMIN")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          currentRole === "ADMIN"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        OPD Desk
      </button>

      <button
        onClick={() => onRoleChange("DOCTOR", "doc-1")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          currentRole === "DOCTOR" && activeDoctorId === "doc-1"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <Stethoscope className="w-3.5 h-3.5" />
        Dr. Rajesh (Cardiology)
      </button>

      <button
        onClick={() => onRoleChange("DOCTOR", "doc-2")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          currentRole === "DOCTOR" && activeDoctorId === "doc-2"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <Stethoscope className="w-3.5 h-3.5" />
        Dr. Ananya (Pediatrics)
      </button>

      <button
        onClick={() => onRoleChange("PATIENT")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          currentRole === "PATIENT"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Patient Portal
      </button>
    </div>
  );
}
