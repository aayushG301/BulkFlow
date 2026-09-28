const express = require("express");
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const router = express.Router();

// Create user
router.post("/", userController.createUser);

// Get authenticated user
router.get("/me", authMiddleware, userController.getUser);

// Update authenticated user
router.patch("/me", authMiddleware, userController.updateUser);

// Change password
router.patch("/me/password", authMiddleware, userController.changePassword);

// Delete/deactivate account
router.delete("/me", authMiddleware, userController.deleteUser);

module.exports = router;