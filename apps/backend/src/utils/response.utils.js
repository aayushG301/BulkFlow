// Send Success Response
const sendSuccess = async (res, message, data) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

// Send Created Response
const sendCreated = async (res, message, data) => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

// Send Error Response
const sendError = async (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Send Paginated Response
const sendPaginated = async (res, message, data) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

// Send No Content Response
const sendNoContent = async (res, message) => {
  return res.status(204).json({
    success: true,
    message,
  });
};
