import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes request body to prevent XSS attacks
 */
export const sanitizeXSS = (req, res, next) => {
  if (req.body) {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {}
        });
      } else if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item));
      } else if (value !== null && typeof value === 'object') {
        return sanitizeObject(value);
      }
      return value;
    };

    const sanitizeObject = (obj) => {
      const result = {};
      for (const key in obj) {
        result[key] = sanitizeValue(obj[key]);
      }
      return result;
    };

    req.body = sanitizeValue(req.body);
  }
  next();
};