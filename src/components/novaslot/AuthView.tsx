"use client";

import React, { useState } from "react";
import { AuthSession, Role } from "@/lib/types";
import {
  User,
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  Zap,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AuthViewProps {
  initialMode?: "login" | "register";
  onBackToHome: () => void;
  onAuthSuccess: (session: AuthSession) => void;
}

export function AuthView({
  initialMode = "login",
  onBackToHome,
  onAuthSuccess,
}: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [selectedRole, setSelectedRole] = useState<Role>("PATIENT");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Doctor-specific fields
  const [department, setDepartment] = useState("Cardiology");
  const [specialization, setSpecialization] = useState("");
  const [consultationFee, setConsultationFee] = useState<number | "">(800);
  const [roomNumber, setRoomNumber] = useState("Suite 101");

  // Patient-specific fields
  const [age, setAge] = useState<number | "">(32);
  const [gender, setGender] = useState<"F" | "M" | "Other">("M");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Login failed");
        }
        onAuthSuccess(data.data);
      } else {
        const payload: any = {
          fullName,
          email,
          password,
          phone,
          role: selectedRole,
        };

        if (selectedRole === "DOCTOR") {
          payload.department = department;
          payload.specialization = specialization || `${department} Specialist`;
          payload.consultationFee = Number(consultationFee) || 750;
          payload.roomNumber = roomNumber || "Suite 102";
        } else {
          payload.age = Number(age) || 30;
          payload.gender = gender;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Registration failed");
        }
        onAuthSuccess(data.data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Demo login failed");
      }
      onAuthSuccess(data.data);
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Top Header */}
      <header className="w-full border-b border-border bg-card/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shadow-sm">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            Nova<span className="text-primary">Slot</span>
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* Main Auth Container */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border text-center space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              {mode === "login" ? "Sign In to Your Portal" : "Register with NovaSlot"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "login"
                ? "Enter your credentials or choose a quick evaluation role"
                : "Create an account as a Patient or Healthcare Provider"}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex border-b border-border bg-muted/30 p-1 m-4 mb-0 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "register"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Register As:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("PATIENT")}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                          selectedRole === "PATIENT"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Patient
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("DOCTOR")}
                        className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                          selectedRole === "DOCTOR"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                        Physician
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === "DOCTOR" ? "Dr. Full Name" : "Your Full Name"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {selectedRole === "DOCTOR" ? (
                    <div className="space-y-2 pt-1 border-t border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Department
                          </label>
                          <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                          >
                            <option value="Cardiology">Cardiology</option>
                            <option value="Pediatrics">Pediatrics</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="General Medicine">General Medicine</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            Consult Fee (₹)
                          </label>
                          <input
                            type="number"
                            value={consultationFee}
                            onChange={(e) => setConsultationFee(Number(e.target.value))}
                            placeholder="800"
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Specialization Details
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Adult Cardiology & Interventions"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Age
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="Age"
                          value={age}
                          onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email & Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : mode === "login" ? (
                    <>
                      <span>Sign In & Open Role Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Credentials */}
            {mode === "login" && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                  <span>1-Click Evaluation Sign In:</span>
                  <span className="text-[10px] text-primary">Instant Access</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("doctor@metrocare.com", "doctor123")}
                    className="px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-primary" />
                      Doctor: Dr. Rajesh Sharma (Cardiology)
                    </span>
                    <span className="text-primary font-semibold text-[10px]">Log in →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin("patient@metrocare.com", "patient123")}
                    className="px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      Patient: Harish Pillai (Bookings)
                    </span>
                    <span className="text-emerald-600 font-semibold text-[10px]">Log in →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin("admin@metrocare.com", "admin123")}
                    className="px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Admin: OPD Reception Desk
                    </span>
                    <span className="text-amber-600 font-semibold text-[10px]">Log in →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        NovaSlot Clinical Portal • Protected by Role-Based Access Control
      </footer>
    </div>
  );
}
