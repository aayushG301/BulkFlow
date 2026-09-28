const { getDashboard } = require("./dashboard.service");

const getDashboardController = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const dashboard = await getDashboard(userId);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardController,
};
