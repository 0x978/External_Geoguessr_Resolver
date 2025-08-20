"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Globe2, MapPin, Navigation, Building2, Home, Route, MapPinned, Loader2 } from "lucide-react"
import HeroSection from "@/components/hero-section"
import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/lib/websocket"
import { reverseGeocode, generateGoogleMapsUrl, type LocationDetails } from "@/lib/geocoding"
import {useRouter} from "next/navigation";
import {Detail} from "@/app/types/Detail";
import LoadingScreen from "@/app/components/dashboard/loadingScreen";
import StatusTile from "@/app/components/dashboard/statusTile";
import SectionTitle from "@/app/components/dashboard/sectionTitle";
import DetailTile from "@/app/components/dashboard/detailTile";
import Link from "next/link";

export default function DashboardPage() {
  const { isConnected, isReconnecting, locationData, connect } = useWebSocket()
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({})
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [mapsUrl, setMapsUrl] = useState<string>("")
  const router = useRouter()

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

    if (!isConnected) { // If user refreshes page - can we still retrieve latest token?
      const latestToken = localStorage.getItem("latestToken")
      if (latestToken)
        void connect(latestToken)
      else
        router.push("/")
    }

  }, [locationData, connect, isConnected, router])

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

  const headerHeight = "h-12 sm:h-16"
  const contentHeight = "h-auto sm:h-[380px]"
  const mapContentHeight = "h-[35vh] sm:h-[380px]"

  return (
      <main className="relative min-h-screen bg-neutral-950 text-neutral-100">
        <div aria-hidden="true" className="site-bg pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Hero 3D */}
          <div className="mt-0 mb-2 sm:mb-0 h-48 sm:h-[300px] py-2 sm:py-3.5 md:h-44">
            <HeroSection />
          </div>

          {/* Main content */}
          <div id="content" className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mt-4 sm:mt-8 mb-6 sm:mb-8">

            {/* Map View */}
            <Card className="border-neutral-800 bg-neutral-900/60">
              <CardHeader className={"relative flex items-center justify-start sm:justify-center " + headerHeight}>
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
                <div className={cn("flex flex-col", mapContentHeight)}>
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
              <CardHeader
                  className={cn("relative items-center justify-center px-4 py-3 sm:px-6 sm:py-4", headerHeight)}>
                <CardTitle className="text-neutral-100 text-center text-base sm:text-lg">
                  <SectionTitle icon={Globe2}>{"Location Details"}</SectionTitle>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className={cn("flex flex-col", contentHeight)}>
                  <div
                      className="relative rounded-lg border border-neutral-800 bg-neutral-900 p-3 sm:p-4 overflow-hidden">
                    {isLoadingLocation ? (
                        <div className="flex items-center justify-center h-40 sm:h-full">
                          <div className="flex flex-col items-center text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#56FF0A]" />
                            <p className="mt-3 text-sm sm:text-base text-neutral-200">Loading location details...</p>
                          </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          {details.slice(0, 8).map((d, i) => (
                              <DetailTile key={i} {...d} />
                          ))}
                          <div className="col-span-2 sm:col-span-1">
                            <StatusTile connected={isConnected} reconnecting={isReconnecting}/>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Return Button */}
          <div className="flex justify-center mt-2 mb-2 px-2">
            <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-10 px-5 rounded-md bg-[#56FF0A] text-neutral-900 hover:bg-[#51ef0a] border border-neutral-800 shadow-md text-base sm:text-sm font-medium"
            >
              <Link href="/" aria-label="Return Home">
                {"Return"}
              </Link>
            </Button>
          </div>

          {/* Footer */}
          <footer className="mt-4 sm:mt-6 border-t border-neutral-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center text-xs sm:text-sm text-neutral-400">
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
        @media (max-width: 640px) {
          .site-bg { opacity: 0.12; }
        }
      `}</style>
      </main>
  )
}
