const { getUserByEmail, updateLastLogin } = require("../users/user.service");
const User = require("../users/user.model");
const { comparePassword, hashPassword } = require("../../utils/password.utils");

const { generateAccessToken, generatePasswordResetToken, hashToken } = require("../../utils/token.utils");

// Login User
const loginUser = async (email, password) => {
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    if (!user.isActive) {
        const error = new Error("User account is inactive");
        error.status = 403;
        throw error;
    }

    // Compare password
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }
    // Generate access token
    const accessToken = generateAccessToken(user._id);
    // Update last login time
    await updateLastLogin(user._id);
    user.password = undefined;
    return {
        accessToken,
        user,
    };
};

// Forgot Password
const forgotPassword = async (email) => {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return;
    }
    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const hashedResetToken = hashToken(resetToken);
    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    return resetToken;
    };

    // Reset Password
    const resetPassword = async (token, newPassword) => {
    const hashedToken = hashToken(token);
    // Check if token is valid
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
        $gt: new Date(),
        },
    });
    if (!user) {
        const error = new Error("Invalid or expired password reset token");
        error.status = 400;
        throw error;
    }
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;

    // Invalidate reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return true;
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
}

// Refresh Access Token
const refreshAccessToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
}

// Logout User
const logoutUser = async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return;
    }
    user.refreshToken = undefined;
    await user.save();
}

// Verify Email
const verifyEmail = async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return;
    }
    user.isActive = true;
    await user.save();
}

// Resend Verification Email
const resendVerificationEmail = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        return;
    }
    // Generate verification token
    const verificationToken = generatePasswordResetToken();
    const hashedVerificationToken = hashToken(verificationToken);
    user.verificationToken = hashedVerificationToken;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    return verificationToken;
}

module.exports = {
  loginUser,
  forgotPassword,
  resetPassword,
  generateRefreshToken,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
};