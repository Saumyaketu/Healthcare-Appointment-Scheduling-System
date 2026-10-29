import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = verifyPaymentSchema.parse(body);

    const result = await db.verifyPaymentAndConfirm({
      orderId: validated.orderId,
      razorpayPaymentId: validated.razorpayPaymentId,
      razorpaySignature: validated.razorpaySignature,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and appointment confirmed",
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment signature verification failed" },
      { status: 400 }
    );
  }
}
