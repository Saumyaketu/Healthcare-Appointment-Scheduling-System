"use client";

import React, { useState } from "react";
import { AuthSession, Role } from "@/lib/types";
import {
  User,
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: AuthSession) => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
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

  if (!isOpen) return null;

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
        onClose();
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
        onClose();
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
      onClose();
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">
                {mode === "login" ? "Welcome back to NovaSlot" : "Create NovaSlot Account"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Access your clinical appointments and live queue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
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
            Sign Up (Register)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <>
                {/* Role Switcher */}
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
                      Doctor / Specialist
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
                    Mobile Number *
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
                          <option value="Neurology">Neurology</option>
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
                        Specialization Focus
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Preventive Cardiology & Echocardiography"
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
                  <span>Processing...</span>
                ) : mode === "login" ? (
                  <>
                    <span>Sign In to NovaSlot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create My Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Bar (For reviewers / easy testing) */}
          {mode === "login" && (
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>Quick Test Sign In:</span>
                <span className="text-[10px] text-primary">1-Click Auto Fill</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("doctor@metrocare.com", "doctor123")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    Doctor: Dr. Rajesh Sharma
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">doctor123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("patient@metrocare.com", "patient123")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Patient: Harish Pillai
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">patient123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin@metrocare.com", "admin123")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-[11px] font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Staff: OPD Reception Desk
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">admin123</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
