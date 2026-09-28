const { ZodError } = require("zod");

// Validate Request Data
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    // Validating request data
       try {
      const validatedData = schema.parse(req[source]);

      // Storing validated data separately
      req.validated = req.validated || {};
      req.validated[source] = validatedData;

      return next();
    } catch (error) {
        // Handling Zod Validation Error
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      return next(error);
    }
  };
};

module.exports = validate;