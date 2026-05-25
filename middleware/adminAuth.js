const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  // Check for token in header, query parameter, or cookie
  const token = req.header("x-auth-token") || req.query.token;

  if (!token) {
    // For HTML page requests, redirect to login
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/admin/email/login');
    }
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isEmailAdmin) {
      if (req.accepts('html') && !req.path.startsWith('/api/')) {
        return res.redirect('/admin/email/login');
      }
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    // Expired or invalid token — redirect to login
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/admin/email/login');
    }
    return res.status(401).json({ error: "Token is not valid" });
  }
}

module.exports = adminAuth;
