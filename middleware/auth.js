const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.header("x-auth-token");

    //check token

    if(!token) return res.status(401).json({ msg: "no token, auth denied"})

    try {
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // add user to payload
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ msg: "token is not valid"})
    }
}

module.exports = auth;