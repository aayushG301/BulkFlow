const { getUserByEmail, updateLastLogin, sanitizeUser } = require("../users/user.service");
const User = require("../users/user.model");
const { comparePassword, hashPassword } = require("../../utils/password.utils");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generatePasswordResetToken,
    hashToken,
} = require("../../utils/token.utils");

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
    // Generate access + refresh tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store a hash of the refresh token so it can be checked (and
    // revoked on logout) without keeping the raw token in the database
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    // Update last login time
    await updateLastLogin(user._id);

    sanitizeUser(user);

    return {
        accessToken,
        refreshToken,
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
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // A password reset should also invalidate any refresh token that
    // was issued before the account may have been compromised
    user.refreshToken = null;
    await user.save();
    return true;
};

// Refresh Access Token
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.status = 400;
        throw error;
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        const invalidTokenError = new Error("Invalid or expired refresh token");
        invalidTokenError.status = 401;
        throw invalidTokenError;
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    // The stored hash must match the token presented - this lets
    // logout (or a password reset) revoke a refresh token server-side
    const hashedIncomingToken = hashToken(refreshToken);
    if (user.refreshToken !== hashedIncomingToken) {
        const error = new Error("Refresh token has been revoked");
        error.status = 401;
        throw error;
    }

    return generateAccessToken(user._id);
};

// Logout User
const logoutUser = async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
        return;
    }
    user.refreshToken = null;
    await user.save();
}

// Verify Email
const verifyEmail = async (token) => {
    const hashedToken = hashToken(token);

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: {
            $gt: new Date(),
        },
    });

    if (!user) {
        const error = new Error("Invalid or expired verification token");
        error.status = 400;
        throw error;
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    return true;
}

// Resend Verification Email
const resendVerificationEmail = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        return;
    }
    if (user.isEmailVerified) {
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
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
};
