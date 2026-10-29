import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manualRefundSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = manualRefundSchema.parse(body);

    const refund = await db.processManualRefund({
      appointmentId: validated.appointmentId,
      amount: validated.amount,
      reason: validated.reason,
      adminRole: validated.adminRole,
    });

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      data: refund,
    });
  } catch (error: any) {
    console.error("POST /api/payments/refund error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process refund" },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;

    const refunds = await db.getRefunds({ appointmentId, patientId });
    return NextResponse.json({ success: true, data: refunds });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}
