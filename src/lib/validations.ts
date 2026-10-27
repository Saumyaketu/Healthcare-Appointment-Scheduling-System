import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
  // Optional doctor profile fields
  department: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.coerce.number().optional(),
  roomNumber: z.string().optional(),
  qualifications: z.string().optional(),
  // Optional patient profile fields
  age: z.coerce.number().min(0).max(120).optional(),
  gender: z.enum(["F", "M", "Other"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const appointmentBookingSchema = z.object({
  patientName: z.string().min(2, "Full name must be at least 2 characters"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  patientAge: z.coerce.number().min(0).max(120, "Age must be valid"),
  patientGender: z.enum(["F", "M", "Other"]),
  doctorId: z.string().min(1, "Please select a doctor"),
  availabilityId: z.string().min(1, "Please select an available session"),
  priority: z.enum(["NORMAL", "EMERGENCY"]).default("NORMAL"),
  feeStatus: z.enum(["PAID", "DUE"]).default("PAID"),
  notes: z.string().optional(),
});

export const walkInSchema = z.object({
  patientName: z.string().min(2, "Full name is required"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  patientAge: z.coerce.number().min(0).max(120),
  patientGender: z.enum(["F", "M", "Other"]),
  doctorId: z.string().min(1, "Select doctor"),
  availabilityId: z.string().min(1, "Select session"),
  priority: z.enum(["NORMAL", "EMERGENCY"]).default("NORMAL"),
  feeStatus: z.enum(["PAID", "DUE"]).default("DUE"),
  notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "IN_CONSULT", "COMPLETED", "CANCELLED"]),
  clinicalSummary: z.string().optional(),
});

export const sessionDelaySchema = z.object({
  availabilityId: z.string().min(1),
  delayMinutes: z.coerce.number().min(0).max(300),
  isRunningLate: z.boolean(),
});
