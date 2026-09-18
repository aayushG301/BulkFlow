const jwt = require("jsonwebtoken");
const env = require("../config/env");

const socketAuth = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    socket.user = {
      id: decoded.id || decoded.userId,
    };

    if (!socket.user.id) {
      return next(new Error("Invalid authentication token"));
    }

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuth;
