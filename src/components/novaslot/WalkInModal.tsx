"use client";

import React, { useState } from "react";
import { AvailabilitySession, Appointment } from "@/lib/types";
import { UserPlus, AlertTriangle, X } from "lucide-react";

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: AvailabilitySession | null;
  onSuccess: (appointment: Appointment) => void;
}

export function WalkInModal({
  isOpen,
  onClose,
  activeSession,
  onSuccess,
}: WalkInModalProps) {
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");
  const [patientGender, setPatientGender] = useState<"F" | "M" | "Other">("F");
  const [priority, setPriority] = useState<"NORMAL" | "EMERGENCY">("NORMAL");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeSession) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientName.trim()) {
      setError("Patient name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim() || "+91 00000 00000",
          patientAge: Number(patientAge) || 30,
          patientGender,
          doctorId: activeSession.doctorId,
          availabilityId: activeSession.id,
          priority,
          feeStatus: "DUE",
          notes: notes.trim() ? `Walk-in: ${notes.trim()}` : "Walk-in patient admitted at front desk",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create walk-in admission");
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Immediate Walk-in Admission
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Assigning to {activeSession.doctorName} ({activeSession.department})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient full name"
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="120"
                placeholder="Age"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Contact Number
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Mobile contact"
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Triage Priority
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs ${
                  priority === "NORMAL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Routine Walk-in
              </button>
              <button
                type="button"
                onClick={() => setPriority("EMERGENCY")}
                className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1 ${
                  priority === "EMERGENCY"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-border hover:bg-muted text-red-600"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Urgent Care
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">
              Triage Note / Symptoms
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Acute discomfort, vitals check"
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Issuing Token..." : "Admit to Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
