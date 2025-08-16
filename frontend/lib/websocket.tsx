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
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Clear all timers
  const clearTimers = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // Start keep-alive ping
  const startKeepAlive = () => {
    clearTimers()
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send('ping')
        } catch (error) {
          console.error('Failed to send ping:', error)
        }
      }
    }, 30000) // Send ping every 30 seconds
  }

  // Auto-reconnect function
  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      setIsReconnecting(false)
      setError('Connection lost. Please refresh the page.')
      return
    }

    setIsReconnecting(true)
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff, max 30s
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (sessionIdRef.current) {
        reconnectAttemptsRef.current++
        connect(sessionIdRef.current)
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
      const ws = new WebSocket(`wss://georesolver.0x978.com/ws/${sessionId}`)
      wsRef.current = ws

      return new Promise((resolve) => {
        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          setIsConnecting(false)
          setIsReconnecting(false)
          reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection
          startKeepAlive() // Start sending ping messages
          resolve(true)
        }

        ws.onmessage = (event) => {
          try {
            // Handle pong responses from server
            if (event.data === 'pong') {
              console.log('Received pong from server')
              return
            }

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
          
          // Only attempt reconnection if we had a session and it wasn't a manual disconnect
          if (sessionIdRef.current && event.code !== 1000) {
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
        setTimeout(() => {
          if (!isConnected) {
            setError('Connection timeout')
            setIsConnecting(false)
            ws.close()
            resolve(false)
          }
        }, 10000) // 10 second timeout
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
      wsRef.current.close(1000) // Normal closure
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
