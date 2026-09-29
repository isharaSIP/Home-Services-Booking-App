/**
 * Middleware to restrict access based on user role(s).
 * Example: authorizeRoles("admin"), authorizeRoles("customer", "admin")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
