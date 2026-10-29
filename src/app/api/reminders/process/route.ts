import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const result = await db.processDueReminders();
    return NextResponse.json({
      success: true,
      message: `Evaluated reminders: ${result.processedCount} sent, ${result.cancelledCount} suppressed`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/reminders/process error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process reminders" },
      { status: 500 }
    );
  }
}
