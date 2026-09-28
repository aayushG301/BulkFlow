import { SOCKET_EVENTS } from '@/socket/socket.events'

// Wraps the ack-style job:join emit in a promise so callers can await
// confirmation (or a "not found / not yours" rejection) instead of
// juggling a raw callback.
export const joinJobRoom = (socket, jobId) =>
  new Promise((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.JOIN_JOB, jobId, (ack) => {
      if (ack?.success) {
        resolve(ack)
      } else {
        reject(new Error(ack?.message || 'Could not join job room'))
      }
    })
  })

export const leaveJobRoom = (socket, jobId) => {
  socket.emit(SOCKET_EVENTS.LEAVE_JOB, jobId)
}

// Subscribes to every job:* event and forwards it to a single handler
// along with which event it was - returns an unsubscribe function.
export const subscribeToJobEvents = (socket, handler) => {
  const events = [
    SOCKET_EVENTS.JOB_STATUS,
    SOCKET_EVENTS.JOB_PROGRESS,
    SOCKET_EVENTS.JOB_COMPLETED,
    SOCKET_EVENTS.JOB_FAILED,
  ]

  const listeners = events.map((event) => {
    const listener = (payload) => handler(event, payload)
    socket.on(event, listener)
    return [event, listener]
  })

  return () => {
    listeners.forEach(([event, listener]) => socket.off(event, listener))
  }
}
