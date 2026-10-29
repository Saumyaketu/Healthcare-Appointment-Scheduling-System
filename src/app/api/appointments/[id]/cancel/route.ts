import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancelAppointmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = cancelAppointmentSchema.parse(body);

    const result = await db.cancelAppointmentWithRefund({
      appointmentId: params.id,
      reason: validated.reason,
      cancelledByRole: validated.cancelledByRole,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/appointments/[id]/cancel error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel appointment" },
      { status: 400 }
    );
  }
}
