"use client";

import React, { useState, useEffect } from "react";
import { NotificationRecord } from "@/lib/types";
import {
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  X,
  RefreshCw,
  Send,
  CalendarCheck,
  AlertTriangle,
  FileText,
  Search,
} from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
}

export function NotificationsModal({
  isOpen,
  onClose,
  recipientEmail,
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);
  const [filter, setFilter] = useState<"ALL" | "SENT" | "SCHEDULED">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingReminders, setIsProcessingReminders] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, recipientEmail]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const url = recipientEmail
        ? `/api/notifications?recipientEmail=${encodeURIComponent(recipientEmail)}`
        : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        if (data.data.length > 0 && !selectedNotif) {
          setSelectedNotif(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSweep = async () => {
    setIsProcessingReminders(true);
    setSweepResult(null);
    try {
      const res = await fetch("/api/reminders/process", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSweepResult(data.message);
        fetchNotifications();
      }
    } catch (err: any) {
      setSweepResult(err.message || "Sweep failed");
    } finally {
      setIsProcessingReminders(false);
    }
  };

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === "SENT") return n.status === "SENT";
    if (filter === "SCHEDULED") return n.status === "PENDING" && n.scheduledFor;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">
                Healthcare Notification & Reminders Activity
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Audit trail for patient emails, booking confirmations, receipts & automated queue alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSweep}
              disabled={isProcessingReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all disabled:opacity-50"
              title="Evaluates and sends due 24h & 2h appointment reminders"
            >
              {isProcessingReminders ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              Trigger Reminders Sweep
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {sweepResult && (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {sweepResult}</span>
            <button onClick={() => setSweepResult(null)} className="text-xs hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Content Layout: 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Notification List */}
          <div className="w-80 border-r border-border flex flex-col bg-muted/10">
            {/* Filter Pills */}
            <div className="p-3 border-b border-border flex items-center gap-1.5 text-xs bg-card">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter === "ALL"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("SENT")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter === "SENT"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setFilter("SCHEDULED")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filter === "SCHEDULED"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Scheduled
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="text-center py-12 px-4 text-muted-foreground text-xs">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No notifications matching filter
                </div>
              ) : (
                filtered.map((n) => {
                  const isSelected = selectedNotif?.id === n.id;
                  const isSent = n.status === "SENT";
                  const isCancelled = n.status === "CANCELLED";

                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNotif(n)}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSent
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isCancelled
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {isSent ? "Delivered" : isCancelled ? "Cancelled" : "Scheduled"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="font-semibold text-foreground line-clamp-1">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        To: {n.recipientName} ({n.recipientEmail})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Notification Viewer */}
          <div className="flex-1 overflow-y-auto p-5 bg-background flex flex-col">
            {selectedNotif ? (
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground">{selectedNotif.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground">
                      Channel: {selectedNotif.channel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px] pt-1 border-t border-border">
                    <div>
                      <strong>Recipient:</strong> {selectedNotif.recipientName} &lt;{selectedNotif.recipientEmail}&gt;
                    </div>
                    <div>
                      <strong>Notification Type:</strong> {selectedNotif.type}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span className="font-bold text-foreground">{selectedNotif.status}</span>
                    </div>
                    <div>
                      <strong>Timestamp:</strong>{" "}
                      {new Date(selectedNotif.createdAt).toLocaleString()}
                    </div>
                    {selectedNotif.scheduledFor && (
                      <div className="col-span-2 text-blue-600 dark:text-blue-400 font-semibold">
                        Scheduled Delivery: {new Date(selectedNotif.scheduledFor).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rendered HTML Email Content */}
                <div className="border border-border rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-xs">
                  <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Email Content Preview</span>
                    <span>Format: Responsive HTML</span>
                  </div>

                  <div className="p-2 overflow-x-auto">
                    {selectedNotif.htmlContent ? (
                      <iframe
                        srcDoc={selectedNotif.htmlContent}
                        title="Email Preview"
                        className="w-full min-h-[420px] border-none rounded"
                      />
                    ) : (
                      <div className="p-4 text-xs font-mono whitespace-pre-wrap text-foreground">
                        {selectedNotif.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-center text-muted-foreground text-xs">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Select a notification to view its transmission log and HTML email template
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
