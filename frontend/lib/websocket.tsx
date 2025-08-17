"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

interface LocationData {
  lat: number
  lng: number
  timestamp: number
  sessionId: string
}

interface WebSocketContextType {
  connect: (sessionId: string) => Promise<boolean>
  disconnect: () => void
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  locationData: LocationData | null
  error: string | null
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
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
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
      console.log('Max reconnection attempts reached')
      setIsReconnecting(false)
      setError('Connection lost. Please refresh the page.')
      return
    }

    // Don't reconnect if already connected or connecting
    if (isConnected || isConnecting) {
      console.log('Skipping reconnect - already connected or connecting')
      return
    }

    setIsReconnecting(true)
    // More conservative backoff: start at 3 seconds
    const delay = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 45000) // Conservative backoff, max 45s
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (sessionIdRef.current && !isConnected && !isConnecting) {
        reconnectAttemptsRef.current++
        connect(sessionIdRef.current)
      } else {
        setIsReconnecting(false)
      }
    }, delay)
  }

  const connect = async (sessionId: string): Promise<boolean> => {
    if (isConnecting || isConnected) {
      return false
    }

    setIsConnecting(true)
    setError(null)
    sessionIdRef.current = sessionId
    clearTimers()

    try {
      const wsString = window.location.hostname === 'localhost'
          ? "ws://localhost:8000/ws"
          : "wss://georesolver.0x978.com/ws"
      const ws = new WebSocket(`${wsString}/${sessionId}`)
      wsRef.current = ws

      return new Promise((resolve) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          setIsConnecting(false)
          setIsReconnecting(false)
          reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection

          // Clear connection timeout
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }

          resolve(true)
        }

        ws.onmessage = (event) => {
          try {
            const data: LocationData = JSON.parse(event.data)
            console.log('Received location data:', data)
            setLocationData(data)
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

                ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason)
          setIsConnected(false)
          setIsConnecting(false)
          wsRef.current = null
          clearTimers()

          // Only attempt reconnection if:
          // 1. We had a session
          // 2. It wasn't a manual disconnect (1000)
          // 3. We're not already reconnecting
          // 4. It wasn't a connection timeout/rejection
          if (sessionIdRef.current &&
              event.code !== 1000 &&
              !isReconnecting &&
              (event.code === 1006 || event.code === 1005 || event.code === 1001)) {
            console.log('Connection lost, attempting to reconnect...')
            attemptReconnect()
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setError('Failed to connect to WebSocket')
          setIsConnecting(false)
          clearTimers()
          resolve(false)
        }

        // Set a timeout to reject if connection doesn't succeed
        timeoutId = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket connection timeout')
            setError('Connection timeout')
            setIsConnecting(false)
            ws.close()
            resolve(false)
          }
        }, 10000) // 10 seconds
      })
    } catch (err) {
      console.error('Error creating WebSocket:', err)
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
      wsRef.current.close(1000) // Manual closure
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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
