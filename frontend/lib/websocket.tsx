"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

export const DEFAULT_SERVER_URL = "wss://georesolver.0x978.com/ws"

export function normalizeServerUrl(rawInput?: string | null): string {
  let trimmed = (rawInput || "").trim()
  if (!trimmed) {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "ws://localhost:8000/ws"
    }
    return DEFAULT_SERVER_URL
  }
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1)
  }
  if (!trimmed.startsWith("ws://") && !trimmed.startsWith("wss://")) {
    if (trimmed.startsWith("https://")) {
      trimmed = `wss://${trimmed.slice(8)}`
    } else if (trimmed.startsWith("http://")) {
      trimmed = `ws://${trimmed.slice(7)}`
    } else if (!trimmed.includes(":") && !trimmed.includes(".com")) {
      trimmed = `ws://${trimmed}:8000`
    } else {
      trimmed = `ws://${trimmed}`
    }
  }
  if (!trimmed.endsWith("/ws")) {
    trimmed = `${trimmed}/ws`
  }
  return trimmed
}

interface LocationData {
  lat: number
  lng: number
  timestamp: number
  sessionId: string
}

interface WebSocketContextType {
  connect: (sessionId: string, customServerUrl?: string) => Promise<boolean>
  disconnect: () => void
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  locationData: LocationData | null
  error: string | null
  serverUrl: string
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }

  return context
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SERVER_URL)
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const serverUrlRef = useRef<string>(DEFAULT_SERVER_URL)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Clear reconnect timer
  const clearTimers = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // Auto-reconnect function
  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setIsReconnecting(false)
      setError('Connection lost. Please refresh the page.')
      return
    }

    if (isConnected || isConnecting) {
      return
    }

    setIsReconnecting(true)
    const delay = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 45000)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (sessionIdRef.current && !isConnected && !isConnecting) {
        reconnectAttemptsRef.current++
        void connect(sessionIdRef.current, serverUrlRef.current)
      } else {
        setIsReconnecting(false)
      }
    }, delay)
  }

  const connect = async (sessionId: string, customServerUrl?: string): Promise<boolean> => {
    if (isConnecting || isConnected) {
      return isConnected
    }

    setIsConnecting(true)
    setError(null)
    sessionIdRef.current = sessionId
    const resolvedServer = normalizeServerUrl(customServerUrl)
    serverUrlRef.current = resolvedServer
    setServerUrl(resolvedServer)
    clearTimers()

    try {
      const ws = new WebSocket(`${resolvedServer}/${sessionId}`)
      wsRef.current = ws

      return new Promise((resolve) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        ws.onopen = () => {
          setIsConnected(true)
          setIsConnecting(false)
          setIsReconnecting(false)
          reconnectAttemptsRef.current = 0

          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }

          resolve(true)
        }

        ws.onmessage = (event) => {
          try {
            const data: LocationData = JSON.parse(event.data)
            setLocationData(data)
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onclose = (event) => {
          setIsConnected(false)
          setIsConnecting(false)
          wsRef.current = null
          clearTimers()

          if (
            sessionIdRef.current &&
            event.code !== 1000 &&
            !isReconnecting &&
            (event.code === 1006 || event.code === 1005 || event.code === 1001)
          ) {
            attemptReconnect()
          }
        }

        ws.onerror = () => {
          setError(`Failed to connect to server (${resolvedServer})`)
          setIsConnecting(false)
          clearTimers()
          resolve(false)
        }

        timeoutId = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            setError('Connection timeout')
            setIsConnecting(false)
            ws.close()
            resolve(false)
          }
        }, 10000)
      })
    } catch {
      setError('Failed to create WebSocket connection')
      setIsConnecting(false)
      clearTimers()
      return false
    }
  }

  const disconnect = () => {
    clearTimers()
    reconnectAttemptsRef.current = 0

    if (wsRef.current) {
      wsRef.current.close(1000)
      wsRef.current = null
    }
    setIsConnected(false)
    setIsReconnecting(false)
    setLocationData(null)
    sessionIdRef.current = null
    setError(null)
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <WebSocketContext.Provider
      value={{
        connect,
        disconnect,
        isConnected,
        isConnecting,
        isReconnecting,
        locationData,
        error,
        serverUrl,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
