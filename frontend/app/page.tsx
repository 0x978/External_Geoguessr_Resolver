"use client"

import React, {useEffect} from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, AlertCircle } from "lucide-react"
import HeroSection from "@/components/hero-section"
import { useRouter } from "next/navigation"
import { useWebSocket } from "@/lib/websocket"

export default function LandingPage() {
  const [token, setToken] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { connect, error: wsError } = useWebSocket()

  useEffect(() => {
    // Set to stored token if user has visited before.
    const localUserId = localStorage.getItem("latestToken");
    if (localUserId) {
      setToken(localUserId)
    }
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    if (id) setToken(id)
  }, [])

  const handleConnect = async () => {
    if (!token.trim()) return

    setIsConnecting(true)
    setError("")

    try {
      // Validate session ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(token.trim())) {
        setError("Invalid session ID format. Please enter a valid UUID.")
        return
      }

      const success = await connect(token.trim())

      if (success) {
        router.push("/dashboard")
        localStorage.setItem("latestToken", token);
      }
      else {
        setError(wsError || "Failed to connect to WebSocket")
      }
    }
    catch (error) {
      console.error("Error connecting:", error)
      setError("Failed to establish connection")
    }
    finally {
      setIsConnecting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleConnect()
    }
  }

  return (
    <main className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div aria-hidden="true" className="site-bg pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero 3D */}
        <div className="h-[260px] sm:h-[300px] mt-0 mb-0 py-3.5 md:h-44">
          <HeroSection />
        </div>

        {/* Connection Form */}
        <div className="flex flex-col items-center mt-16 space-y-4">

          {/* Permanent ID note */}
          <div className="max-w-md text-center text-sm text-neutral-400">
            <span className="text-[#56FF0A] font-semibold">Heads up:</span>{" "}
            Your User ID is <span className="text-neutral-200 font-bold">permanent</span>.
            Please note it down or keep it safe — you’ll use it to reconnect later.<br/> <br/>
            If you do ever lose your ID, press F9 on while on Geoguessr.com to retrieve it.
          </div>

          <Card className="w-full max-w-md border-neutral-800 bg-neutral-900/60">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Zap className="h-6 w-6 text-[#56FF0A]" />
                <span className="neonTitle text-[#56FF0A]">Live Connect</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium text-neutral-300">
                  User ID Token
                </label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter your token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:border-neutral-700 outline-none"
                  disabled={isConnecting}
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleConnect}
                disabled={!token.trim() || isConnecting}
                className="w-full bg-[#56FF0A] text-neutral-900 hover:bg-[#51ef0a] active:scale-95 font-semibold py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-neutral-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-neutral-400">
            {"Made by "}
            <a
              href="https://github.com/0x978"
              target="_blank"
              rel="noreferrer"
              className="text-[#56FF0A] hover:underline focus:underline"
            >
              {"0x978"}
            </a>{" "}
            {"🪐"}
          </div>
        </footer>
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

        .neonTitle {
          text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
          animation: glowPulse 5.5s ease-in-out infinite;
        }

        @keyframes siteDrift {
          0%   { background-position: 0% 0%, 0% 0%, 0 0; }
          100% { background-position: 4% 2%, -3% -2%, 24px 24px; }
        }

        @keyframes glowPulse {
          0%, 100% {
            text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
          }
          50% {
            text-shadow: 0 0 7px rgba(86, 255, 10, 0.35), 0 0 18px rgba(86, 255, 10, 0.25);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .site-bg { animation: none; }
          .neonTitle { animation: none; }
        }
      `}</style>
    </main>
  )
}
