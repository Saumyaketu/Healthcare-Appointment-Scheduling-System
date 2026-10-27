"use client";

import React from "react";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
  Clock,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onDemoLogin: (email: string, pass: string) => void;
}

export function LandingPage({
  onOpenLogin,
  onOpenRegister,
  onDemoLogin,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-sm">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-foreground flex items-center">
              Nova<span className="text-primary">Slot</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-muted-foreground ml-2 font-medium">
              MetroCare Medical Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={onOpenLogin}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={onOpenRegister}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Outpatient Scheduling & Real-Time OPD Queue
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
            Streamlined Healthcare Appointments,{" "}
            <span className="text-primary">Zero Waiting Room Chaos.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            NovaSlot connects patients with hospital outpatient departments in real time. Track live consultation tokens, broadcast physician delays, and manage hospital queues with strict role-based access.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md flex items-center gap-2"
            >
              <span>Sign In to Your Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenRegister}
              className="px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-all"
            >
              Register as Patient or Doctor
            </button>
          </div>
        </div>

        {/* Quick Demo Test Logins Card */}
        <div className="max-w-3xl mx-auto mt-12 bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Quick Evaluation Access (1-Click Role Login)
              </h3>
              <p className="text-xs text-muted-foreground">
                Click any persona below to immediately log in and explore their role-restricted portal
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary self-start sm:self-auto">
              RBAC Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Doctor Demo */}
            <button
              onClick={() => onDemoLogin("doctor@metrocare.com", "doctor123")}
              className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-primary flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  DOCTOR
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Dr. Rajesh Sharma
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Suite 101 • Cardiology OPD Queue
              </p>
              <div className="mt-2 text-[10px] font-semibold text-primary flex items-center gap-1">
                <span>Enter Doctor OPD</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Patient Demo */}
            <button
              onClick={() => onDemoLogin("patient@metrocare.com", "patient123")}
              className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  PATIENT
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground mt-2 group-hover:text-emerald-600 transition-colors">
                Harish Pillai
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Personal Tokens & Prescription History
              </p>
              <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Admin Demo */}
            <button
              onClick={() => onDemoLogin("admin@metrocare.com", "admin123")}
              className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  ADMIN
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground mt-2 group-hover:text-amber-600 transition-colors">
                OPD Reception Desk
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Hospital-wide Sessions & Finance
              </p>
              <div className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Enter Reception Desk</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Role Architecture Breakdown */}
      <section className="py-16 px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Strict Role-Based Access Control
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Following the principle of least privilege, each user only sees information critical to their role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">For Patients</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Search verified medical specialists by department</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Book slots and receive instantaneous digital tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Private access: Only see your personal appointments</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">For Physicians</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Live token queue isolated strictly to your room</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>One-click Call Patient & Consultation Finish controls</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Broadcast delay notices that auto-update patient ETAs</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">For Reception / Admin</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Hospital-wide OPD timetable & room session management</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Rapid emergency walk-in triage and token allocation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Fee reconciliation ledger & collection audit</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-6 px-6 text-center text-xs text-muted-foreground bg-muted/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-foreground">NovaSlot Healthcare</span>
            <span>• MetroCare Medical Center</span>
          </div>

          <div>
            Built with Next.js 14 App Router, PostgreSQL Schema, & Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
}
