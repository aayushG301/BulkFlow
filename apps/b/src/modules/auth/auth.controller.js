const authService = require('./auth.service');
const {
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyEmail,
    validateRefreshToken,
} = require('./auth.validation');

// Login User Controller
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const loginResult = await authService.loginUser(email, password);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: loginResult,
        });
    } catch (error) {
        next(error);
    }
};

// Forgot Password Controller
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const resetToken = await authService.forgotPassword(email);
        return res.status(200).json({
            success: true,
            message: "Password reset token sent",
            data: { resetToken },
        });
    } catch (error) {
        next(error);
    }
};

// Reset Password Controller
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        next(error);
    }
};

// Refresh Token Controller
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const newAccessToken = await authService.refreshToken(refreshToken);
        return res.status(200).json({
            success: true,
            message: "Refresh token successful",
            data: { newAccessToken },
        });
    } catch (error) {
        next(error);
    }
};

// Logout User Controller
const logoutUser = async (req, res, next) => {
    try {
        await authService.logoutUser(req.user._id);
        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        next(error);
    }
}

// Verify Email Controller
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        await authService.verifyEmail(token);
        return res.status(200).json({
            success: true,
            message: "Email verification successful",
        });
    } catch (error) {
        next(error);
    }
};

// Resend Verification Email Controller
const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.resendVerificationEmail(email);
        return res.status(200).json({
            success: true,
            message: "Verification email resent",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginUser,
    forgotPassword,
    resetPassword,
    refreshToken,
    logoutUser,
    verifyEmail,
    resendVerificationEmail,
};