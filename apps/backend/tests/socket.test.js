const { io } = require("socket.io-client");

const token = "YOUR_JWT_HERE";
const jobId = "YOUR_JOB_ID";

const socket = io("http://localhost:3000", {
  auth: { token },
  transports: ["polling"],
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  socket.emit("job:join", jobId, (response) => {
    console.log("📡 Join response:", response);
  });
});

socket.on("job:status", (data) => {
  console.log("📊 Status:", data);
});

socket.on("job:progress", (data) => {
  console.log("📈 Progress:", data);
});

socket.on("job:completed", (data) => {
  console.log("🎉 Completed:", data);
  socket.disconnect();
});

socket.on("job:failed", (data) => {
  console.log("❌ Failed:", data);
  socket.disconnect();
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});