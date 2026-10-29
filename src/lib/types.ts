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
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  availabilityId: string;
  appointmentDate: string;
  estimatedTime?: string;
  status: AppointmentStatus;
  priority: Priority;
  feeStatus: FeeStatus;
  consultationFee?: number;
  isWalkIn: boolean;
  notes?: string;
  clinicalSummary?: string;
  paymentId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: Role;
  refundStatus?: "NONE" | "PENDING" | "PROCESSED" | "FAILED" | "NOT_APPLICABLE";
  rescheduledFromSessionId?: string;
  rescheduledAt?: string;
  pendingExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentGatewayType = "RAZORPAY" | "STRIPE" | "CASH";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "ABANDONED";

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  amount: number; // in INR rupees
  currency: string;
  gateway: PaymentGatewayType;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  receiptNumber: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RefundStatus = "PENDING" | "PROCESSED" | "FAILED";

export interface RefundRecord {
  id: string;
  paymentId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  originalAmount: number;
  refundAmount: number;
  deductionAmount: number;
  refundPercentage: number;
  reason: string;
  status: RefundStatus;
  gatewayRefundId?: string;
  failureReason?: string;
  initiatedBy: Role;
  initiatedAt: string;
  processedAt?: string;
}

export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "PAYMENT_SUCCESS"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_CANCELLED"
  | "REFUND_PROCESSED"
  | "REMINDER_24H"
  | "REMINDER_2H";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export interface NotificationRecord {
  id: string;
  appointmentId: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  content: string; // Plaintext or HTML preview
  htmlContent?: string;
  status: NotificationStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  error?: string;
}

export interface RefundPolicyEstimate {
  originalFee: number;
  refundAmount: number;
  deductionAmount: number;
  refundPercentage: number;
  policyNote: string;
  isEligible: boolean;
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
