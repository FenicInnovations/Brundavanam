/**
 * Use after `protect`. Restricts a route to users with isAdmin=true.
 */
function adminOnly(req, res, next) {
  if (req.user?.isAdmin) return next();

  const err = new Error("Admin access required");
  err.statusCode = 403;
  next(err);
}

module.exports = { adminOnly };
