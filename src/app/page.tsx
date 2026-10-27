"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/novaslot/Header";
import { AlertBanner } from "@/components/novaslot/AlertBanner";
import { Sidebar, ActiveTab } from "@/components/novaslot/Sidebar";
import { DoctorSessionsList } from "@/components/novaslot/DoctorSessionsList";
import { DoctorQueueBoard } from "@/components/novaslot/DoctorQueueBoard";
import { AppointmentBookingModal } from "@/components/novaslot/AppointmentBookingModal";
import { WalkInModal } from "@/components/novaslot/WalkInModal";
import { DoctorsDirectoryView } from "@/components/novaslot/DoctorsDirectoryView";
import { PatientAppointmentsView } from "@/components/novaslot/PatientAppointmentsView";
import { DoctorScheduleView } from "@/components/novaslot/DoctorScheduleView";
import { BillingView } from "@/components/novaslot/BillingView";
import {
  Doctor,
  AvailabilitySession,
  Appointment,
  Role,
  AppointmentStatus,
} from "@/lib/types";

export default function NovaSlotApp() {
  const [currentRole, setCurrentRole] = useState<Role>("ADMIN");
  const [activeDoctorId, setActiveDoctorId] = useState<string>("doc-1");
  const [activeTab, setActiveTab] = useState<ActiveTab>("reception");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sessions, setSessions] = useState<AvailabilitySession[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSession, setSelectedSession] = useState<AvailabilitySession | null>(null);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all data
  const fetchData = useCallback(async () => {
    try {
      const [resDocs, resSess, resApts] = await Promise.all([
        fetch("/api/doctors").then((r) => r.json()),
        fetch("/api/sessions").then((r) => r.json()),
        fetch("/api/appointments").then((r) => r.json()),
      ]);

      if (resDocs.success) setDoctors(resDocs.data);
      if (resSess.success) {
        setSessions(resSess.data);
        if (!selectedSession && resSess.data.length > 0) {
          setSelectedSession(resSess.data[0]);
        }
      }
      if (resApts.success) setAppointments(resApts.data);
    } catch (err) {
      console.error("Failed to fetch application data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle role change
  const handleRoleChange = (role: Role, doctorId?: string) => {
    setCurrentRole(role);
    if (doctorId) {
      setActiveDoctorId(doctorId);
      const docSess = sessions.find((s) => s.doctorId === doctorId);
      if (docSess) setSelectedSession(docSess);
    }

    if (role === "PATIENT") {
      setActiveTab("my-appointments");
    } else {
      setActiveTab("reception");
    }
  };

  // Update appointment status (In Consult, Completed, Approved)
  const handleUpdateStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data.data : a))
        );
        fetchData();
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  // Toggle fee status
  const handleToggleFee = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_fee" }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data.data : a))
        );
      }
    } catch (err) {
      console.error("Fee toggle error", err);
    }
  };

  // Update session delay
  const handleUpdateDelay = async (
    sessionId: string,
    delayMinutes: number,
    isRunningLate: boolean
  ) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityId: sessionId,
          delayMinutes,
          isRunningLate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? data.data : s))
        );
        if (selectedSession?.id === sessionId) {
          setSelectedSession(data.data);
        }
      }
    } catch (err) {
      console.error("Delay update error", err);
    }
  };

  // Booking or walk-in success
  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    fetchData();
  };

  const handleBookFromDoctor = (doctor: Doctor) => {
    setIsBookingOpen(true);
  };

  // Total waiting count for badges
  const totalWaiting = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "IN_CONSULT"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* NovaSlot Global Header */}
      <Header
        currentRole={currentRole}
        activeDoctorId={activeDoctorId}
        onRoleChange={handleRoleChange}
        onSearchClick={() => setIsBookingOpen(true)}
      />

      {/* Live System Broadcast Banner */}
      <AlertBanner />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentRole}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenWalkIn={() => setIsWalkInOpen(true)}
          waitingCount={totalWaiting}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === "reception" && (
            <div className="flex-1 flex overflow-hidden">
              {/* Physician Sessions List */}
              <DoctorSessionsList
                sessions={sessions}
                selectedSessionId={selectedSession?.id || ""}
                onSelectSession={(sess) => setSelectedSession(sess)}
              />

              {/* Live OPD Queue Board */}
              <DoctorQueueBoard
                session={selectedSession}
                appointments={appointments}
                onUpdateStatus={handleUpdateStatus}
                onToggleFee={handleToggleFee}
                onOpenWalkIn={() => setIsWalkInOpen(true)}
                onUpdateDelay={handleUpdateDelay}
                onRefresh={fetchData}
              />
            </div>
          )}

          {activeTab === "doctors" && (
            <DoctorsDirectoryView
              doctors={doctors}
              sessions={sessions}
              onBookDoctor={handleBookFromDoctor}
            />
          )}

          {activeTab === "my-appointments" && (
            <PatientAppointmentsView
              appointments={appointments}
              onCancelAppointment={(id) => handleUpdateStatus(id, "CANCELLED")}
              onOpenBooking={() => setIsBookingOpen(true)}
            />
          )}

          {activeTab === "schedule" && (
            <DoctorScheduleView
              sessions={sessions}
              doctors={doctors}
              onSelectSession={(sess) => {
                setSelectedSession(sess);
                setActiveTab("reception");
              }}
            />
          )}

          {activeTab === "billing" && (
            <BillingView
              appointments={appointments}
              doctors={doctors}
              onToggleFee={handleToggleFee}
            />
          )}
        </main>
      </div>

      {/* Slot Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        doctors={doctors}
        sessions={sessions}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Quick Walk-In Admission Modal */}
      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        activeSession={selectedSession}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
