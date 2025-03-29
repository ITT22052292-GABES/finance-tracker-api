/**
 * Middleware to protect against NoSQL injection
 */
export const preventNoSQLInjection = (req, res, next) => {
    // Check if body contains NoSQL operators
    const body = req.body;
    const query = req.query;
    
    // Function to detect MongoDB operators
    const containsOperators = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      
      return Object.keys(obj).some(key => {
        // Check for MongoDB operators like $ne, $gt, $where, etc.
        if (key.startsWith('$')) return true;
        
        // Recursively check nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          return containsOperators(obj[key]);
        }
        
        return false;
      });
    };
    
    // Check request body and query params for operators
    if (containsOperators(body) || containsOperators(query)) {
      return res.status(400).json({ 
        error: "Potential security threat detected" 
      });
    }
    
    // Sanitize route parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        // Check if param contains MongoDB operators
        if (typeof req.params[key] === 'string' && 
            (req.params[key].includes('$') || 
             req.params[key].includes('{') || 
             req.params[key].includes('}'))) {
          return res.status(400).json({ 
            error: "Invalid parameters" 
          });
        }
      });
    }
    
    next();
  };