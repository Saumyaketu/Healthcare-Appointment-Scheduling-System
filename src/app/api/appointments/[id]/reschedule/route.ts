import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rescheduleAppointmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = rescheduleAppointmentSchema.parse(body);

    const result = await db.rescheduleAppointment({
      appointmentId: params.id,
      targetAvailabilityId: validated.targetAvailabilityId,
      reason: validated.reason,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/appointments/[id]/reschedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reschedule appointment" },
      { status: 400 }
    );
  }
}
