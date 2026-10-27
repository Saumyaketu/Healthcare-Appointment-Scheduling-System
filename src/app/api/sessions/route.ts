import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionDelaySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId") || undefined;
    const sessions = await db.getSessions(doctorId);
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = sessionDelaySchema.parse(body);

    const updated = await db.updateSessionDelay(
      validated.availabilityId,
      validated.delayMinutes,
      validated.isRunningLate
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/sessions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update session" },
      { status: 400 }
    );
  }
}
