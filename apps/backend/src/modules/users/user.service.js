const User = require("./user.model");
const {hashPassword, comparePassword} = require("../../utils/password.utils");

// Create User
const createUser = async (validatedData) => {
  const { name, email, password, avatar } = validatedData;
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }
  // Hash password
  const hashedPassword = await hashPassword(password);
  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    avatar,
  });
  // Never return password
  user.password = undefined;
  return user;
};

// Get User by ID
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return user;
};

// Get User by Email
const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return user;
};

// Update User Info
const updateUser = async (userId, validatedData) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (validatedData.name !== undefined) {
    user.name = validatedData.name;
  }

  if (validatedData.avatar !== undefined) {
    user.avatar = validatedData.avatar;
  }

  await user.save();

  return user;
};

// Change User Password
const changePassword = async (userId, currentPassword, newPassword) => {
  // Password is required for comparison
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  if(!user.isActive) {
    const error = new Error("User is inactive");
    error.status = 401;
    throw error;
  }

  // Check current password
  const isPasswordCorrect = await comparePassword(
    currentPassword,
    user.password
  );

  if (!isPasswordCorrect) {
    const error = new Error("Current password is incorrect");
    error.status = 401;
    throw error;
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  user.password = hashedPassword;

  await user.save();
  return true;
};

// Delete / Deactivate User
const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Soft delete
  user.isActive = false;

  await user.save();

  return true;
};

// Update Last Login Time
const updateLastLogin = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  user.lastLoginAt = new Date();

  await user.save();

  return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  changePassword,
  deleteUser,
  updateLastLogin,
};