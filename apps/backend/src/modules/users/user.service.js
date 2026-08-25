const User = require("./user.model");
const { hashPassword, comparePassword } = require("../../utils/password.utils");

// Create the User
const createUser = async (validatedData) => {
    const email = validatedData.email;
    // Validate the email
    if(!email) {
        error.status = 400;
        error.message = "Email is required";
        throw error;
    }
    // Check if the email already exists
    const existingUser = await User.findOne({email});
    if(existingUser) {
        error.status = 400;
        error.message = "Email already exists";
        throw error;
    }
    // Validate the password
    if(!validatedData.password) {
        error.status = 400;
        error.message = "Password is required";
        throw error;    
    }
    const hashedPassword = await hashPassword(validatedData.password);
    const user = new User({
        email,
        password: hashedPassword,
    });
    return user;
};

// Get the User by ID
const getUserById = async (userId) => {
    const user = await User.findById(userId).select("-password");
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    return user;
};

// Get the User by Email
const getUserByEmail = async (email) => {
    const user = await User.findOne({email}).select("-password");
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    return user;
};

// Update the User Info
const updateUser = async (userId, validatedData) => {
    const user = await User.findById(userId).select("-password");
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    // Update the lastLogin field if it's included in validatedData
    if (validatedData.lastLogin) {
        user.lastLogin = validatedData.lastLogin;
    }
    // Update the user info
    user.name = validatedData.name;
    user.email = validatedData.email;
    user.role = validatedData.role;
    // Save the user
    await user.save();
    return user;
};

// Change the User Password
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select("-password");
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    // Validate the current password
    if(!await comparePassword(currentPassword, user.password)) {
        error.status = 400;
        error.message = "Current password is incorrect";
        throw error;
    }
    // Validate the new password
    if(!newPassword) {
        error.status = 400;
        error.message = "New password is required";
        throw error;
    }
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    // Save the user
    await user.save();
    return user;
};

//Delete the User
const deleteUser = async (userId) => {
    const user = await User.findById(userId);
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    // Delete the user
    await user.delete();
    return user;
};

// Update Last Login Time
const updateLastLogin = async (userId) => {
    const user = await User.findById(userId);
    if(!user) {
        error.status = 404;
        error.message = "User not found";
        throw error;
    }
    // Update the last login time
    user.lastLogin = Date.now();
    // Save the user
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