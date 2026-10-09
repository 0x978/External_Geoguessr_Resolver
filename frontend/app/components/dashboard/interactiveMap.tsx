"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  Globe2,
  Flag,
  Building2,
  Crosshair,
  Plus,
  Minus,
  LocateFixed,
} from "lucide-react"

export interface MapStyleOption {
  id: string
  label: string
  urlTemplate: string
}

export const MAP_STYLES: MapStyleOption[] = [
  {
    id: "voyager",
    label: "Clean HD",
    urlTemplate:
      "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
  },
  {
    id: "osm",
    label: "Streets",
    urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  {
    id: "satellite",
    label: "Satellite",
    urlTemplate:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
  {
    id: "dark",
    label: "Dark",
    urlTemplate: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
  },
]

interface LeafletMapInstance {
  setView: (
    center: [number, number],
    zoom: number,
    options?: { animate?: boolean }
  ) => void
  getZoom: () => number
  getCenter: () => { lat: number; lng: number }
  remove: () => void
  invalidateSize: () => void
  on: (event: string, handler: () => void) => void
}

interface LeafletTileLayerInstance {
  setUrl: (url: string) => void
  addTo: (map: LeafletMapInstance) => LeafletTileLayerInstance
}

interface LeafletMarkerInstance {
  setLatLng: (latLng: [number, number]) => void
  setIcon: (icon: unknown) => void
  addTo: (map: LeafletMapInstance) => LeafletMarkerInstance
}

interface LeafletGlobal {
  map: (
    el: HTMLElement,
    opts: Record<string, unknown>
  ) => LeafletMapInstance
  tileLayer: (
    url: string,
    opts?: Record<string, unknown>
  ) => LeafletTileLayerInstance
  marker: (
    latLng: [number, number],
    opts?: Record<string, unknown>
  ) => LeafletMarkerInstance
  divIcon: (opts: Record<string, unknown>) => unknown
}

declare global {
  interface Window {
    L?: LeafletGlobal
  }
}

interface InteractiveMapProps {
  lat: number
  lng: number
  pinLabel: string
  styleIndex: number
  isFullScreen?: boolean
}

export default function InteractiveMap({
  lat,
  lng,
  pinLabel,
  styleIndex,
  isFullScreen = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMapInstance | null>(null)
  const tileLayerRef = useRef<LeafletTileLayerInstance | null>(null)
  const markerRef = useRef<LeafletMarkerInstance | null>(null)
  const [currentZoom, setCurrentZoom] = useState<number>(6)
  const [leafletReady, setLeafletReady] = useState<boolean>(false)

  const createBullseyeIcon = useCallback(
    (L: LeafletGlobal, labelText: string) => {
      const safeLabel = labelText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

      const labelHtml = safeLabel
        ? `<div style="margin-bottom:4px;padding:2px 8px;background:rgba(0,0,0,0.85);border:1px solid rgba(86,255,10,0.75);border-radius:6px;color:#56FF0A;font-size:11px;font-weight:800;white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,0.6);">${safeLabel}</div>`
        : ""

      return L.divIcon({
        className: "georesolver-bullseye-pin",
        iconSize: [180, 80],
        iconAnchor: [90, 56],
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:180px;height:74px;pointer-events:none;">
            ${labelHtml}
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,82,82,0.18);border:2.5px solid #ff5252;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
              <div style="width:10px;height:10px;border-radius:50%;background:#56FF0A;border:1.5px solid #000;"></div>
            </div>
          </div>
        `,
      })
    },
    []
  )

  // Load Leaflet CSS & JS from CDN once
  useEffect(() => {
    if (typeof window === "undefined") return

    if (!document.getElementById("leaflet-css-cdn")) {
      const link = document.createElement("link")
      link.id = "leaflet-css-cdn"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    if (window.L) {
      setLeafletReady(true)
      return
    }

    const existingScript = document.getElementById(
      "leaflet-js-cdn"
    ) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletReady(true))
      return
    }

    const script = document.createElement("script")
    script.id = "leaflet-js-cdn"
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => setLeafletReady(true)
    document.body.appendChild(script)
  }, [])

  // Initialize Leaflet map instance
  useEffect(() => {
    if (!leafletReady || !containerRef.current || !window.L) return
    if (mapRef.current) return

    const L = window.L
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    })

    const layer = L.tileLayer(MAP_STYLES[styleIndex].urlTemplate, {
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([lat, lng], {
      icon: createBullseyeIcon(L, pinLabel),
    }).addTo(map)

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom())
    })

    mapRef.current = map
    tileLayerRef.current = layer
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady])

  // Update coordinates when round changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !window.L) return
    markerRef.current.setLatLng([lat, lng])
    markerRef.current.setIcon(createBullseyeIcon(window.L, pinLabel))
    mapRef.current.setView([lat, lng], mapRef.current.getZoom(), {
      animate: true,
    })
  }, [lat, lng, pinLabel, createBullseyeIcon])

  // Update marker label when geocoding completes
  useEffect(() => {
    if (!markerRef.current || !window.L) return
    markerRef.current.setIcon(createBullseyeIcon(window.L, pinLabel))
  }, [pinLabel, createBullseyeIcon])

  // Update map tile style when switched
  useEffect(() => {
    if (!tileLayerRef.current) return
    const style = MAP_STYLES[styleIndex] || MAP_STYLES[0]
    tileLayerRef.current.setUrl(style.urlTemplate)
  }, [styleIndex])

  // Invalidate map size when toggling fullscreen
  useEffect(() => {
    if (!mapRef.current) return
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [isFullScreen])

  const setZoomPreset = (targetZoom: number) => {
    setCurrentZoom(targetZoom)
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], targetZoom, { animate: true })
    }
  }

  const zoomBy = (delta: number) => {
    if (!mapRef.current) return
    const nextZoom = Math.min(
      18,
      Math.max(2, Math.round(mapRef.current.getZoom() + delta))
    )
    setCurrentZoom(nextZoom)
    const center = mapRef.current.getCenter()
    mapRef.current.setView([center.lat, center.lng], nextZoom, {
      animate: true,
    })
  }

  const recenterOnPin = () => {
    if (!mapRef.current) return
    mapRef.current.setView([lat, lng], mapRef.current.getZoom(), {
      animate: true,
    })
  }

  const presets = [
    { label: "World", zoom: 3, icon: Globe2 },
    { label: "Country", zoom: 6, icon: Flag },
    { label: "Region", zoom: 11, icon: Building2 },
    { label: "5K Pin", zoom: 16, icon: Crosshair },
  ]

  return (
    <div className="relative w-full h-full select-none bg-neutral-900">
      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Right-Side Floating Controls (Center + Zoom In/Out) */}
      <div className="absolute right-3 bottom-16 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={recenterOnPin}
          title="Center on Pin"
          className="w-10 h-10 rounded-xl bg-[#56FF0A] text-neutral-950 border border-[#56FF0A] shadow-lg flex items-center justify-center hover:bg-[#4ce609] active:scale-95 transition-all cursor-pointer"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(2)}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-neutral-900/95 text-[#56FF0A] border border-neutral-700 shadow-lg flex items-center justify-center hover:border-[#56FF0A] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-2)}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-neutral-900/95 text-[#56FF0A] border border-neutral-700 shadow-lg flex items-center justify-center hover:border-[#56FF0A] active:scale-95 transition-all cursor-pointer"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom 1-Tap Quick Zoom Preset Bar */}
      <div className="absolute left-2.5 right-2.5 bottom-2.5 z-[400] bg-neutral-900/95 border border-neutral-800 rounded-xl p-1.5 shadow-xl flex items-center gap-1.5">
        {presets.map((preset) => {
          const Icon = preset.icon
          const isSelected = Math.abs(currentZoom - preset.zoom) < 1.6
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setZoomPreset(preset.zoom)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#56FF0A] text-neutral-950 border-[#56FF0A]"
                  : "bg-neutral-800/90 text-neutral-100 border-neutral-700 hover:border-neutral-600"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isSelected ? "text-neutral-950" : "text-[#56FF0A]"
                }`}
              />
              <span>{preset.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
