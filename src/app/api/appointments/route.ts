import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointmentBookingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;
    const status = searchParams.get("status") || undefined;

    const appointments = await db.getAppointments({ doctorId, patientId, status });
    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = appointmentBookingSchema.parse(body);

    const appointment = await db.createAppointment({
      patientName: validated.patientName,
      patientPhone: validated.patientPhone,
      patientEmail: validated.patientEmail || undefined,
      patientAge: validated.patientAge,
      patientGender: validated.patientGender,
      doctorId: validated.doctorId,
      availabilityId: validated.availabilityId,
      appointmentDate: validated.appointmentDate,
      priority: validated.priority,
      feeStatus: validated.feeStatus,
      notes: validated.notes,
      isWalkIn: false,
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create appointment" },
      { status: 400 }
    );
  }
}
