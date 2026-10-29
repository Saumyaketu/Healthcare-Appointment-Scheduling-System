import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;
    const status = (searchParams.get("status") as PaymentStatus) || undefined;

    const payments = await db.getPayments({ appointmentId, patientId, status });
    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment records" },
      { status: 500 }
    );
  }
}
