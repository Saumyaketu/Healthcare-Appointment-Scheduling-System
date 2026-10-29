import { Appointment, NotificationRecord } from "./types";
import { notificationService, notificationTemplates } from "./notification-service";

/**
 * Parses appointment date and estimated time into a valid Date object.
 */
export function getAppointmentDateTime(dateStr: string, timeStr?: string): Date {
  try {
    const rawTime = timeStr || "09:00 AM";
    const match = rawTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3]?.toUpperCase();

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const d = new Date(`${dateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
      if (!isNaN(d.getTime())) return d;
    }

    return new Date(`${dateStr}T09:00:00`);
  } catch {
    return new Date();
  }
}

/**
 * Calculates ISO strings for 24h and 2h reminders.
 */
export function calculateReminderDates(appointment: Appointment): {
  reminder24h: Date;
  reminder2h: Date;
} {
  const aptTime = getAppointmentDateTime(appointment.appointmentDate, appointment.estimatedTime);
  const reminder24h = new Date(aptTime.getTime() - 24 * 60 * 60 * 1000);
  const reminder2h = new Date(aptTime.getTime() - 2 * 60 * 60 * 1000);

  return { reminder24h, reminder2h };
}
