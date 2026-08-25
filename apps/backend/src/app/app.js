const express = require("express");
const userRoutes = require("../modules/users/user.routes");

const app = express();

app.use(express.json());
app.use("/api/v1/users", userRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({success: true, message: "BulkFlow is Running Successfully"});
});

module.exports = app;