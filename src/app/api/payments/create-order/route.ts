import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPaymentOrderSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createPaymentOrderSchema.parse(body);

    const result = await db.createPaymentOrder({
      doctorId: validated.doctorId,
      availabilityId: validated.availabilityId,
      appointmentDate: validated.appointmentDate,
      patientName: validated.patientName,
      patientPhone: validated.patientPhone,
      patientEmail: validated.patientEmail || undefined,
      patientAge: validated.patientAge,
      patientGender: validated.patientGender,
      priority: validated.priority,
      notes: validated.notes,
      existingAppointmentId: validated.existingAppointmentId,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payments/create-order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order" },
      { status: 400 }
    );
  }
}
