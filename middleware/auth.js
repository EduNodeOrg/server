const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.header("x-auth-token");

    //check token

    if(!token) return res.status(401).json({ msg: "no token, auth denied"})

    try {
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[auth] decoded token payload:', decoded);
        // add user to payload
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[auth] token verification failed:', err.message);
        res.status(400).json({ msg: "token is not valid"})
    }
}

module.exports = auth;