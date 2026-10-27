import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateAppointmentStatusSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await db.getAppointmentById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.action === "toggle_fee") {
      const updated = await db.toggleFeeStatus(params.id);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Appointment not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }

    const validated = updateAppointmentStatusSchema.parse({
      appointmentId: params.id,
      status: body.status,
      clinicalSummary: body.clinicalSummary,
    });

    const updated = await db.updateAppointmentStatus(
      params.id,
      validated.status,
      validated.clinicalSummary
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update appointment" },
      { status: 400 }
    );
  }
}
