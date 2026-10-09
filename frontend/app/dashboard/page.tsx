"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Globe2,
  MapPin,
  Navigation,
  Building2,
  Home,
  Route,
  MapPinned,
  Loader2,
  Flag,
  Copy,
  Layers,
  Maximize2,
  Minimize2,
  ExternalLink,
  Check,
} from "lucide-react"
import HeroSection from "@/components/hero-section"
import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/lib/websocket"
import { reverseGeocode, type LocationDetails } from "@/lib/geocoding"
import { useRouter } from "next/navigation"
import { Detail } from "@/app/types/Detail"
import LoadingScreen from "@/app/components/dashboard/loadingScreen"
import StatusTile from "@/app/components/dashboard/statusTile"
import SectionTitle from "@/app/components/dashboard/sectionTitle"
import DetailTile from "@/app/components/dashboard/detailTile"
import InteractiveMap, {
  MAP_STYLES,
} from "@/app/components/dashboard/interactiveMap"
import Link from "next/link"

export default function DashboardPage() {
  const { isConnected, isReconnecting, locationData, connect } = useWebSocket()
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({})
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [styleIndex, setStyleIndex] = useState(0)
  const [isFullScreenMap, setIsFullScreenMap] = useState(false)
  const [copiedToast, setCopiedToast] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (locationData) {
      setIsLoadingLocation(true)
      reverseGeocode(locationData.lat, locationData.lng)
        .then((details) => {
          setLocationDetails(details)
        })
        .finally(() => {
          setIsLoadingLocation(false)
        })
    }

    if (!isConnected) {
      const latestToken = localStorage.getItem("latestToken")
      const savedServer = localStorage.getItem("serverUrl") || undefined
      if (latestToken) {
        void connect(latestToken, savedServer)
      } else {
        router.push("/")
      }
    }
  }, [locationData, connect, isConnected, router])

  if (!locationData) {
    return <LoadingScreen />
  }

  const getLocationValue = (
    primary: string | undefined,
    fallback: string | undefined
  ) => {
    return primary && primary !== "—"
      ? primary
      : fallback && fallback !== "—"
        ? fallback
        : "—"
  }

  const displayCity = getLocationValue(
    locationDetails.city,
    getLocationValue(locationDetails.town, locationDetails.village)
  )
  const displayArea = getLocationValue(
    locationDetails.neighborhood,
    locationDetails.sublocality
  )
  const displayPlace = getLocationValue(
    locationDetails.locationName,
    locationDetails.premise
  )

  const details: Detail[] = [
    {
      label: "Country",
      value: locationDetails.country || "—",
      icon: Globe2,
    },
    {
      label: "State / Region",
      value: locationDetails.state || "—",
      icon: MapPinned,
    },
    { label: "County", value: locationDetails.county || "—", icon: Route },
    {
      label: "City / Town",
      value: displayCity,
      icon: Building2,
    },
    {
      label: "Area",
      value: displayArea,
      icon: Home,
    },
    {
      label: "Road",
      value: locationDetails.road || "—",
      icon: Navigation,
    },
    {
      label: "Postcode",
      value: locationDetails.postcode || "—",
      icon: MapPin,
    },
    {
      label: "Place",
      value: displayPlace,
      icon: Building2,
    },
  ]

  const lat = locationData.lat
  const lng = locationData.lng
  const mapsHref = `https://www.google.com/maps?q=${lat},${lng}`
  const currentStyle = MAP_STYLES[styleIndex] || MAP_STYLES[0]

  const countryHeadline =
    locationDetails.country && locationDetails.country !== "—"
      ? locationDetails.country
      : "Locating..."

  const cityStateSubline = [
    displayCity !== "—" ? displayCity : null,
    locationDetails.state && locationDetails.state !== "—"
      ? locationDetails.state
      : null,
  ]
    .filter(Boolean)
    .join(" • ")

  const roadSubline =
    locationDetails.road && locationDetails.road !== "—"
      ? locationDetails.road
      : ""

  const pinLabel = [
    displayCity !== "—" ? displayCity : null,
    locationDetails.country && locationDetails.country !== "—"
      ? locationDetails.country
      : null,
  ]
    .filter(Boolean)
    .join(", ")

  const handleCopy = async (label: string, text: string) => {
    if (!text || text === "—") return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToast(`Copied ${label}: ${text}`)
      setTimeout(() => {
        setCopiedToast(null)
      }, 2000)
    } catch {
      // Clipboard unavailable
    }
  }

  const cycleMapStyle = () => {
    setStyleIndex((prev) => (prev + 1) % MAP_STYLES.length)
  }

  // Fullscreen Map Overlay Mode
  if (isFullScreenMap) {
    const summaryText = [
      locationDetails.country !== "—" ? locationDetails.country : null,
      displayCity !== "—" ? displayCity : null,
      locationDetails.road !== "—" ? locationDetails.road : null,
    ]
      .filter(Boolean)
      .join(" • ")

    return (
      <main className="fixed inset-0 z-50 bg-neutral-950 text-neutral-100 flex flex-col">
        <div className="relative flex-1 w-full h-full">
          <InteractiveMap
            lat={lat}
            lng={lng}
            pinLabel={pinLabel}
            styleIndex={styleIndex}
            isFullScreen
          />

          {/* Top Floating Bar in Fullscreen */}
          <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between gap-3 bg-neutral-900/95 border border-[#56FF0A]/50 rounded-2xl px-4 py-2.5 shadow-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <Flag className="w-5 h-5 text-[#56FF0A] shrink-0" />
              <span className="font-extrabold text-sm sm:text-base text-white truncate">
                {summaryText || "Live Round Location"}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cycleMapStyle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-white hover:border-[#56FF0A] transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#56FF0A]" />
                <span>{currentStyle.label}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenMap(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#56FF0A] text-neutral-950 text-xs font-extrabold hover:bg-[#4ce609] transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-neutral-950 text-neutral-100">
      <div
        aria-hidden="true"
        className="site-bg pointer-events-none absolute inset-0 -z-10"
      />

      {/* Copy Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-neutral-900 border border-[#56FF0A] text-[#56FF0A] px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-bold">
          <Check className="w-4 h-4" />
          <span>{copiedToast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Hero 3D */}
        <div className="mt-0 mb-3 h-40 sm:h-44 py-2">
          <HeroSection />
        </div>

        {/* 1. Instant Top Hero Location Banner */}
        <div className="mt-2 mb-5 rounded-2xl border border-[#56FF0A]/40 bg-gradient-to-r from-[#56FF0A]/10 via-neutral-900/90 to-neutral-900/90 p-4 sm:px-6 sm:py-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-xl bg-[#56FF0A]/15 border border-[#56FF0A]/40 shrink-0">
              <Flag className="w-6 h-6 sm:w-7 sm:h-7 text-[#56FF0A]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-[#56FF0A] uppercase truncate">
                {countryHeadline}
              </h2>
              {cityStateSubline && (
                <p className="text-sm sm:text-base font-semibold text-neutral-100 truncate">
                  {cityStateSubline}
                </p>
              )}
              {roadSubline && (
                <p className="text-xs sm:text-sm text-neutral-400 truncate">
                  {roadSubline}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  "Coordinates",
                  `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                )
              }
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800/90 border border-neutral-700 hover:border-[#56FF0A] text-xs sm:text-sm font-mono text-neutral-200 transition-colors cursor-pointer"
              title="Copy exact coordinates"
            >
              <Copy className="w-4 h-4 text-[#56FF0A]" />
              <span>
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </button>

            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#56FF0A] text-neutral-950 hover:bg-[#4ce609] text-xs sm:text-sm font-extrabold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Google Maps</span>
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div
          id="content"
          className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6 sm:mb-8"
        >
          {/* 2. Upgraded Interactive Map Card */}
          <Card className="border-neutral-800 bg-neutral-900/70 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 sm:px-5 border-b border-neutral-800/80">
              <CardTitle className="text-neutral-100">
                <SectionTitle icon={Navigation}>{"Map View"}</SectionTitle>
              </CardTitle>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cycleMapStyle}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-[#56FF0A] text-xs font-bold text-neutral-100 transition-colors cursor-pointer"
                  title="Switch map layer style"
                >
                  <Layers className="w-3.5 h-3.5 text-[#56FF0A]" />
                  <span>{currentStyle.label}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullScreenMap(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#56FF0A]/15 border border-[#56FF0A]/50 hover:bg-[#56FF0A]/25 text-xs font-bold text-[#56FF0A] transition-colors cursor-pointer"
                  title="Expand map to fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="h-[420px] sm:h-[440px] w-full">
                <InteractiveMap
                  lat={lat}
                  lng={lng}
                  pinLabel={pinLabel}
                  styleIndex={styleIndex}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Location Details Card */}
          <Card className="border-neutral-800 bg-neutral-900/70">
            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 sm:px-5 border-b border-neutral-800/80">
              <CardTitle className="text-neutral-100">
                <SectionTitle icon={Globe2}>{"Location Details"}</SectionTitle>
              </CardTitle>
              <span className="text-xs text-neutral-400">
                Click any tile to copy
              </span>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 sm:p-4 min-h-[395px] flex flex-col justify-center">
                {isLoadingLocation ? (
                  <div className="flex items-center justify-center h-60">
                    <div className="flex flex-col items-center text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#56FF0A]" />
                      <p className="mt-3 text-sm sm:text-base text-neutral-200">
                        Loading location details...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                    {details.slice(0, 8).map((d, i) => (
                      <div
                        key={i}
                        onClick={() => handleCopy(d.label, d.value)}
                        className="cursor-pointer transition-transform active:scale-95 hover:brightness-110"
                        title={`Click to copy ${d.label}`}
                      >
                        <DetailTile {...d} />
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-1">
                      <StatusTile
                        connected={isConnected}
                        reconnecting={isReconnecting}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Return Button */}
        <div className="flex justify-center mt-2 mb-2 px-2">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#56FF0A] text-neutral-950 hover:bg-[#51ef0a] border border-neutral-800 shadow-md text-sm font-extrabold"
          >
            <Link href="/" aria-label="Return Home">
              {"Return to Connect"}
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-neutral-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-center text-xs sm:text-sm text-neutral-400">
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
    </main>
  )
}
