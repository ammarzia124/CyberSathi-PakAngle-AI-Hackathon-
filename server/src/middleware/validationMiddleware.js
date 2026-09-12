import { validate, validateUrl, validateUrlArray } from "../utils/validation.js";
import { NotFoundError } from "../utils/errors.js";

export { validate, validateUrl, validateUrlArray };

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !/^[0-9a-fA-F]{24}$/.test(value)) {
      return next(new NotFoundError("Invalid ID format"));
    }
    next();
  };
};
