"use client";

import React, { useState } from "react";
import { Doctor, AvailabilitySession } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";

interface DoctorsDirectoryViewProps {
  doctors: Doctor[];
  sessions: AvailabilitySession[];
  onBookDoctor: (doctor: Doctor) => void;
}

export function DoctorsDirectoryView({
  doctors,
  sessions,
  onBookDoctor,
}: DoctorsDirectoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  const departments = [
    "ALL",
    ...Array.from(new Set(doctors.map((d) => d.department))),
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      selectedDept === "ALL" || doc.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Physician Directory & OPD Availability
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Book appointments with board-certified clinical specialists at MetroCare
          </p>
        </div>

        {/* Search & Department Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search physician or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none w-56"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "All Departments" : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDoctors.map((doc) => {
          const docSession = sessions.find((s) => s.doctorId === doc.id);

          return (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {doc.fullName}
                      </h3>
                      <p className="text-xs text-primary font-medium">
                        {doc.department}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.qualifications}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground block">
                      {formatCurrency(Number(doc.consultationFee))}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      consultation
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5 text-xs">
                  <div className="text-muted-foreground">
                    <strong className="text-foreground">Clinical Focus:</strong>{" "}
                    {doc.specialization}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>{doc.roomNumber}</span>
                    <span>•</span>
                    <span>Reg: {doc.licenseNumber}</span>
                  </div>
                </div>

                {/* Today's Availability Info */}
                {docSession ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Today: {docSession.startTime} - {docSession.endTime}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {docSession.maxCapacity - docSession.bookedCount} slots available
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground">
                    No active sessions scheduled
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Verified NovaSlot Provider
                </span>

                <button
                  onClick={() => onBookDoctor(doc)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
                >
                  Book Slot
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
