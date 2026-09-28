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

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => {
      setIsConnected(false)
      setIsJoined(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    setIsConnected(socket.connected)

    const join = async () => {
      try {
        if (!socket.connected) {
          await new Promise((resolve) => socket.once('connect', resolve))
        }
        await joinJobRoom(socket, jobId)
        if (!cancelled) setIsJoined(true)
      } catch {
        if (!cancelled) setIsJoined(false)
      }
    }

    join()

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
