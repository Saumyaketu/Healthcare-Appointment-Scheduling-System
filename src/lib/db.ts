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
  PaymentRecord,
  RefundRecord,
  NotificationRecord,
  PaymentStatus,
  RefundStatus,
  RefundPolicyEstimate,
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
import { razorpayService } from "./razorpay";
import { calculateRefundEstimate } from "./refund-policy";
import { notificationService, notificationTemplates } from "./notification-service";
import { calculateReminderDates } from "./reminder-scheduler";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data-store.json");

interface DataStore {
  users: User[];
  patients: Patient[];
  doctors: Doctor[];
  sessions: AvailabilitySession[];
  appointments: Appointment[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  notifications: NotificationRecord[];
  processedWebhookEvents: string[];
}

function ensureUpcomingDoctorSessions(data: DataStore): boolean {
  let changed = false;
  const now = new Date();

  data.doctors.forEach((doc) => {
    // Generate/ensure slots for the next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Check if session exists for this doctor on dateStr
      const hasMorningSession = data.sessions.some(
        (s) => s.doctorId === doc.id && s.sessionDate === dateStr && s.startTime.includes("09:00")
      );

      if (!hasMorningSession) {
        data.sessions.push({
          id: `sess-${doc.id}-${dateStr}-morning`,
          doctorId: doc.id,
          doctorName: doc.fullName,
          department: doc.department,
          sessionDate: dateStr,
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
        });
        changed = true;
      }

      const hasAfternoonSession = data.sessions.some(
        (s) => s.doctorId === doc.id && s.sessionDate === dateStr && s.startTime.includes("02:00")
      );

      if (!hasAfternoonSession) {
        data.sessions.push({
          id: `sess-${doc.id}-${dateStr}-afternoon`,
          doctorId: doc.id,
          doctorName: doc.fullName,
          department: doc.department,
          sessionDate: dateStr,
          sessionType: "Token Session",
          startTime: "02:00 PM",
          endTime: "06:00 PM",
          maxCapacity: 15,
          walkInCapacity: 3,
          walkInUsed: 0,
          bookedCount: 0,
          waitingCount: 0,
          isRunningLate: false,
          delayMinutes: 0,
        });
        changed = true;
      }
    }
  });

  return changed;
}

function loadDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.doctors && parsed.sessions && parsed.appointments) {
        if (!parsed.payments) parsed.payments = [];
        if (!parsed.refunds) parsed.refunds = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.processedWebhookEvents) parsed.processedWebhookEvents = [];
        const changed = ensureUpcomingDoctorSessions(parsed);
        if (changed) {
          saveDataStore(parsed);
        }
        return parsed as DataStore;
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
    payments: [],
    refunds: [],
    notifications: [],
    processedWebhookEvents: [],
  };

  ensureUpcomingDoctorSessions(initialData);

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
  getSessions: async (doctorId?: string, date?: string): Promise<AvailabilitySession[]> => {
    const store = loadDataStore();
    let results = store.sessions;
    if (doctorId) {
      results = results.filter((s) => s.doctorId === doctorId);
    }
    if (date) {
      results = results.filter((s) => s.sessionDate === date);
    }
    return results;
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
      const order: Record<AppointmentStatus, number> = {
        IN_CONSULT: 0,
        CONFIRMED: 1,
        PENDING: 2,
        COMPLETED: 3,
        CANCELLED: 4,
      };
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

  /**
   * Cleans up expired pending reservations to prevent overbooking and free slots.
   */
  cleanupExpiredPendingBookings: async () => {
    const store = loadDataStore();
    const now = new Date().toISOString();
    let changed = false;

    for (const apt of store.appointments) {
      if (apt.status === "PENDING" && apt.pendingExpiresAt && apt.pendingExpiresAt < now) {
        apt.status = "CANCELLED";
        apt.cancellationReason = "Online payment window expired (10 minutes timeout)";
        apt.updatedAt = now;

        const session = store.sessions.find((s) => s.id === apt.availabilityId);
        if (session) {
          session.bookedCount = Math.max(0, session.bookedCount - 1);
          session.waitingCount = Math.max(0, session.waitingCount - 1);
        }
        changed = true;
      }
    }

    if (changed) {
      saveDataStore(store);
    }
  },

  createAppointment: async (data: {
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    patientAge: number;
    patientGender: string;
    doctorId: string;
    availabilityId: string;
    appointmentDate?: string;
    priority: Priority;
    feeStatus: FeeStatus;
    notes?: string;
    isWalkIn?: boolean;
    status?: AppointmentStatus;
    pendingExpiresAt?: string;
    patientId?: string;
  }): Promise<Appointment> => {
    const store = loadDataStore();

    // Check doctor & session
    const doctor = store.doctors.find((d) => d.id === data.doctorId);
    let session = store.sessions.find((s) => s.id === data.availabilityId);

    if (!doctor) {
      throw new Error("Invalid doctor ID");
    }

    // Determine target schedule date
    const targetDate =
      data.appointmentDate ||
      (session ? session.sessionDate : new Date().toISOString().split("T")[0]);

    // If session doesn't match targetDate, find or create doctor session on targetDate
    if (!session || (data.appointmentDate && session.sessionDate !== data.appointmentDate)) {
      const matchingSession = store.sessions.find(
        (s) => s.doctorId === doctor.id && s.sessionDate === targetDate
      );

      if (matchingSession) {
        session = matchingSession;
      } else {
        session = {
          id: `sess-${doctor.id}-${targetDate}-${Date.now().toString().slice(-4)}`,
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          department: doctor.department,
          sessionDate: targetDate,
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
        store.sessions.push(session);
      }
    }

    // Capacity verification to strictly prevent overbooking
    if (session.bookedCount >= session.maxCapacity) {
      throw new Error("This consultation session is fully booked. Please select another slot.");
    }

    const sessionAppointments = store.appointments.filter(
      (a) => a.availabilityId === session!.id && a.status !== "CANCELLED"
    );
    const nextToken = generateTokenNumber(sessionAppointments.map((a) => a.tokenNumber));

    session.bookedCount += 1;
    session.waitingCount += 1;
    if (data.isWalkIn) {
      session.walkInUsed += 1;
    }

    const appointmentStatus = data.status || "CONFIRMED";
    const patientCode = generatePatientId();
    const patientId = data.patientId || `pat-${Date.now()}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tokenNumber: nextToken,
      patientId,
      patientName: data.patientName,
      patientCode,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail || "patient@example.com",
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      availabilityId: session.id,
      appointmentDate: targetDate, // Strictly stores the scheduled date
      estimatedTime: `${10 + Math.floor(nextToken / 3)}:${(nextToken % 4) * 15 || "00"} AM`,
      status: appointmentStatus,
      priority: data.priority,
      feeStatus: data.feeStatus,
      consultationFee: doctor.consultationFee,
      isWalkIn: data.isWalkIn || false,
      notes: data.notes,
      refundStatus: "NONE",
      pendingExpiresAt: data.pendingExpiresAt,
      createdAt: new Date().toISOString(),
    };

    store.appointments.unshift(newAppointment);

    // If confirmed immediately (cash or pre-paid), trigger booking email and reminders
    if (appointmentStatus === "CONFIRMED") {
      db.scheduleRemindersAndSendConfirmation(newAppointment, store);
    }

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

    // Cancel pending reminders if appointment is completed or cancelled
    if (status === "CANCELLED" || status === "COMPLETED") {
      store.notifications
        .filter((n) => n.appointmentId === id && n.status === "PENDING")
        .forEach((n) => {
          n.status = "CANCELLED";
        });
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

  /* ========================================================================= */
  /*                         PAYMENT PROCESSING ENGINE                         */
  /* ========================================================================= */

  /**
   * Step 1: Secure Order Creation
   * Uses doctor consultation fee from the database (NEVER trusted from frontend).
   * Creates or locks a temporary reservation appointment (10 minute window).
   */
  createPaymentOrder: async (params: {
    doctorId: string;
    availabilityId: string;
    appointmentDate?: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    patientAge: number;
    patientGender: string;
    priority?: Priority;
    notes?: string;
    existingAppointmentId?: string;
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    paymentRecordId: string;
    appointmentId: string;
    tokenNumber: number;
    patientCode: string;
  }> => {
    const store = loadDataStore();
    await db.cleanupExpiredPendingBookings();

    const doctor = store.doctors.find((d) => d.id === params.doctorId);
    if (!doctor) throw new Error("Doctor not found");

    const session = store.sessions.find((s) => s.id === params.availabilityId);
    if (!session && !params.appointmentDate) throw new Error("Consultation session not found");

    // Server-side fee source of truth
    const amountInRupees = doctor.consultationFee || 700;
    const amountInPaise = amountInRupees * 100;

    let appointment: Appointment;

    if (params.existingAppointmentId) {
      const existing = store.appointments.find((a) => a.id === params.existingAppointmentId);
      if (!existing) throw new Error("Specified appointment not found");
      appointment = existing;
    } else {
      // Create pending appointment with 10 min hold
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      appointment = await db.createAppointment({
        patientName: params.patientName,
        patientPhone: params.patientPhone,
        patientEmail: params.patientEmail,
        patientAge: params.patientAge,
        patientGender: params.patientGender,
        doctorId: doctor.id,
        availabilityId: params.availabilityId,
        appointmentDate: params.appointmentDate,
        priority: params.priority || "NORMAL",
        feeStatus: "DUE",
        status: "PENDING",
        notes: params.notes,
        pendingExpiresAt: expiresAt,
      });
    }

    // Call Razorpay Service
    const receipt = `rec_${appointment.tokenNumber}_${Date.now().toString().slice(-6)}`;
    const rzpOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        doctorName: doctor.fullName,
      },
    });

    // Refresh store so newly created appointment is retained
    const freshStore = loadDataStore();
    const freshApt = freshStore.appointments.find((a) => a.id === appointment.id);

    // Create Payment Record
    const paymentId = `pay-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const paymentRecord: PaymentRecord = {
      id: paymentId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      amount: amountInRupees,
      currency: "INR",
      gateway: "RAZORPAY",
      gatewayOrderId: rzpOrder.id,
      receiptNumber: receipt,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    freshStore.payments.push(paymentRecord);
    if (freshApt) {
      freshApt.paymentId = paymentRecord.id;
    }
    saveDataStore(freshStore);

    return {
      orderId: rzpOrder.id,
      amount: amountInRupees,
      currency: "INR",
      keyId: razorpayService.getKeyId(),
      paymentRecordId: paymentRecord.id,
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
      patientCode: appointment.patientCode,
    };
  },

  /**
   * Step 2: Server-side Signature Verification & Payment Confirmation
   * Verifies Razorpay HMAC signature, confirms appointment, sends confirmation emails,
   * and schedules automated reminders.
   */
  verifyPaymentAndConfirm: async (params: {
    orderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{
    success: boolean;
    appointment: Appointment;
    payment: PaymentRecord;
  }> => {
    const store = loadDataStore();
    const { orderId, razorpayPaymentId, razorpaySignature } = params;

    // Verify Signature
    const isValid = razorpayService.verifyPaymentSignature({
      orderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      throw new Error("Razorpay payment signature verification failed. Untrusted request.");
    }

    const payment = store.payments.find((p) => p.gatewayOrderId === orderId);
    if (!payment) {
      throw new Error(`No payment record found for order: ${orderId}`);
    }

    // Idempotency: If already paid, return early
    if (payment.status === "PAID") {
      const apt = store.appointments.find((a) => a.id === payment.appointmentId);
      return { success: true, appointment: apt!, payment };
    }

    // Update payment record
    payment.status = "PAID";
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewaySignature = razorpaySignature;
    payment.updatedAt = new Date().toISOString();

    // Confirm appointment
    const appointment = store.appointments.find((a) => a.id === payment.appointmentId);
    if (!appointment) {
      throw new Error(`Appointment ${payment.appointmentId} not found`);
    }

    appointment.status = "CONFIRMED";
    appointment.feeStatus = "PAID";
    appointment.paymentId = payment.id;
    appointment.pendingExpiresAt = undefined;
    appointment.updatedAt = new Date().toISOString();

    // Send Booking Confirmation & Payment Receipt Emails
    db.scheduleRemindersAndSendConfirmation(appointment, store, payment);

    saveDataStore(store);
    return { success: true, appointment, payment };
  },

  /* ========================================================================= */
  /*                    APPOINTMENT RESCHEDULING WORKFLOW                      */
  /* ========================================================================= */

  rescheduleAppointment: async (params: {
    appointmentId: string;
    targetAvailabilityId: string;
    reason?: string;
  }): Promise<{
    appointment: Appointment;
    newSession: AvailabilitySession;
    oldSession: AvailabilitySession;
  }> => {
    const store = loadDataStore();
    const appointment = store.appointments.find((a) => a.id === params.appointmentId);

    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status === "CANCELLED") {
      throw new Error("Cancelled appointments cannot be rescheduled.");
    }
    if (appointment.status === "COMPLETED") {
      throw new Error("Completed consultations cannot be rescheduled.");
    }

    const oldSession = store.sessions.find((s) => s.id === appointment.availabilityId);
    const newSession = store.sessions.find((s) => s.id === params.targetAvailabilityId);

    if (!newSession) throw new Error("Target session does not exist");
    if (newSession.id === appointment.availabilityId) {
      throw new Error("Selected session is identical to the current slot.");
    }

    // Verify capacity in target session
    if (newSession.bookedCount >= newSession.maxCapacity) {
      throw new Error("The target consultation session is fully booked. Please choose another date.");
    }

    // Calculate new token in target session
    const targetApts = store.appointments.filter(
      (a) => a.availabilityId === newSession.id && a.status !== "CANCELLED"
    );
    const newToken = generateTokenNumber(targetApts.map((a) => a.tokenNumber));

    // Release slot in old session
    if (oldSession) {
      oldSession.bookedCount = Math.max(0, oldSession.bookedCount - 1);
      oldSession.waitingCount = Math.max(0, oldSession.waitingCount - 1);
    }

    // Reserve slot in new session
    newSession.bookedCount += 1;
    newSession.waitingCount += 1;

    const oldDate = appointment.appointmentDate;
    const oldTime = appointment.estimatedTime;

    // Update appointment
    appointment.rescheduledFromSessionId = appointment.availabilityId;
    appointment.availabilityId = newSession.id;
    appointment.appointmentDate = newSession.sessionDate;
    appointment.tokenNumber = newToken;
    appointment.estimatedTime = `${10 + Math.floor(newToken / 3)}:${(newToken % 4) * 15 || "00"} AM`;
    appointment.rescheduledAt = new Date().toISOString();
    appointment.updatedAt = new Date().toISOString();

    // 1. Cancel previous pending reminders for this appointment
    store.notifications
      .filter((n) => n.appointmentId === appointment.id && n.status === "PENDING")
      .forEach((n) => {
        n.status = "CANCELLED";
      });

    // 2. Schedule updated reminders for new session date
    db.scheduleRemindersOnly(appointment, store);

    // 3. Dispatch Rescheduled Notification Email
    const { title, html } = notificationTemplates.rescheduled({
      appointment,
      oldDate,
      oldTime,
      newDate: newSession.sessionDate,
      newTime: appointment.estimatedTime,
      newTokenNumber: newToken,
    });

    const notif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointmentId: appointment.id,
      recipientEmail: appointment.patientEmail || "patient@example.com",
      recipientPhone: appointment.patientPhone,
      recipientName: appointment.patientName,
      channel: "EMAIL",
      type: "APPOINTMENT_RESCHEDULED",
      title,
      content: `Your appointment with ${appointment.doctorName} has been rescheduled to ${newSession.sessionDate}. New Token #${newToken}`,
      htmlContent: html,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(notif);
    notificationService.dispatch(notif);

    saveDataStore(store);
    return { appointment, newSession, oldSession: oldSession! };
  },

  /* ========================================================================= */
  /*                    CANCELLATION & REFUND MANAGEMENT                       */
  /* ========================================================================= */

  /**
   * Get refund policy preview without modifying anything
   */
  getRefundEstimateForAppointment: async (
    appointmentId: string,
    role: Role = "PATIENT"
  ): Promise<RefundPolicyEstimate> => {
    const store = loadDataStore();
    const appointment = store.appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    return calculateRefundEstimate({ appointment, cancelledByRole: role });
  },

  /**
   * Cancel Appointment & Process Eligible Refund
   */
  cancelAppointmentWithRefund: async (params: {
    appointmentId: string;
    reason: string;
    cancelledByRole: Role;
  }): Promise<{
    appointment: Appointment;
    refundRecord?: RefundRecord;
    refundEstimate: RefundPolicyEstimate;
  }> => {
    const store = loadDataStore();
    const { appointmentId, reason, cancelledByRole } = params;

    const appointment = store.appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    if (appointment.status === "CANCELLED") {
      throw new Error("This appointment is already cancelled.");
    }
    if (appointment.status === "COMPLETED") {
      throw new Error("Completed appointments cannot be cancelled.");
    }

    // Calculate policy estimate
    const estimate = calculateRefundEstimate({
      appointment,
      cancelledByRole,
    });

    // Update appointment state
    appointment.status = "CANCELLED";
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancelledBy = cancelledByRole;
    appointment.updatedAt = new Date().toISOString();

    // Release session counters
    const session = store.sessions.find((s) => s.id === appointment.availabilityId);
    if (session) {
      session.waitingCount = Math.max(0, session.waitingCount - 1);
      session.bookedCount = Math.max(0, session.bookedCount - 1);
    }

    // Cancel pending automated reminders
    store.notifications
      .filter((n) => n.appointmentId === appointmentId && n.status === "PENDING")
      .forEach((n) => {
        n.status = "CANCELLED";
      });

    let refundRecord: RefundRecord | undefined;

    // Check if appointment was paid
    const payment = store.payments.find(
      (p) => p.appointmentId === appointmentId && p.status === "PAID"
    );

    if (payment && estimate.isEligible && estimate.refundAmount > 0) {
      // Step A: Mark refund as PENDING
      appointment.refundStatus = "PENDING";

      const refundId = `rfnd-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      refundRecord = {
        id: refundId,
        paymentId: payment.id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        originalAmount: estimate.originalFee,
        refundAmount: estimate.refundAmount,
        deductionAmount: estimate.deductionAmount,
        refundPercentage: estimate.refundPercentage,
        reason,
        status: "PENDING",
        initiatedBy: cancelledByRole,
        initiatedAt: new Date().toISOString(),
      };
      store.refunds.push(refundRecord);

      // Step B: Call Razorpay Refund Gateway
      try {
        const rzpRefund = await razorpayService.createRefund({
          paymentId: payment.gatewayPaymentId || "pay_mock_123",
          amountInPaise: estimate.refundAmount * 100,
          notes: {
            appointmentId: appointment.id,
            reason,
          },
        });

        refundRecord.gatewayRefundId = rzpRefund.id;
        refundRecord.status = "PROCESSED";
        refundRecord.processedAt = new Date().toISOString();
        appointment.refundStatus = "PROCESSED";
        payment.status =
          estimate.refundPercentage === 100 ? "REFUNDED" : "PARTIALLY_REFUNDED";
      } catch (refundErr: any) {
        console.error("Gateway refund failed:", refundErr);
        refundRecord.status = "FAILED";
        refundRecord.failureReason = refundErr.message;
        appointment.refundStatus = "FAILED";
      }
    } else {
      appointment.refundStatus = payment ? "NONE" : "NOT_APPLICABLE";
    }

    // Send Cancellation & Refund Notification Email
    const { title, html } = notificationTemplates.cancelledAndRefund({
      appointment,
      reason,
      refundEstimate: estimate,
      refundRecord,
    });

    const notif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointmentId: appointment.id,
      recipientEmail: appointment.patientEmail || "patient@example.com",
      recipientPhone: appointment.patientPhone,
      recipientName: appointment.patientName,
      channel: "EMAIL",
      type: "APPOINTMENT_CANCELLED",
      title,
      content: `Your appointment with ${appointment.doctorName} on ${appointment.appointmentDate} has been cancelled. Refund status: ${appointment.refundStatus}.`,
      htmlContent: html,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(notif);
    notificationService.dispatch(notif);

    saveDataStore(store);
    return { appointment, refundRecord, refundEstimate: estimate };
  },

  /**
   * Process Manual Front-Desk Refund
   */
  processManualRefund: async (params: {
    appointmentId: string;
    amount: number;
    reason: string;
    adminRole: Role;
  }): Promise<RefundRecord> => {
    const store = loadDataStore();
    const { appointmentId, amount, reason, adminRole } = params;

    const appointment = store.appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    const payment = store.payments.find(
      (p) => p.appointmentId === appointmentId && (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED")
    );
    if (!payment) throw new Error("No paid transaction found for this appointment.");

    if (amount <= 0 || amount > payment.amount) {
      throw new Error(`Refund amount must be between ₹1 and ₹${payment.amount}`);
    }

    const rzpRefund = await razorpayService.createRefund({
      paymentId: payment.gatewayPaymentId || "pay_mock_123",
      amountInPaise: amount * 100,
      notes: { appointmentId, reason },
    });

    const refundRecord: RefundRecord = {
      id: `rfnd-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentId: payment.id,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      originalAmount: payment.amount,
      refundAmount: amount,
      deductionAmount: payment.amount - amount,
      refundPercentage: Math.round((amount / payment.amount) * 100),
      reason,
      status: "PROCESSED",
      gatewayRefundId: rzpRefund.id,
      initiatedBy: adminRole,
      initiatedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    store.refunds.push(refundRecord);
    appointment.refundStatus = "PROCESSED";
    payment.status = amount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";

    saveDataStore(store);
    return refundRecord;
  },

  getPayments: async (filters?: {
    patientId?: string;
    appointmentId?: string;
    status?: PaymentStatus;
  }): Promise<PaymentRecord[]> => {
    const store = loadDataStore();
    let results = store.payments;
    if (filters?.patientId) {
      results = results.filter((p) => p.patientId === filters.patientId);
    }
    if (filters?.appointmentId) {
      results = results.filter((p) => p.appointmentId === filters.appointmentId);
    }
    if (filters?.status) {
      results = results.filter((p) => p.status === filters.status);
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getRefunds: async (filters?: {
    patientId?: string;
    appointmentId?: string;
    status?: RefundStatus;
  }): Promise<RefundRecord[]> => {
    const store = loadDataStore();
    let results = store.refunds;
    if (filters?.patientId) {
      results = results.filter((r) => r.patientId === filters.patientId);
    }
    if (filters?.appointmentId) {
      results = results.filter((r) => r.appointmentId === filters.appointmentId);
    }
    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    return results.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
  },

  /* ========================================================================= */
  /*                     NOTIFICATION & REMINDER ENGINE                        */
  /* ========================================================================= */

  scheduleRemindersAndSendConfirmation: (
    appointment: Appointment,
    store: DataStore,
    payment?: PaymentRecord
  ) => {
    // 1. Dispatch Booking Confirmation Email
    const confirmTemplate = notificationTemplates.bookingConfirmed({
      appointment,
      tokenNumber: appointment.tokenNumber,
      payment,
    });

    const notifConfirm: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointmentId: appointment.id,
      recipientEmail: appointment.patientEmail || "patient@example.com",
      recipientPhone: appointment.patientPhone,
      recipientName: appointment.patientName,
      channel: "EMAIL",
      type: "BOOKING_CONFIRMATION",
      title: confirmTemplate.title,
      content: `Your appointment with ${appointment.doctorName} has been confirmed. Token #${appointment.tokenNumber}`,
      htmlContent: confirmTemplate.html,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(notifConfirm);
    notificationService.dispatch(notifConfirm);

    // 2. Dispatch Payment Receipt Email if paid
    if (payment && payment.status === "PAID") {
      const receiptTemplate = notificationTemplates.paymentSuccess({
        appointment,
        payment,
      });

      const notifReceipt: NotificationRecord = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appointmentId: appointment.id,
        recipientEmail: appointment.patientEmail || "patient@example.com",
        recipientPhone: appointment.patientPhone,
        recipientName: appointment.patientName,
        channel: "EMAIL",
        type: "PAYMENT_SUCCESS",
        title: receiptTemplate.title,
        content: `Payment receipt: ₹${payment.amount} settled via Razorpay for Token #${appointment.tokenNumber}`,
        htmlContent: receiptTemplate.html,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      store.notifications.push(notifReceipt);
      notificationService.dispatch(notifReceipt);
    }

    // 3. Schedule Reminders
    db.scheduleRemindersOnly(appointment, store);
  },

  scheduleRemindersOnly: (appointment: Appointment, store: DataStore) => {
    const { reminder24h, reminder2h } = calculateReminderDates(appointment);
    const now = new Date();

    // Schedule 24h Reminder
    if (reminder24h > now) {
      const template24h = notificationTemplates.reminder({
        appointment,
        type: "REMINDER_24H",
      });

      const notif24: NotificationRecord = {
        id: `notif-rem24-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appointmentId: appointment.id,
        recipientEmail: appointment.patientEmail || "patient@example.com",
        recipientPhone: appointment.patientPhone,
        recipientName: appointment.patientName,
        channel: "EMAIL",
        type: "REMINDER_24H",
        title: template24h.title,
        content: `Reminder: Consultation with ${appointment.doctorName} is tomorrow at ${appointment.appointmentDate}. Token #${appointment.tokenNumber}`,
        htmlContent: template24h.html,
        status: "PENDING",
        scheduledFor: reminder24h.toISOString(),
        createdAt: new Date().toISOString(),
      };
      store.notifications.push(notif24);
    }

    // Schedule 2h Reminder
    if (reminder2h > now) {
      const template2h = notificationTemplates.reminder({
        appointment,
        type: "REMINDER_2H",
      });

      const notif2: NotificationRecord = {
        id: `notif-rem2-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appointmentId: appointment.id,
        recipientEmail: appointment.patientEmail || "patient@example.com",
        recipientPhone: appointment.patientPhone,
        recipientName: appointment.patientName,
        channel: "EMAIL",
        type: "REMINDER_2H",
        title: template2h.title,
        content: `Reminder: Your OPD consultation starts in ~2 hours. Doctor: ${appointment.doctorName}, Token #${appointment.tokenNumber}`,
        htmlContent: template2h.html,
        status: "PENDING",
        scheduledFor: reminder2h.toISOString(),
        createdAt: new Date().toISOString(),
      };
      store.notifications.push(notif2);
    }
  },

  getNotifications: async (filters?: {
    appointmentId?: string;
    recipientEmail?: string;
  }): Promise<NotificationRecord[]> => {
    const store = loadDataStore();
    let results = store.notifications;
    if (filters?.appointmentId) {
      results = results.filter((n) => n.appointmentId === filters.appointmentId);
    }
    if (filters?.recipientEmail) {
      results = results.filter((n) => n.recipientEmail.toLowerCase() === filters.recipientEmail?.toLowerCase());
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * Evaluates due scheduled reminders and delivers them reliably.
   * Cancels reminders for any appointment that was cancelled or completed.
   */
  processDueReminders: async (): Promise<{ processedCount: number; cancelledCount: number }> => {
    const store = loadDataStore();
    const nowIso = new Date().toISOString();
    let processedCount = 0;
    let cancelledCount = 0;

    const dueReminders = store.notifications.filter(
      (n) => n.status === "PENDING" && n.scheduledFor && n.scheduledFor <= nowIso
    );

    for (const reminder of dueReminders) {
      const apt = store.appointments.find((a) => a.id === reminder.appointmentId);

      // Rule: Do NOT send reminder if appointment is cancelled or completed
      if (!apt || apt.status === "CANCELLED" || apt.status === "COMPLETED") {
        reminder.status = "CANCELLED";
        cancelledCount++;
        continue;
      }

      await notificationService.dispatch(reminder);
      processedCount++;
    }

    if (dueReminders.length > 0) {
      saveDataStore(store);
    }

    return { processedCount, cancelledCount };
  },

  isWebhookEventProcessed: (eventId: string): boolean => {
    const store = loadDataStore();
    return store.processedWebhookEvents.includes(eventId);
  },

  recordWebhookEvent: (eventId: string) => {
    const store = loadDataStore();
    if (!store.processedWebhookEvents.includes(eventId)) {
      store.processedWebhookEvents.push(eventId);
      saveDataStore(store);
    }
  },
};
