const jwt = require('jsonwebtoken');
const { getQuery } = require('../models/db');

// JWT secret key - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

/**
 * Middleware to verify JWT token and check user role
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const authenticate = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No token provided.'
        });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Invalid token format.'
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please log in again.'
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please authenticate.'
        });
      }

      // Check if user still exists in database
      const user = await getQuery('SELECT id, username, role FROM Users WHERE id = ?', [decoded.userId]);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please log in again.'
        });
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.'
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during authentication.'
      });
    }
  };
};

// Role-specific middleware functions
const adminOnly = () => authenticate(['admin']);
const personnelOnly = () => authenticate(['personnel']);
const authenticated = () => authenticate(['admin', 'personnel']);

// Route-specific access control middleware
const authorizeRoute = (req, res, next) => {
  const { path, method } = req;
  
  // Public routes (no authentication required)
  const publicRoutes = ['/auth/login', '/auth/register'];
  if (publicRoutes.some(route => path.startsWith(route))) {
    return next();
  }

  // Admin-only routes
  const adminRoutes = [
    { path: '/tasks', methods: ['POST'] },
    { path: '/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { path: /^\/users\/\d+$/, methods: ['GET', 'PUT', 'DELETE'] }
  ];

  // Personnel-only routes
  const personnelRoutes = [
    { path: '/user-tasks', methods: ['GET'] },
    { path: /^\/tasks\/\d+\/status$/, methods: ['PUT'] }
  ];

  // Authenticated routes (both admin and personnel)
  const authenticatedRoutes = [
    { path: '/tasks', methods: ['GET'] },
    { path: /^\/tasks\/\w+$/, methods: ['GET'] }, // /tasks/:category
    { path: '/equipment', methods: ['GET'] },
    { path: /^\/equipment\/\d+$/, methods: ['GET'] },
    { path: '/logs', methods: ['GET'] },
    { path: /^\/profile(?:\/\w*)?$/, methods: ['GET', 'PUT'] }
  ];

  // Check if route requires admin access
  const isAdminRoute = adminRoutes.some(route => 
    (typeof route.path === 'string' ? path.startsWith(route.path) : route.path.test(path)) &&
    route.methods.includes(method)
  );

  if (isAdminRoute) {
    return adminOnly()(req, res, next);
  }

  // Check if route requires personnel access
  const isPersonnelRoute = personnelRoutes.some(route => 
    (typeof route.path === 'string' ? path.startsWith(route.path) : route.path.test(path)) &&
    route.methods.includes(method)
  );

  if (isPersonnelRoute) {
    return personnelOnly()(req, res, next);
  }

  // Check if route requires authentication
  const isAuthenticatedRoute = authenticatedRoutes.some(route => 
    (typeof route.path === 'string' ? path.startsWith(route.path) : route.path.test(path)) &&
    route.methods.includes(method)
  );

  if (isAuthenticatedRoute) {
    return authenticated()(req, res, next);
  }

  // If route not found in any category, allow access (or return 404 later in the route handler)
  next();
};

module.exports = {
  authenticate,
  adminOnly,
  personnelOnly,
  authenticated,
  authorizeRoute
};