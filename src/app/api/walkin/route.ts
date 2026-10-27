import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { walkInSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = walkInSchema.parse(body);

    const appointment = await db.createAppointment({
      patientName: validated.patientName,
      patientPhone: validated.patientPhone,
      patientAge: validated.patientAge,
      patientGender: validated.patientGender,
      doctorId: validated.doctorId,
      availabilityId: validated.availabilityId,
      priority: validated.priority,
      feeStatus: validated.feeStatus,
      notes: validated.notes,
      isWalkIn: true,
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/walkin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create walk-in" },
      { status: 400 }
    );
  }
}
