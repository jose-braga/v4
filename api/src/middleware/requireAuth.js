// middleware/requireAuth.js
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export function requireAuth(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated.' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = { id: decoded.sub, username: decoded.username }
        next()
    } catch (err) {
        // Covers both expired tokens (TokenExpiredError) and tampered/invalid
        // ones (JsonWebTokenError) — both should look identical to the client.
        return res.status(401).json({ message: 'Session expired or invalid.' })
    }
}