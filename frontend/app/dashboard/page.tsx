"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Globe2, MapPin, Navigation, Building2, Home, Route, MapPinned, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import HeroSection from "@/components/hero-section"
import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/lib/websocket"
import { reverseGeocode, generateGoogleMapsUrl, type LocationDetails } from "@/lib/geocoding"

type Detail = {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

// Loading component for when waiting for game info
function LoadingScreen() {
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

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Icon className="neonIcon h-6 w-6 text-[#56FF0A]" />
      <span className="neonTitle text-2xl sm:text-3xl font-extrabold text-[#56FF0A]">{children}</span>
      <style jsx>{`
  .neonTitle {
    text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
    animation: glowPulse 5.5s ease-in-out infinite;
  }
  .neonIcon {
    filter: drop-shadow(0 0 4px rgba(86, 255, 10, 0.22)) drop-shadow(0 0 12px rgba(86, 255, 10, 0.15));
    animation: glowPulse 5.5s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%, 100% {
      text-shadow: 0 0 4px rgba(86, 255, 10, 0.22), 0 0 12px rgba(86, 255, 10, 0.15);
      filter: drop-shadow(0 0 4px rgba(86, 255, 10, 0.22)) drop-shadow(0 0 12px rgba(86, 255, 10, 0.15));
    }
    50% {
      text-shadow: 0 0 7px rgba(86, 255, 10, 0.35), 0 0 18px rgba(86, 255, 10, 0.25);
      filter: drop-shadow(0 0 7px rgba(86, 255, 10, 0.35)) drop-shadow(0 0 18px rgba(86, 255, 10, 0.25));
    }
  }
`}</style>
    </div>
  )
}

function DetailTile({ label, value, icon: Icon }: Detail) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs sm:text-sm w-full">
        <Icon className="h-4 w-4 text-[#56FF0A]" />
        <span>{label}</span>
      </div>
      <div className="mt-2 font-mono text-neutral-200 text-xs sm:text-sm break-words leading-snug flex-grow flex items-center justify-center text-center">
        {value}
      </div>
    </div>
  )
}

function StatusTile({ connected, reconnecting }: { connected: boolean; reconnecting: boolean }) {
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

export default function DashboardPage() {
  const { isConnected, isReconnecting, locationData } = useWebSocket()
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({})
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [mapsUrl, setMapsUrl] = useState<string>("")

  useEffect(() => {
    if (locationData) {
      setIsLoadingLocation(true)
      reverseGeocode(locationData.lat, locationData.lng)
        .then((details) => {
          setLocationDetails(details)
          setMapsUrl(generateGoogleMapsUrl(locationData.lat, locationData.lng))
        })
        .finally(() => {
          setIsLoadingLocation(false)
        })
    }
  }, [locationData])

  // Show loading screen if no location data yet
  if (!locationData) {
    return <LoadingScreen />
  }

  // Enhanced details with richer Google Maps data
  const getLocationValue = (primary: string | undefined, fallback: string | undefined) => {
    return primary && primary !== "—" ? primary : (fallback && fallback !== "—" ? fallback : "—")
  }

  const details: Detail[] = [
    { label: "Country", value: locationDetails.country || "—", icon: Globe2 },
    { label: "State", value: locationDetails.state || "—", icon: MapPinned },
    { label: "County", value: locationDetails.county || "—", icon: Route },
    {
      label: "City",
      value: getLocationValue(locationDetails.city, locationDetails.town),
      icon: Building2
    },
    {
      label: "Area",
      value: getLocationValue(locationDetails.neighborhood, locationDetails.sublocality),
      icon: Home
    },
    {
      label: "Road",
      value: locationDetails.road || "—",
      icon: Navigation
    },
    { label: "Postcode", value: locationDetails.postcode || "—", icon: MapPin },
    {
      label: "Place",
      value: getLocationValue(locationDetails.locationName, locationDetails.premise),
      icon: Building2
    },
  ]

  const lat = locationData.lat
  const lng = locationData.lng
  const mapsHref = `https://www.google.com/maps?q=${lat},${lng}`

  // Fixed heights for header and content
  const headerHeight = "h-14 sm:h-16"
  const contentHeight = "h-[300px] sm:h-[380px]"

  return (
    <main className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div aria-hidden="true" className="site-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero 3D */}
        <div className="h-[260px] sm:h-[300px] mt-0 mb-0 py-3.5 md:h-44">
          <HeroSection />
        </div>

        {/* Main content */}
        <div id="content" className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8 mb-16">
          {/* Map View */}
          <Card className="border-neutral-800 bg-neutral-900/60">
            <CardHeader className={"relative flex items-center justify-center " + headerHeight}>
              <CardTitle className="text-neutral-100 text-center">
                <SectionTitle icon={Navigation}>{"Map View"}</SectionTitle>
              </CardTitle>
              <Button
                asChild
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md bg-[#56FF0A] text-neutral-900 hover:bg-[#51ef0a] border border-neutral-800 shadow-sm"
              >
                <a href={mapsHref} target="_blank" rel="noreferrer noopener" aria-label="Open in Google Maps">
                  {"Open Maps"}
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <div className={cn("flex flex-col", contentHeight)}>
                <div className={cn("relative flex-1 rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden")}>
                  {mapsUrl ? (
                    <iframe
                      src={mapsUrl}
                      width="100%"
                      height="100%"
                      style={{
                        border: 0,
                        overflow: 'hidden'
                      }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location Map"
                      className="w-full h-full"
                      allow="fullscreen"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <div className="flex flex-col items-center text-center">
                        <MapPin className="h-8 w-8" style={{ color: "#56FF0A" }} />
                        <p className="mt-4 text-neutral-200">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card className="border-neutral-800 bg-neutral-900/60">
            <CardHeader className={"relative flex items-center justify-center " + headerHeight}>
              <CardTitle className="text-neutral-100 text-center">
                <SectionTitle icon={Globe2}>{"Location Details"}</SectionTitle>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("flex flex-col", contentHeight)}>
                <div className="relative flex-1 rounded-lg border border-neutral-800 bg-neutral-900 p-4 overflow-hidden">
                  {isLoadingLocation ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#56FF0A]" />
                        <p className="mt-4 text-neutral-200">Loading location details...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-full auto-rows-[minmax(0,1fr)] grid-cols-1 sm:grid-cols-3 gap-4">
                      {details.slice(0, 8).map((d, i) => (
                        <DetailTile key={i} {...d} />
                      ))}
                      <StatusTile connected={isConnected} reconnecting={isReconnecting} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-neutral-800">
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
  @keyframes siteDrift {
    0%   { background-position: 0% 0%, 0% 0%, 0 0; }
    100% { background-position: 4% 2%, -3% -2%, 24px 24px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .site-bg { animation: none; }
  }
`}</style>
    </main>
  )
}
