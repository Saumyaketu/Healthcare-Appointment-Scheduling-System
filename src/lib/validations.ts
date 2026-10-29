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
  patientEmail: z.string().email().optional().or(z.literal("")),
  patientAge: z.coerce.number().min(0).max(120, "Age must be valid"),
  patientGender: z.enum(["F", "M", "Other"]),
  doctorId: z.string().min(1, "Please select a doctor"),
  availabilityId: z.string().min(1, "Please select an available session"),
  appointmentDate: z.string().optional(),
  priority: z.enum(["NORMAL", "EMERGENCY"]).default("NORMAL"),
  feeStatus: z.enum(["PAID", "DUE"]).default("PAID"),
  notes: z.string().optional(),
});

export const createPaymentOrderSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  availabilityId: z.string().min(1, "Availability session ID is required"),
  appointmentDate: z.string().optional(),
  patientName: z.string().min(2, "Patient name is required"),
  patientPhone: z.string().min(10, "Patient phone is required"),
  patientEmail: z.string().email().optional().or(z.literal("")),
  patientAge: z.coerce.number().min(0).max(120),
  patientGender: z.enum(["F", "M", "Other"]),
  priority: z.enum(["NORMAL", "EMERGENCY"]).optional(),
  notes: z.string().optional(),
  existingAppointmentId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

export const rescheduleAppointmentSchema = z.object({
  targetAvailabilityId: z.string().min(1, "Target session ID is required"),
  reason: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(3, "Cancellation reason is required (at least 3 characters)"),
  cancelledByRole: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
});

export const manualRefundSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  amount: z.coerce.number().positive("Refund amount must be positive"),
  reason: z.string().min(3, "Reason is required"),
  adminRole: z.enum(["ADMIN", "DOCTOR"]).default("ADMIN"),
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
