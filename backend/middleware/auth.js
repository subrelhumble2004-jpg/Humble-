const { verifyAccessToken } = require("../utils/jwt");

function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
