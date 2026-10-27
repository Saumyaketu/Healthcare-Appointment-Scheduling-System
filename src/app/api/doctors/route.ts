import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const doctors = await db.getDoctors();
    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
