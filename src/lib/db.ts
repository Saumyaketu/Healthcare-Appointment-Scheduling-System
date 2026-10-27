import {
  Doctor,
  AvailabilitySession,
  Appointment,
  AppointmentStatus,
  Priority,
  FeeStatus,
  User,
  Patient,
  Role,
  AuthSession,
} from "./types";
import {
  INITIAL_DOCTORS,
  INITIAL_SESSIONS,
  INITIAL_APPOINTMENTS,
  INITIAL_USERS,
  INITIAL_PATIENTS,
} from "./sample-data";
import { generatePatientId, generateTokenNumber } from "./utils";
import { hashPassword, verifyPassword, generateToken } from "./auth-utils";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data-store.json");

interface DataStore {
  users: User[];
  patients: Patient[];
  doctors: Doctor[];
  sessions: AvailabilitySession[];
  appointments: Appointment[];
}

function loadDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.doctors && parsed.sessions && parsed.appointments) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading data store file, fallback to initial data", err);
  }

  const initialData: DataStore = {
    users: INITIAL_USERS,
    patients: INITIAL_PATIENTS,
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
  // Authentication & Users
  registerUser: async (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: Role;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    consultationFee?: number;
    roomNumber?: string;
    qualifications?: string;
    age?: number;
    gender?: "F" | "M" | "Other";
  }): Promise<AuthSession> => {
    const store = loadDataStore();

    const existingUser = store.users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existingUser) {
      throw new Error("A user with this email address already exists");
    }

    const userId = `usr-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash: hashPassword(data.password),
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    let createdDoctor: Doctor | undefined;
    let createdPatient: Patient | undefined;

    if (data.role === "DOCTOR") {
      createdDoctor = {
        id: `doc-${Date.now()}`,
        userId,
        fullName: data.fullName.startsWith("Dr.") ? data.fullName : `Dr. ${data.fullName}`,
        department: data.department || "General Medicine",
        specialization: data.specialization || "Clinical Consultation",
        licenseNumber: data.licenseNumber || `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        consultationFee: data.consultationFee || 700,
        roomNumber: data.roomNumber || `Room ${Math.floor(100 + Math.random() * 300)}`,
        avatarUrl: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256`,
        isAvailable: true,
        qualifications: data.qualifications || "MBBS, MD",
      };
      store.doctors.push(createdDoctor);

      // Create a default session for this doctor
      const newSession: AvailabilitySession = {
        id: `sess-${Date.now()}`,
        doctorId: createdDoctor.id,
        doctorName: createdDoctor.fullName,
        department: createdDoctor.department,
        sessionDate: new Date().toISOString().split("T")[0],
        sessionType: "Token Session",
        startTime: "09:00 AM",
        endTime: "01:00 PM",
        maxCapacity: 20,
        walkInCapacity: 4,
        walkInUsed: 0,
        bookedCount: 0,
        waitingCount: 0,
        isRunningLate: false,
        delayMinutes: 0,
      };
      store.sessions.push(newSession);
    } else {
      createdPatient = {
        id: `pat-${Date.now()}`,
        userId,
        patientCode: generatePatientId(),
        fullName: data.fullName,
        age: data.age || 30,
        gender: data.gender || "F",
        phone: data.phone,
      };
      store.patients.push(createdPatient);
    }

    saveDataStore(store);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role,
      },
      doctorProfile: createdDoctor,
      patientProfile: createdPatient,
      token: generateToken(newUser.id),
    };
  },

  loginUser: async (email: string, password: string): Promise<AuthSession> => {
    const store = loadDataStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    const doctorProfile = store.doctors.find((d) => d.userId === user.id);
    const patientProfile = store.patients.find((p) => p.userId === user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      doctorProfile,
      patientProfile,
      token: generateToken(user.id),
    };
  },

  getUserById: async (id: string): Promise<AuthSession | null> => {
    const store = loadDataStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return null;

    const doctorProfile = store.doctors.find((d) => d.userId === user.id);
    const patientProfile = store.patients.find((p) => p.userId === user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      doctorProfile,
      patientProfile,
      token: generateToken(user.id),
    };
  },

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

    const sessionAppointments = store.appointments.filter(
      (a) => a.availabilityId === data.availabilityId
    );
    const nextToken = generateTokenNumber(sessionAppointments.map((a) => a.tokenNumber));

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
      status: "CONFIRMED",
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
