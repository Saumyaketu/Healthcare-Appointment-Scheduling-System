"use client";

import React, { useState } from "react";
import { Info, X, Radio } from "lucide-react";

export function AlertBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="w-full bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 px-4 py-2 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3 transition-all">
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
        <div>
          <span className="font-bold">Live OPD Queue Active:</span>{" "}
          <span className="opacity-90">
            Appointments, tokens, and physician session delays are synchronized across reception and patient portals.
          </span>
        </div>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-blue-700 dark:text-blue-300"
        title="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
