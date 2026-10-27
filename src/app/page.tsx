"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LandingPage } from "@/components/novaslot/LandingPage";
import { AuthView } from "@/components/novaslot/AuthView";
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
  AuthSession,
} from "@/lib/types";

type ScreenMode = "landing" | "auth" | "app";

export default function NovaSlotApp() {
  // Screen and Authentication State
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [screenMode, setScreenMode] = useState<ScreenMode>("landing");
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");

  // Role and Tab Navigation
  const [currentRole, setCurrentRole] = useState<Role>("PATIENT");
  const [activeDoctorId, setActiveDoctorId] = useState<string>("doc-1");
  const [activeTab, setActiveTab] = useState<ActiveTab>("reception");

  // Application Data State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sessions, setSessions] = useState<AvailabilitySession[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSession, setSelectedSession] = useState<AvailabilitySession | null>(null);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  // Restore authenticated session from localStorage on load
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("novaslot_session");
      if (savedAuth) {
        const parsed: AuthSession = JSON.parse(savedAuth);
        setCurrentUser(parsed);
        setCurrentRole(parsed.user.role);
        setScreenMode("app");

        // Role-based landing redirection
        if (parsed.user.role === "DOCTOR") {
          setActiveTab("reception");
          if (parsed.doctorProfile) {
            setActiveDoctorId(parsed.doctorProfile.id);
          }
        } else if (parsed.user.role === "PATIENT") {
          setActiveTab("my-appointments");
        } else {
          setActiveTab("reception");
        }
      } else {
        // First-time visitor lands strictly on the Landing Page!
        setScreenMode("landing");
      }
    } catch (err) {
      console.error("Failed to restore session", err);
      setScreenMode("landing");
    }
  }, []);

  // Fetch application data
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
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auth Success: Redirect to assigned role page!
  const handleAuthSuccess = (session: AuthSession) => {
    setCurrentUser(session);
    setCurrentRole(session.user.role);
    setScreenMode("app");

    try {
      localStorage.setItem("novaslot_session", JSON.stringify(session));
    } catch (err) {
      console.error("Storage error", err);
    }

    // Role-based redirection with least privilege
    if (session.user.role === "DOCTOR") {
      setActiveTab("reception");
      if (session.doctorProfile) {
        setActiveDoctorId(session.doctorProfile.id);
        const docSess = sessions.find((s) => s.doctorId === session.doctorProfile?.id);
        if (docSess) setSelectedSession(docSess);
      }
    } else if (session.user.role === "PATIENT") {
      setActiveTab("my-appointments");
    } else {
      setActiveTab("reception");
    }

    fetchData();
  };

  // Logout: Clear session and redirect back to Landing Page!
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole("PATIENT");
    setScreenMode("landing");
    try {
      localStorage.removeItem("novaslot_session");
    } catch (err) {
      console.error("Storage error", err);
    }
  };

  // Quick 1-click Demo Login from Landing Page
  const handleDemoLoginFromLanding = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        handleAuthSuccess(data.data);
      } else {
        // Fallback to auth view
        setAuthInitialMode("login");
        setScreenMode("auth");
      }
    } catch {
      setAuthInitialMode("login");
      setScreenMode("auth");
    }
  };

  // Enforce Least Privilege Navigation
  const handleTabChange = (targetTab: ActiveTab) => {
    if (currentUser?.user.role === "PATIENT") {
      if (targetTab === "reception" || targetTab === "billing") {
        setActiveTab("my-appointments");
        return;
      }
    } else if (currentUser?.user.role === "DOCTOR") {
      if (targetTab === "billing" || targetTab === "my-appointments") {
        setActiveTab("reception");
        return;
      }
    }
    setActiveTab(targetTab);
  };

  // Role change (for admin or inspection)
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

  // Update appointment status
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

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    fetchData();
  };

  // Doctor or room waiting count
  const waitingCount = React.useMemo(() => {
    if (currentUser?.user.role === "DOCTOR" && currentUser.doctorProfile) {
      return appointments.filter(
        (a) =>
          a.doctorId === currentUser.doctorProfile?.id &&
          (a.status === "CONFIRMED" || a.status === "IN_CONSULT")
      ).length;
    }
    return appointments.filter(
      (a) => a.status === "CONFIRMED" || a.status === "IN_CONSULT"
    ).length;
  }, [appointments, currentUser]);

  // 1. BASE LANDING PAGE (First-time visitor)
  if (screenMode === "landing" && !currentUser) {
    return (
      <LandingPage
        onOpenLogin={() => {
          setAuthInitialMode("login");
          setScreenMode("auth");
        }}
        onOpenRegister={() => {
          setAuthInitialMode("register");
          setScreenMode("auth");
        }}
        onDemoLogin={handleDemoLoginFromLanding}
      />
    );
  }

  // 2. DEDICATED SIGN IN / SIGN UP PAGE
  if (screenMode === "auth" && !currentUser) {
    return (
      <AuthView
        initialMode={authInitialMode}
        onBackToHome={() => setScreenMode("landing")}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // 3. AUTHENTICATED ROLE-RESTRICTED PORTAL
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* NovaSlot Header */}
      <Header
        currentRole={currentRole}
        activeDoctorId={activeDoctorId}
        currentUser={currentUser}
        onSearchClick={() => setIsBookingOpen(true)}
        onOpenAuth={() => {
          setAuthInitialMode("login");
          setScreenMode("auth");
        }}
        onLogout={handleLogout}
      />

      {/* Broadcast Banner */}
      <AlertBanner />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar with Strict Least Privilege */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentRole={currentRole}
          currentUser={currentUser}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenWalkIn={() => setIsWalkInOpen(true)}
          onOpenAuth={() => {
            setAuthInitialMode("login");
            setScreenMode("auth");
          }}
          waitingCount={waitingCount}
        />

        {/* Dynamic Center Stage Protected by Role Access */}
        <main className="flex-1 flex overflow-hidden">
          {/* DOCTOR & ADMIN ONLY: Live OPD Queue */}
          {activeTab === "reception" && (currentRole === "DOCTOR" || currentRole === "ADMIN") && (
            <div className="flex-1 flex overflow-hidden">
              {/* Physician Sessions List */}
              <DoctorSessionsList
                sessions={sessions}
                selectedSessionId={selectedSession?.id || ""}
                currentUser={currentUser}
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

          {/* ALL AUTHENTICATED: Physician Directory */}
          {activeTab === "doctors" && (
            <DoctorsDirectoryView
              doctors={doctors}
              sessions={sessions}
              onBookDoctor={() => setIsBookingOpen(true)}
            />
          )}

          {/* PATIENT & ADMIN ONLY: Personal Bookings */}
          {activeTab === "my-appointments" && (currentRole === "PATIENT" || currentRole === "ADMIN") && (
            <PatientAppointmentsView
              appointments={appointments}
              currentUser={currentUser}
              onCancelAppointment={(id) => handleUpdateStatus(id, "CANCELLED")}
              onOpenBooking={() => setIsBookingOpen(true)}
            />
          )}

          {/* ALL AUTHENTICATED: Timetable Schedules */}
          {activeTab === "schedule" && (
            <DoctorScheduleView
              sessions={
                currentRole === "DOCTOR" && currentUser?.doctorProfile
                  ? sessions.filter((s) => s.doctorId === currentUser.doctorProfile?.id)
                  : sessions
              }
              doctors={doctors}
              onSelectSession={(sess) => {
                if (currentRole === "DOCTOR" || currentRole === "ADMIN") {
                  setSelectedSession(sess);
                  setActiveTab("reception");
                }
              }}
            />
          )}

          {/* ADMIN ONLY: Billing & Financial Ledger */}
          {activeTab === "billing" && currentRole === "ADMIN" && (
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
        currentUser={currentUser}
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
