/**
 * Middleware to restrict access to authenticated users with specified roles.
 * Usage: protect, authorizeRoles("admin", "super_admin")
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Authentication required");
      err.statusCode = 401;
      return next(err);
    }

    const userRole = req.user.role || (req.user.isAdmin ? "admin" : "customer");

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      const err = new Error(`Access forbidden. Role '${userRole}' is not authorized.`);
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
}

/**
 * Backward compatible admin-only check.
 */
function adminOnly(req, res, next) {
  return authorizeRoles("admin", "super_admin")(req, res, next);
}

module.exports = { adminOnly, authorizeRoles };
