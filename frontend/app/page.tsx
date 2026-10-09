"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Zap,
  AlertCircle,
  ClipboardPaste,
  Server,
  ChevronUp,
  RotateCcw,
} from "lucide-react"
import HeroSection from "@/components/hero-section"
import { useRouter } from "next/navigation"
import { useWebSocket, DEFAULT_SERVER_URL } from "@/lib/websocket"

const DEFAULT_USER_ID = "11111111-1111-4111-8111-111111111111"

export default function LandingPage() {
  const [token, setToken] = useState(DEFAULT_USER_ID)
  const [serverInput, setServerInput] = useState(DEFAULT_SERVER_URL)
  const [showCustomServer, setShowCustomServer] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { connect, error: wsError } = useWebSocket()

  useEffect(() => {
    const localUserId = localStorage.getItem("latestToken")
    if (localUserId) {
      setToken(localUserId)
    }
    const savedServer = localStorage.getItem("serverUrl")
    if (savedServer) {
      setServerInput(savedServer)
      if (savedServer !== DEFAULT_SERVER_URL) {
        setShowCustomServer(true)
      }
    }
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    if (id) setToken(id)
  }, [])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        setToken(text.trim())
        setError("")
      }
    } catch {
      // Clipboard access denied or unavailable
    }
  }

  const handleConnect = async () => {
    if (!token.trim()) {
      setError("Please enter your User ID Token.")
      return
    }

    setIsConnecting(true)
    setError("")

    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(token.trim())) {
        setError("Invalid User ID format. Please enter a valid UUID.")
        return
      }

      const customServer = showCustomServer
        ? serverInput.trim()
        : DEFAULT_SERVER_URL

      const success = await connect(token.trim(), customServer)

      if (success) {
        localStorage.setItem("latestToken", token.trim())
        localStorage.setItem("serverUrl", customServer)
        router.push("/dashboard")
      } else {
        setError(wsError || "Failed to connect to WebSocket")
      }
    } catch {
      setError("Failed to establish connection")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleConnect()
    }
  }

  return (
    <main className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div
        aria-hidden="true"
        className="site-bg pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero 3D */}
        <div className="h-[240px] sm:h-[280px] mt-0 mb-0 py-3.5 md:h-44">
          <HeroSection />
        </div>

        {/* Connection Form */}
        <div className="flex flex-col items-center mt-12 space-y-4">
          <Card className="w-full max-w-md border-neutral-800 bg-neutral-900/70 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Zap className="h-6 w-6 text-[#56FF0A]" />
                <span className="neonTitle text-[#56FF0A]">Live Connect</span>
              </CardTitle>
              <p className="text-xs text-neutral-400 mt-1">
                Real-Time Location &amp; Interactive Map Viewer
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="token"
                    className="text-sm font-semibold text-neutral-300"
                  >
                    User ID Token
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setToken(DEFAULT_USER_ID)
                      setError("")
                    }}
                    className="text-xs font-semibold text-[#56FF0A] hover:underline cursor-pointer"
                  >
                    Use Default ID
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Input
                    id="token"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-neutral-800/90 border-neutral-700 text-neutral-100 font-mono text-sm pr-10 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#56FF0A] focus:border-[#56FF0A]"
                    disabled={isConnecting}
                  />
                  <button
                    type="button"
                    title="Paste from clipboard"
                    onClick={handlePaste}
                    disabled={isConnecting}
                    className="absolute right-2.5 text-neutral-400 hover:text-[#56FF0A] transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </button>
                </div>

                {/* Custom / Local Server Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCustomServer(!showCustomServer)}
                  className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 pt-1 transition-colors cursor-pointer"
                >
                  {showCustomServer ? (
                    <ChevronUp className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <Server className="h-4 w-4 text-neutral-400" />
                  )}
                  <span>
                    {showCustomServer
                      ? "Hide server settings"
                      : "Configure custom / local server (optional)"}
                  </span>
                </button>

                {showCustomServer && (
                  <div className="relative flex items-center pt-1">
                    <Input
                      type="text"
                      placeholder="e.g. 192.168.1.15:8000 or wss://..."
                      value={serverInput}
                      onChange={(e) => setServerInput(e.target.value)}
                      disabled={isConnecting}
                      className="bg-neutral-800/90 border-neutral-700 text-neutral-100 font-mono text-xs pr-9 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#56FF0A]"
                    />
                    <button
                      type="button"
                      title="Reset to default server"
                      onClick={() => setServerInput(DEFAULT_SERVER_URL)}
                      className="absolute right-2.5 text-neutral-400 hover:text-[#56FF0A] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 border border-red-800/50 rounded-md p-2.5 mt-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleConnect}
                disabled={!token.trim() || isConnecting}
                className="w-full bg-[#56FF0A] text-neutral-950 hover:bg-[#51ef0a] active:scale-95 font-bold py-2.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            radial-gradient(
              700px 400px at 12% 18%,
              rgba(86, 255, 10, 0.06),
              transparent 60%
            ),
            radial-gradient(
              900px 600px at 88% 12%,
              rgba(86, 255, 10, 0.05),
              transparent 65%
            ),
            radial-gradient(rgba(86, 255, 10, 0.1) 1px, transparent 1px);
          background-size: auto, auto, 24px 24px;
          background-position: 0% 0%, 0% 0%, 0 0;
          animation: siteDrift 28s linear infinite alternate;
        }

        .neonTitle {
          text-shadow:
            0 0 4px rgba(86, 255, 10, 0.22),
            0 0 12px rgba(86, 255, 10, 0.15);
          animation: glowPulse 5.5s ease-in-out infinite;
        }

        @keyframes siteDrift {
          0% {
            background-position: 0% 0%, 0% 0%, 0 0;
          }
          100% {
            background-position: 4% 2%, -3% -2%, 24px 24px;
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            text-shadow:
              0 0 4px rgba(86, 255, 10, 0.22),
              0 0 12px rgba(86, 255, 10, 0.15);
          }
          50% {
            text-shadow:
              0 0 7px rgba(86, 255, 10, 0.35),
              0 0 18px rgba(86, 255, 10, 0.25);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .site-bg {
            animation: none;
          }
          .neonTitle {
            animation: none;
          }
        }
      `}</style>
    </main>
  )
}
