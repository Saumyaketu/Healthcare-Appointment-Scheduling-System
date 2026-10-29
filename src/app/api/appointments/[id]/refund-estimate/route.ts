import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") as Role) || "PATIENT";

    const estimate = await db.getRefundEstimateForAppointment(params.id, role);
    return NextResponse.json({ success: true, data: estimate });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate refund estimate" },
      { status: 400 }
    );
  }
}
