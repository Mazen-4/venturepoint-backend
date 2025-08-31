const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "venturepoint_secret";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}

module.exports = { authenticateToken, JWT_SECRET, requireRole };
