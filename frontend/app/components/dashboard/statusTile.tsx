import {CheckCircle2, Loader2, XCircle} from "lucide-react";
import type React from "react";

export default function StatusTile({ connected, reconnecting }: { connected: boolean; reconnecting: boolean }) {
    let Icon = XCircle
    let statusText = "Offline"
    let statusColor = "#ef4444"

    if (reconnecting) {
        Icon = Loader2
        statusText = "Reconnecting"
        statusColor = "#f59e0b"
    } else if (connected) {
        Icon = CheckCircle2
        statusText = "Online"
        statusColor = "#56FF0A"
    }

    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs sm:text-sm">
                <Icon
                    className={`h-4 w-4 ${reconnecting ? 'animate-spin' : ''}`}
                    style={{ color: statusColor }}
                />
                <span>Status</span>
            </div>
            <div className="mt-2 font-mono text-neutral-200 text-xs sm:text-sm break-words leading-snug flex-grow flex items-center justify-center">
        <span
            className="font-bold transition-all duration-300 ease-in-out"
            style={{
                color: statusColor,
                textShadow: connected
                    ? "0 0 8px rgba(86, 255, 10, 0.4)"
                    : reconnecting
                        ? "0 0 8px rgba(245, 158, 11, 0.4)"
                        : "0 0 8px rgba(239, 68, 68, 0.4)",
            }}
        >
          {statusText}
        </span>
            </div>
        </div>
    )
}