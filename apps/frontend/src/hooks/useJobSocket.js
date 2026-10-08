import { useEffect, useState } from 'react'

import { connectSocket, getSocket } from '@/socket/socket'
import { joinJobRoom, leaveJobRoom, subscribeToJobEvents } from '@/socket/socket.handlers'

// Joins the room for `jobId`, streams job:status / job:progress /
// job:completed / job:failed events into `onUpdate`, and reports
// whether the socket is currently connected + joined (for a "Live"
// indicator in the UI).
export function useJobSocket(jobId, onUpdate) {
  const [isConnected, setIsConnected] = useState(false)
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    if (!jobId) return undefined

    const socket = connectSocket()
    let cancelled = false

    const join = async () => {
      try {
        await joinJobRoom(socket, jobId)
        if (!cancelled) setIsJoined(true)
      } catch {
        if (!cancelled) setIsJoined(false)
      }
    }

    // Socket.IO rooms live on the server-side connection, not the
    // client object - when the underlying transport reconnects after a
    // network blip, that's a brand-new connection on the server and
    // the old room membership is gone. Re-joining on every 'connect'
    // (not just the first one) is what keeps "live" actually live
    // instead of silently going stale after any hiccup.
    const handleConnect = () => {
      setIsConnected(true)
      join()
    }

    const handleDisconnect = (reason) => {
      setIsConnected(false)
      setIsJoined(false)

      // socket.io-client auto-reconnects for transport-level drops
      // (wifi blip, ping timeout) but deliberately does NOT reconnect
      // when the server initiated the disconnect (e.g. a backend
      // deploy/restart) - without this, every client would silently
      // stop receiving live updates until the page is refreshed.
      if (reason === 'io server disconnect' && !cancelled) {
        socket.connect()
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    setIsConnected(socket.connected)

    // If we're already connected, join now - otherwise handleConnect
    // will run (and join) as soon as the in-flight connect finishes.
    if (socket.connected) {
      join()
    }

    const unsubscribe = subscribeToJobEvents(socket, (_event, payload) => {
      if (!payload || payload.jobId !== jobId) return
      const { jobId: _ignored, ...patch } = payload
      onUpdate?.(patch)
    })

    return () => {
      cancelled = true
      unsubscribe()
      leaveJobRoom(socket, jobId)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  return { isConnected, isJoined, isLive: isConnected && isJoined }
}

export { getSocket }
