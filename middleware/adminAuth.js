const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  // Detect API requests: has x-auth-token header or originalUrl starts with /api/
  const isApiRequest = req.header("x-auth-token") || req.originalUrl.startsWith('/api/');
  
  const token = req.header("x-auth-token") || req.query.token;

  if (!token) {
    if (!isApiRequest) {
      return res.redirect('/admin/email/login');
    }
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isEmailAdmin) {
      if (!isApiRequest) {
        return res.redirect('/admin/email/login');
      }
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (!isApiRequest) {
      return res.redirect('/admin/email/login');
    }
    return res.status(401).json({ error: "Token is not valid" });
  }
}

module.exports = adminAuth;
