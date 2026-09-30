import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 1 week
//const SESSION_TTL_SECONDS = 60 * 60 // 1 week

export function issueSession(res, user) {
    const token = jwt.sign(
        { sub: user.id, username: user.username, person_id: user.person_id },
        JWT_SECRET,
        { expiresIn: SESSION_TTL_SECONDS }
    )

    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TTL_SECONDS * 1000,
        path: '/',
    })

    return expiresAt // ms epoch — safe to send to the frontend, it's not secret
}