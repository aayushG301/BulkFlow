import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: accessToken,
  },
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("job:join", jobId, (response) => {
    console.log("Join:", response);
  });
});

socket.on("job:status", (data) => {
  console.log("Status:", data);
});

socket.on("job:progress", (data) => {
  console.log("Progress:", data);
});

socket.on("job:completed", (data) => {
  console.log("Completed:", data);
});

socket.on("job:failed", (data) => {
  console.log("Failed:", data);
});
