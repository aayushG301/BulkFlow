const userService = require("./user.service");
const {
  validateRegisterUser,
  validateUpdateUser,
  validateChangePassword,
} = require("./user.validation");

// Create user
const createUser = async (req, res, next) => {
  try {
    const validatedData = validateRegisterUser.parse(req.body);
    const user = await userService.createUser(validatedData);
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get authenticated user's profile
const getUser = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const user = await userService.getUserById(authenticatedUser._id);
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update authenticated user's profile
const updateUser = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const validatedData = validateUpdateUser.parse(req.body);
    const user = await userService.updateUser(authenticatedUser._id, validatedData);
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Change authenticated user's password
const changePassword = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const validatedData = validateChangePassword.parse(req.body);
    await userService.changePassword(authenticatedUser._id, validatedData.currentPassword, validatedData.newPassword);
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete/deactivate authenticated user's account
const deleteUser = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    await userService.deleteUser(authenticatedUser._id);
    return res.status(200).json({
      success: true,
      message: "User account deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
};