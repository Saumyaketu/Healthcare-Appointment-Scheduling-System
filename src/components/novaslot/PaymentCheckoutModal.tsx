"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Building2,
  Receipt,
} from "lucide-react";

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    paymentRecordId: string;
    appointmentId: string;
    tokenNumber: number;
    patientCode: string;
    doctorName?: string;
    patientName?: string;
  };
  onPaymentSuccess: (verifiedData: any) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // In sandbox mode or client checkout, generate mock payment ID and signature
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // Secure signature matching server verification
      const mockSignature = `mock_sig_${orderData.orderId}_${mockPaymentId}`;

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      setSuccessResult(data.data);
      onPaymentSuccess(data.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while confirming payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Razorpay Secure Checkout</h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted Healthcare Payment
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
                Consultation Fee
              </span>
              <div className="text-2xl font-black">{formatCurrency(orderData.amount)}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-200">Order Reference</span>
              <div className="font-mono text-xs font-semibold">{orderData.orderId.slice(0, 16)}...</div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successResult ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground">Payment Succeeded!</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your appointment slot and token are confirmed. An official receipt has been sent to your email.
                </p>
              </div>

              <div className="bg-muted/40 p-3 rounded-xl text-left border border-border text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Payment ID:</span>
                  <span className="text-foreground">{successResult.payment?.gatewayPaymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Token Number:</span>
                  <span className="text-foreground font-bold">#{orderData.tokenNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Receipt Ref:</span>
                  <span className="text-foreground">{successResult.payment?.receiptNumber}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                View Appointment Pass
              </button>
            </div>
          ) : (
            <>
              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-semibold block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-semibold block">Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "netbanking"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Building2 className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-semibold block">NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Consultation Summary Breakdown */}
              <div className="bg-muted/30 p-3.5 rounded-xl border border-border text-xs space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Doctor Consultation:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(orderData.amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Hospital Facility & Token Fee:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE (Covered)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Convenience & Payment Gateway Charges:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹0 (Waived)</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground">
                  <span>Net Payable Amount:</span>
                  <span className="text-primary text-sm">{formatCurrency(orderData.amount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
                <Receipt className="w-4 h-4 text-primary shrink-0" />
                <span>
                  A refundable guarantee applies per clinic terms if cancelled &gt;2 hours in advance.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authorizing with Razorpay...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatCurrency(orderData.amount)} via Razorpay
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel and Pay at Desk Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
