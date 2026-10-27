"use client";

import React, { useState, useEffect } from "react";
import { Doctor, AvailabilitySession, Appointment, AuthSession } from "@/lib/types";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Stethoscope,
  Sparkles,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  sessions: AvailabilitySession[];
  currentUser?: AuthSession | null;
  onBookingSuccess: (appointment: Appointment) => void;
}

export function AppointmentBookingModal({
  isOpen,
  onClose,
  doctors,
  sessions,
  currentUser,
  onBookingSuccess,
}: AppointmentBookingModalProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors[0]?.id || ""
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");
  const [patientGender, setPatientGender] = useState<"F" | "M" | "Other">("F");
  const [priority, setPriority] = useState<"NORMAL" | "EMERGENCY">("NORMAL");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(
    null
  );

  const isPatientLoggedIn = currentUser?.user.role === "PATIENT";

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser && currentUser.user.role === "PATIENT") {
      setPatientName(currentUser.user.fullName);
      setPatientPhone(currentUser.user.phone);
      if (currentUser.patientProfile?.age) {
        setPatientAge(currentUser.patientProfile.age);
      }
      if (currentUser.patientProfile?.gender) {
        setPatientGender(currentUser.patientProfile.gender as any);
      }
    }
  }, [currentUser, isOpen]);

  const doctorSessions = sessions.filter(
    (s) => s.doctorId === (selectedDoctorId || doctors[0]?.id)
  );

  useEffect(() => {
    if (doctorSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(doctorSessions[0].id);
    }
  }, [selectedDoctorId, doctorSessions, selectedSessionId]);

  if (!isOpen) return null;

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientName.trim()) {
      setError("Please provide patient full name");
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      setError("Please provide a valid contact number (10+ digits)");
      return;
    }
    const sessionId = selectedSessionId || doctorSessions[0]?.id;
    if (!sessionId) {
      setError("No active session available for the selected physician");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientAge: Number(patientAge) || 30,
          patientGender,
          doctorId: selectedDoctorId || doctors[0].id,
          availabilityId: sessionId,
          priority,
          feeStatus: "PAID",
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm booking");
      }

      setConfirmedBooking(data.data);
      onBookingSuccess(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    if (!isPatientLoggedIn) {
      setPatientName("");
      setPatientPhone("");
      setPatientAge("");
    }
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">
                {confirmedBooking ? "Slot Confirmed" : "Book OPD Appointment"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                NovaSlot Healthcare Scheduling
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {confirmedBooking ? (
            /* Confirmation Receipt */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">
                  Confirmed & Token Assigned
                </span>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  Token #{confirmedBooking.tokenNumber}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Patient File ID: {confirmedBooking.patientCode}
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-left border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedBooking.patientName} ({confirmedBooking.patientAge}{" "}
                    {confirmedBooking.patientGender})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consulting Physician:</span>
                  <span className="font-semibold text-foreground">
                    {confirmedBooking.doctorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Slot:</span>
                  <span className="font-semibold text-foreground">
                    Today • Est. {confirmedBooking.estimatedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {confirmedBooking.status}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-[11px] text-left">
                ℹ️ <strong>Live Dispatch:</strong> Your slot has been dispatched to the hospital OPD desk. You can monitor the real-time queue from your portal.
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                Close & Return
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Select Doctor */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Choose Medical Specialist</span>
                  {selectedDoctor && (
                    <span className="text-primary font-bold">
                      {formatCurrency(Number(selectedDoctor.consultationFee))} Fee
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {doctors.map((doc) => {
                    const isSelected = (selectedDoctorId || doctors[0].id) === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctorId(doc.id);
                          const docSess = sessions.filter((s) => s.doctorId === doc.id);
                          if (docSess.length > 0) setSelectedSessionId(docSess[0].id);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {doc.fullName}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {doc.department} • {doc.roomNumber}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {formatCurrency(Number(doc.consultationFee))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Session Time Window
                </label>
                {doctorSessions.length === 0 ? (
                  <p className="text-muted-foreground italic text-[11px]">
                    No timetable published for this physician today.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {doctorSessions.map((sess) => {
                      const isSelected = (selectedSessionId || doctorSessions[0].id) === sess.id;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => setSelectedSessionId(sess.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 dark:bg-primary/10"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-bold text-foreground flex items-center justify-between">
                            <span>{sess.sessionType}</span>
                            <span className="text-[10px] text-primary">
                              {sess.bookedCount}/{sess.maxCapacity} slots
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {sess.startTime} - {sess.endTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Patient Information Form */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
                    Patient Details
                  </h4>
                  {isPatientLoggedIn && (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Verified Patient Account
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={patientName}
                      disabled={isPatientLoggedIn}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-75 disabled:bg-muted/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone number"
                      value={patientPhone}
                      disabled={isPatientLoggedIn}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-75 disabled:bg-muted/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 35"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
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

                {/* Priority Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">
                    Consultation Urgency
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
                      Regular Consultation
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
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Urgent / Emergency
                    </button>
                  </div>
                </div>

                {/* Purpose / Clinical notes */}
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-medium">
                    Reason for Visit / Symptoms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state reason for appointment or symptoms..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Issuing Token & Booking...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Generate Token</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
