import { Doctor, AvailabilitySession, Appointment, AppointmentStatus, Priority, FeeStatus } from "./types";
import { INITIAL_DOCTORS, INITIAL_SESSIONS, INITIAL_APPOINTMENTS } from "./sample-data";
import { generatePatientId, generateTokenNumber } from "./utils";
import fs from "fs";
import path from "path";

// Local storage file path for state persistence between restarts
const DATA_FILE = path.join(process.cwd(), ".data-store.json");

interface DataStore {
  doctors: Doctor[];
  sessions: AvailabilitySession[];
  appointments: Appointment[];
}

function loadDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading data store file, fallback to initial data", err);
  }

  const initialData: DataStore = {
    doctors: INITIAL_DOCTORS,
    sessions: INITIAL_SESSIONS,
    appointments: INITIAL_APPOINTMENTS,
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial data store", err);
  }

  return initialData;
}

function saveDataStore(data: DataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save data store", err);
  }
}

export const db = {
  // Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    const store = loadDataStore();
    return store.doctors;
  },

  getDoctorById: async (id: string): Promise<Doctor | null> => {
    const store = loadDataStore();
    return store.doctors.find((d) => d.id === id) || null;
  },

  // Sessions
  getSessions: async (doctorId?: string): Promise<AvailabilitySession[]> => {
    const store = loadDataStore();
    if (doctorId) {
      return store.sessions.filter((s) => s.doctorId === doctorId);
    }
    return store.sessions;
  },

  getSessionById: async (id: string): Promise<AvailabilitySession | null> => {
    const store = loadDataStore();
    return store.sessions.find((s) => s.id === id) || null;
  },

  updateSessionDelay: async (
    sessionId: string,
    delayMinutes: number,
    isRunningLate: boolean
  ): Promise<AvailabilitySession | null> => {
    const store = loadDataStore();
    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    session.delayMinutes = delayMinutes;
    session.isRunningLate = isRunningLate;
    saveDataStore(store);
    return session;
  },

  // Appointments
  getAppointments: async (filters?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
  }): Promise<Appointment[]> => {
    const store = loadDataStore();
    let results = store.appointments;

    if (filters?.doctorId) {
      results = results.filter((a) => a.doctorId === filters.doctorId);
    }
    if (filters?.patientId) {
      results = results.filter((a) => a.patientId === filters.patientId);
    }
    if (filters?.status) {
      results = results.filter((a) => a.status === filters.status);
    }

    // Sort by status priority (IN_CONSULT first, then CONFIRMED/PENDING by tokenNumber, COMPLETED last)
    return results.sort((a, b) => {
      const order = { IN_CONSULT: 0, CONFIRMED: 1, PENDING: 2, COMPLETED: 3, CANCELLED: 4 };
      const orderA = order[a.status] ?? 5;
      const orderB = order[b.status] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return a.tokenNumber - b.tokenNumber;
    });
  },

  getAppointmentById: async (id: string): Promise<Appointment | null> => {
    const store = loadDataStore();
    return store.appointments.find((a) => a.id === id) || null;
  },

  createAppointment: async (data: {
    patientName: string;
    patientPhone: string;
    patientAge: number;
    patientGender: string;
    doctorId: string;
    availabilityId: string;
    priority: Priority;
    feeStatus: FeeStatus;
    notes?: string;
    isWalkIn?: boolean;
  }): Promise<Appointment> => {
    const store = loadDataStore();
    const doctor = store.doctors.find((d) => d.id === data.doctorId);
    const session = store.sessions.find((s) => s.id === data.availabilityId);

    if (!doctor || !session) {
      throw new Error("Invalid doctor or session ID");
    }

    // Calculate token number
    const sessionAppointments = store.appointments.filter(
      (a) => a.availabilityId === data.availabilityId
    );
    const nextToken = generateTokenNumber(sessionAppointments.map((a) => a.tokenNumber));

    // Update session booked count
    session.bookedCount += 1;
    session.waitingCount += 1;
    if (data.isWalkIn) {
      session.walkInUsed += 1;
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: nextToken,
      patientId: `pat-${Date.now()}`,
      patientName: data.patientName,
      patientCode: generatePatientId(),
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      patientPhone: data.patientPhone,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      availabilityId: session.id,
      appointmentDate: session.sessionDate,
      estimatedTime: `${10 + Math.floor(nextToken / 3)}:${(nextToken % 4) * 15 || "00"} AM`,
      status: "CONFIRMED", // Auto-confirm or Pending based on workflow
      priority: data.priority,
      feeStatus: data.feeStatus,
      isWalkIn: data.isWalkIn || false,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    store.appointments.unshift(newAppointment);
    saveDataStore(store);
    return newAppointment;
  },

  updateAppointmentStatus: async (
    id: string,
    status: AppointmentStatus,
    clinicalSummary?: string
  ): Promise<Appointment | null> => {
    const store = loadDataStore();
    const appointment = store.appointments.find((a) => a.id === id);
    if (!appointment) return null;

    const oldStatus = appointment.status;
    appointment.status = status;
    if (clinicalSummary) {
      appointment.clinicalSummary = clinicalSummary;
    }
    appointment.updatedAt = new Date().toISOString();

    // Adjust session waiting counts
    const session = store.sessions.find((s) => s.id === appointment.availabilityId);
    if (session) {
      if (
        (oldStatus === "CONFIRMED" || oldStatus === "PENDING" || oldStatus === "IN_CONSULT") &&
        (status === "COMPLETED" || status === "CANCELLED")
      ) {
        session.waitingCount = Math.max(0, session.waitingCount - 1);
      }
    }

    saveDataStore(store);
    return appointment;
  },

  toggleFeeStatus: async (id: string): Promise<Appointment | null> => {
    const store = loadDataStore();
    const appointment = store.appointments.find((a) => a.id === id);
    if (!appointment) return null;

    appointment.feeStatus = appointment.feeStatus === "PAID" ? "DUE" : "PAID";
    saveDataStore(store);
    return appointment;
  },
};
