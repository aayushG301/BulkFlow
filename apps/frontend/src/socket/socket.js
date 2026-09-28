import { io } from 'socket.io-client'

import { storage } from '@/utils/storage'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let socket = null

// A single shared socket for the whole app - pages join/leave job
// rooms on it rather than each opening their own connection.
export const getSocket = () => {
  if (socket) return socket

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: storage.getAccessToken() }),
    transports: ['websocket', 'polling'],
  })

  return socket
}

export const connectSocket = () => {
  const instance = getSocket()
  if (!instance.connected) instance.connect()
  return instance
}

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect()
}
