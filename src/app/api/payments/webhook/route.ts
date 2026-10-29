import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { razorpayService } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Cryptographic Webhook Verification
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature received");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || `${event.event}_${event.payload?.payment?.entity?.id || Date.now()}`;

    // 2. Idempotency Check: Prevent duplicate webhook processing
    if (db.isWebhookEventProcessed(eventId)) {
      console.log(`Webhook event ${eventId} already processed (idempotent skip)`);
      return NextResponse.json({ success: true, message: "Event already processed" });
    }

    db.recordWebhookEvent(eventId);

    // 3. Process events
    const eventType = event.event;
    console.log(`[Webhook] Processing event: ${eventType} (${eventId})`);

    if (eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        // Confirm payment if not already confirmed
        await db.verifyPaymentAndConfirm({
          orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature || "webhook_captured",
        }).catch((err) => console.log("Webhook verify idempotent status:", err.message));
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const reason = paymentEntity?.error_description || "Payment failed via gateway";

      if (orderId) {
        const payments = await db.getPayments();
        const payment = payments.find((p) => p.gatewayOrderId === orderId);
        if (payment) {
          payment.status = "FAILED";
          payment.failureReason = reason;
        }
      }
    } else if (eventType === "refund.processed") {
      const refundEntity = event.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      const paymentId = refundEntity?.payment_id;

      if (refundId && paymentId) {
        const refunds = await db.getRefunds();
        const refund = refunds.find((r) => r.gatewayRefundId === refundId || r.paymentId === paymentId);
        if (refund) {
          refund.status = "PROCESSED";
          refund.processedAt = new Date().toISOString();
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("POST /api/payments/webhook error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
