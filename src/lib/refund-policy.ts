import { Appointment, RefundPolicyEstimate, Role } from "./types";

export interface RefundPolicyRule {
  minHoursBeforeSession: number;
  maxHoursBeforeSession?: number;
  refundPercentage: number;
  description: string;
}

export const CLINIC_REFUND_POLICY: RefundPolicyRule[] = [
  {
    minHoursBeforeSession: 24,
    refundPercentage: 100,
    description: "Eligible for 100% full refund (Cancelled >24 hours prior to consultation).",
  },
  {
    minHoursBeforeSession: 2,
    maxHoursBeforeSession: 24,
    refundPercentage: 70,
    description:
      "Eligible for 70% refund (30% hospital administrative deduction for cancellation within 24 hours).",
  },
  {
    minHoursBeforeSession: 0,
    maxHoursBeforeSession: 2,
    refundPercentage: 0,
    description:
      "Non-refundable (Cancellations under 2 hours before scheduled slot cannot be refunded per hospital policy).",
  },
];

/**
 * Calculates the exact refund eligibility for an appointment based on cancellation time and who initiates it.
 */
export function calculateRefundEstimate(params: {
  appointment: Appointment;
  cancelledByRole?: Role;
  customOriginalFee?: number;
  now?: Date;
}): RefundPolicyEstimate {
  const { appointment, cancelledByRole = "PATIENT", customOriginalFee, now = new Date() } = params;

  const originalFee = customOriginalFee || appointment.consultationFee || 700;

  // Rule 1: Hospital, Doctor, or Reception Desk initiated cancellations always receive a 100% full refund
  if (cancelledByRole === "DOCTOR" || cancelledByRole === "ADMIN") {
    return {
      originalFee,
      refundAmount: originalFee,
      deductionAmount: 0,
      refundPercentage: 100,
      policyNote: "Full 100% refund approved: Provider / Hospital initiated cancellation.",
      isEligible: true,
    };
  }

  // Parse appointment date and approximate start time
  // appointment.appointmentDate is usually "YYYY-MM-DD"
  let appointmentDateTime: Date;
  try {
    const dateStr = appointment.appointmentDate;
    let timeStr = appointment.estimatedTime || "09:00 AM";

    // Clean up time string if it has prefix or unusual format
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const modifier = timeMatch[3]?.toUpperCase();

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      appointmentDateTime = new Date(`${dateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
    } else {
      appointmentDateTime = new Date(`${dateStr}T09:00:00`);
    }

    if (isNaN(appointmentDateTime.getTime())) {
      appointmentDateTime = new Date(`${dateStr}T09:00:00`);
    }
  } catch {
    appointmentDateTime = new Date();
  }

  const diffMs = appointmentDateTime.getTime() - now.getTime();
  const hoursUntilAppointment = diffMs / (1000 * 60 * 60);

  // If appointment is already in the past, no refund
  if (hoursUntilAppointment <= 0) {
    return {
      originalFee,
      refundAmount: 0,
      deductionAmount: originalFee,
      refundPercentage: 0,
      policyNote: "Non-refundable: The scheduled appointment window has already commenced or passed.",
      isEligible: false,
    };
  }

  // Match against configured policies
  for (const rule of CLINIC_REFUND_POLICY) {
    const isAboveMin = hoursUntilAppointment >= rule.minHoursBeforeSession;
    const isBelowMax =
      rule.maxHoursBeforeSession === undefined || hoursUntilAppointment < rule.maxHoursBeforeSession;

    if (isAboveMin && isBelowMax) {
      const refundAmount = Math.round((originalFee * rule.refundPercentage) / 100);
      const deductionAmount = originalFee - refundAmount;

      return {
        originalFee,
        refundAmount,
        deductionAmount,
        refundPercentage: rule.refundPercentage,
        policyNote: rule.description,
        isEligible: rule.refundPercentage > 0,
      };
    }
  }

  // Default fallback to 0%
  return {
    originalFee,
    refundAmount: 0,
    deductionAmount: originalFee,
    refundPercentage: 0,
    policyNote: "Non-refundable per clinic terms.",
    isEligible: false,
  };
}
