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
  CreditCard,
  Building,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PaymentCheckoutModal } from "./PaymentCheckoutModal";

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
  // Date selection state
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors[0]?.id || ""
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">("");
  const [patientGender, setPatientGender] = useState<"F" | "M" | "Other">("F");
  const [priority, setPriority] = useState<"NORMAL" | "EMERGENCY">("NORMAL");
  const [notes, setNotes] = useState("");
  const [paymentChoice, setPaymentChoice] = useState<"ONLINE_RAZORPAY" | "FRONT_DESK_CASH">(
    "ONLINE_RAZORPAY"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Razorpay Checkout State
  const [checkoutOrder, setCheckoutOrder] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const isPatientLoggedIn = currentUser?.user.role === "PATIENT";

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser && currentUser.user.role === "PATIENT") {
      setPatientName(currentUser.user.fullName);
      setPatientPhone(currentUser.user.phone);
      setPatientEmail(currentUser.user.email);
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

  const doctorSessionsForDate = doctorSessions.filter(
    (s) => s.sessionDate === selectedDate
  );

  useEffect(() => {
    if (doctorSessionsForDate.length > 0) {
      setSelectedSessionId(doctorSessionsForDate[0].id);
    } else if (doctorSessions.length > 0) {
      setSelectedSessionId(doctorSessions[0].id);
    }
  }, [selectedDoctorId, selectedDate, sessions]);

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
    const sessionId = selectedSessionId || doctorSessionsForDate[0]?.id || doctorSessions[0]?.id || `sess-${selectedDoctorId}-${selectedDate}`;

    try {
      setIsSubmitting(true);

      if (paymentChoice === "ONLINE_RAZORPAY") {
        // Step 1: Securely create Razorpay payment order
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: selectedDoctorId || doctors[0].id,
            availabilityId: sessionId,
            appointmentDate: selectedDate,
            patientName: patientName.trim(),
            patientPhone: patientPhone.trim(),
            patientEmail: patientEmail.trim() || undefined,
            patientAge: Number(patientAge) || 30,
            patientGender,
            priority,
            notes: notes.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create online payment order");
        }

        // Open Razorpay Checkout Dialog
        setCheckoutOrder({
          ...data.data,
          doctorName: selectedDoctor?.fullName,
          patientName: patientName.trim(),
        });
        setIsCheckoutOpen(true);
      } else {
        // Step 2: Book with Fee Due at Counter
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: patientName.trim(),
            patientPhone: patientPhone.trim(),
            patientEmail: patientEmail.trim() || undefined,
            patientAge: Number(patientAge) || 30,
            patientGender,
            doctorId: selectedDoctorId || doctors[0].id,
            availabilityId: sessionId,
            appointmentDate: selectedDate,
            priority,
            feeStatus: "DUE",
            notes: notes.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to confirm booking");
        }

        setConfirmedBooking(data.data);
        onBookingSuccess(data.data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlinePaymentVerified = (verifiedData: any) => {
    setIsCheckoutOpen(false);
    setConfirmedBooking(verifiedData.appointment);
    onBookingSuccess(verifiedData.appointment);
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    setCheckoutOrder(null);
    setIsCheckoutOpen(false);
    if (!isPatientLoggedIn) {
      setPatientName("");
      setPatientPhone("");
      setPatientEmail("");
      setPatientAge("");
    }
    setNotes("");
    setError(null);
    onClose();
  };

  return (
    <>
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
                    <span className="text-muted-foreground">Session Date:</span>
                    <span className="font-semibold text-foreground">
                      {confirmedBooking.appointmentDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Slot:</span>
                    <span className="font-semibold text-foreground">
                      {confirmedBooking.estimatedTime || "Today"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Status:</span>
                    <span
                      className={`font-semibold ${
                        confirmedBooking.feeStatus === "PAID"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {confirmedBooking.feeStatus === "PAID"
                        ? "Paid Online (Razorpay Verified)"
                        : "Pay at Front Desk (Due)"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-900/50 text-left text-xs">
                  <strong>Email Confirmation Dispatched:</strong> A digital pass with token
                  barcode and appointment details has been delivered to your email. Automated
                  reminders will be sent 24h &amp; 2h prior to consultation.
                </div>

                <button
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                {/* Doctor Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    Select Consulting Physician *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setSelectedSessionId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} — {doc.department} ({formatCurrency(doc.consultationFee)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consultation Date Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Consultation Date *
                    </span>
                    <span className="text-[11px] font-bold text-primary">
                      {selectedDate === todayStr ? "Today" : selectedDate === tomorrowStr ? "Tomorrow" : selectedDate}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDate === todayStr
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDate === tomorrowStr
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(dayAfterStr)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDate === dayAfterStr
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Day After
                    </button>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Available Sessions for Selected Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Available Time Slot ({selectedDate}) *
                  </label>
                  {doctorSessionsForDate.length === 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setSelectedSessionId(`sess-${selectedDoctorId}-${selectedDate}-morning`)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedSessionId.includes("morning") || !selectedSessionId.includes("afternoon")
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">Morning Session</div>
                        <div className="text-[11px] text-muted-foreground">09:00 AM - 01:00 PM</div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-1 block">
                          Slots Available
                        </span>
                      </div>

                      <div
                        onClick={() => setSelectedSessionId(`sess-${selectedDoctorId}-${selectedDate}-afternoon`)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedSessionId.includes("afternoon")
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">Afternoon Session</div>
                        <div className="text-[11px] text-muted-foreground">02:00 PM - 06:00 PM</div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-1 block">
                          Slots Available
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {doctorSessionsForDate.map((sess) => {
                        const isFull = sess.bookedCount >= sess.maxCapacity;
                        const isSelected = (selectedSessionId || doctorSessionsForDate[0].id) === sess.id;
                        return (
                          <div
                            key={sess.id}
                            onClick={() => {
                              if (!isFull) setSelectedSessionId(sess.id);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isFull
                                ? "opacity-50 bg-muted/30 border-border cursor-not-allowed"
                                : isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:bg-muted/30"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <span>{sess.startTime} - {sess.endTime}</span>
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  ({sess.sessionType})
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Room 102 • Standard Token OPD
                              </div>
                            </div>

                            <div className="text-right">
                              {isFull ? (
                                <span className="text-destructive font-bold text-[11px]">FULL</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                  {sess.maxCapacity - sess.bookedCount} slots open
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Patient Information */}
                <div className="space-y-3 pt-1 border-t border-border">
                  <div className="font-semibold text-foreground text-xs flex items-center justify-between">
                    <span>Patient Details</span>
                    {isPatientLoggedIn && (
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-normal">
                        Pre-filled from Account
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Verma"
                        value={patientName}
                        disabled={isPatientLoggedIn}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden disabled:opacity-75"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={patientPhone}
                        disabled={isPatientLoggedIn}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden disabled:opacity-75"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3 text-primary" /> Email for Confirmation &amp; Reminders
                      </label>
                      <input
                        type="email"
                        placeholder="patient@example.com"
                        value={patientEmail}
                        disabled={isPatientLoggedIn}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden disabled:opacity-75"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="30"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : "")}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                      >
                        <option value="F">Female</option>
                        <option value="M">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground font-medium">Urgency</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                      >
                        <option value="NORMAL">Standard OPD</option>
                        <option value="EMERGENCY">Emergency / Priority</option>
                      </select>
                    </div>
                  </div>

                  {/* Clinical Reason */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Symptoms / Reason for Consultation
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief description of symptoms or consultation purpose..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-hidden resize-none"
                    />
                  </div>
                </div>

                {/* PAYMENT MODE SELECTION */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                    Consultation Payment Method
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setPaymentChoice("ONLINE_RAZORPAY")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentChoice === "ONLINE_RAZORPAY"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground text-xs">Pay Online</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Razorpay UPI, Card, NetBanking. Fast digital check-in.
                      </p>
                    </div>

                    <div
                      onClick={() => setPaymentChoice("FRONT_DESK_CASH")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentChoice === "FRONT_DESK_CASH"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-foreground text-xs">Pay at Counter</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Settle cash fee upon arriving at the clinic reception.
                      </p>
                    </div>
                  </div>

                  {selectedDoctor && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                      <span className="text-muted-foreground">Consultation Fee:</span>
                      <span className="font-black text-foreground">
                        {formatCurrency(selectedDoctor.consultationFee)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Initializing Booking...</span>
                    ) : paymentChoice === "ONLINE_RAZORPAY" ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Proceed to Pay {selectedDoctor ? formatCurrency(selectedDoctor.consultationFee) : ""} via Razorpay</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Confirm Slot (Pay at Desk)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Online Checkout Modal */}
      {isCheckoutOpen && checkoutOrder && (
        <PaymentCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderData={checkoutOrder}
          onPaymentSuccess={handleOnlinePaymentVerified}
        />
      )}
    </>
  );
}
