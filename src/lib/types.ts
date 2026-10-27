export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_CONSULT"
  | "COMPLETED"
  | "CANCELLED";

export type Priority = "NORMAL" | "EMERGENCY";

export type FeeStatus = "PAID" | "DUE";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  patientCode: string; // e.g. P-30412
  fullName: string;
  dob?: string;
  age: number;
  gender: string; // "M" | "F" | "Other"
  phone: string;
  address?: string;
  emergencyContact?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
  roomNumber: string;
  avatarUrl?: string;
  isAvailable: boolean;
  qualifications: string;
}

export interface AvailabilitySession {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  sessionDate: string; // YYYY-MM-DD
  sessionType: "Token Session" | "Timed Session";
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "01:00 PM"
  maxCapacity: number;
  walkInCapacity: number;
  walkInUsed: number;
  bookedCount: number;
  waitingCount: number;
  isRunningLate: boolean;
  delayMinutes: number;
}

export interface Appointment {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  availabilityId: string;
  appointmentDate: string;
  estimatedTime?: string;
  status: AppointmentStatus;
  priority: Priority;
  feeStatus: FeeStatus;
  isWalkIn: boolean;
  notes?: string;
  clinicalSummary?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: Role;
  };
  doctorProfile?: Doctor;
  patientProfile?: Patient;
  token: string;
}
