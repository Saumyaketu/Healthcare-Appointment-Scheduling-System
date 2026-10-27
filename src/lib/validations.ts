import { z } from "zod";

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
