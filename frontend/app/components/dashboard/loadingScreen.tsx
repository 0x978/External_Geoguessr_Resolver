"use client"

import { Loader2 } from "lucide-react"
import React from "react"

export default function LoadingScreen() {
    return (
        <main className="relative min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
            <div aria-hidden="true" className="site-bg pointer-events-none absolute inset-0 -z-10" />
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#56FF0A] mb-4" />
                <h2 className="text-2xl font-bold text-[#56FF0A] mb-2">Waiting for game info</h2>
                <p className="text-neutral-400">Listening for location data...</p>
            </div>
            <style jsx>{`
        .site-bg {
          opacity: 0.18;
          background-image:
            radial-gradient(700px 400px at 12% 18%, rgba(86, 255, 10, 0.06), transparent 60%),
            radial-gradient(900px 600px at 88% 12%, rgba(86, 255, 10, 0.05), transparent 65%),
            radial-gradient(rgba(86,255,10,0.10) 1px, transparent 1px);
          background-size: auto, auto, 24px 24px;
          background-position: 0% 0%, 0% 0%, 0 0;
          animation: siteDrift 28s linear infinite alternate;
        }
        @keyframes siteDrift {
          0%   { background-position: 0% 0%, 0% 0%, 0 0; }
          100% { background-position: 4% 2%, -3% -2%, 24px 24px; }
        }
      `}</style>
        </main>
    )
}
